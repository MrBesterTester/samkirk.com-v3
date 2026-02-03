import "server-only";

import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { Timestamp } from "@google-cloud/firestore";
import { getRateLimitRef, type RateLimitDoc } from "./firestore";
import { getSessionIdFromCookies, hashIp } from "./session";

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of requests allowed per window */
export const RATE_LIMIT_MAX_REQUESTS = 10;

/** Rate limit window duration in milliseconds (10 minutes) */
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/** Rate limit key prefix for tool endpoints */
export const RATE_LIMIT_KEY_PREFIX = "tools";

/** Contact email for rate limit exceeded message */
export const RATE_LIMIT_CONTACT_EMAIL = "sam@samkirk.com";

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error thrown when rate limit is exceeded.
 */
export class RateLimitError extends Error {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly statusCode = 429;
  readonly contactEmail: string;
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(
      `Rate limit exceeded. Please contact ${RATE_LIMIT_CONTACT_EMAIL} for access.`
    );
    this.name = "RateLimitError";
    this.contactEmail = RATE_LIMIT_CONTACT_EMAIL;
    this.retryAfterMs = retryAfterMs;
  }

  /**
   * Get the error as a JSON response payload.
   */
  toJSON() {
    return {
      error: "rate_limit_exceeded",
      message: this.message,
      contactEmail: this.contactEmail,
      retryAfterMs: this.retryAfterMs,
    };
  }
}

// ============================================================================
// IP Extraction
// ============================================================================

/**
 * Extract client IP from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 *
 * Note: This is a centralized helper that should be used across all routes
 * that need client IP information.
 */
export function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For header (common for proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Check X-Real-IP header (used by nginx)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback: use a placeholder for local development
  return "127.0.0.1";
}

// ============================================================================
// Rate Limit Key Derivation
// ============================================================================

/**
 * Derive a rate limit key from session ID and IP hash.
 *
 * The key format is: {prefix}:{hash(sessionId:ipHash)}
 *
 * We hash the combination to:
 * 1. Keep the key length manageable in Firestore
 * 2. Avoid storing raw session IDs in rate limit documents
 *
 * @param sessionId - The session ID from the cookie
 * @param ipHash - The hashed IP address
 * @param prefix - Optional prefix for the key (defaults to "tools")
 * @returns A stable key for rate limiting
 */
export function deriveRateLimitKey(
  sessionId: string,
  ipHash: string,
  prefix: string = RATE_LIMIT_KEY_PREFIX
): string {
  // Combine session and IP, then hash for privacy and brevity
  const combined = `${sessionId}:${ipHash}`;
  const hash = createHash("sha256").update(combined).digest("hex").substring(0, 32);
  return `${prefix}:${hash}`;
}

/**
 * Derive the rate limit key from a request.
 * Extracts session ID from cookies and IP from headers.
 *
 * @param request - The incoming request
 * @returns The rate limit key, or null if no session exists
 */
export async function deriveRateLimitKeyFromRequest(
  request: NextRequest
): Promise<string | null> {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return null;
  }

  const clientIp = getClientIp(request);
  const ipHash = hashIp(clientIp);

  return deriveRateLimitKey(sessionId, ipHash);
}

// ============================================================================
// Window Helpers
// ============================================================================

/**
 * Create rate limit window timestamps.
 * Returns windowStart and expiresAt as Firestore Timestamps.
 */
export function createRateLimitWindow(): {
  windowStart: Timestamp;
  expiresAt: Timestamp;
} {
  const now = Date.now();
  const expiresAtMs = now + RATE_LIMIT_WINDOW_MS;

  return {
    windowStart: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAtMs),
  };
}

/**
 * Create rate limit window timestamps from a custom date (for testing).
 *
 * @param baseDate - The date to use as "now"
 */
export function createRateLimitWindowFromDate(baseDate: Date): {
  windowStart: Timestamp;
  expiresAt: Timestamp;
} {
  const now = baseDate.getTime();
  const expiresAtMs = now + RATE_LIMIT_WINDOW_MS;

  return {
    windowStart: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAtMs),
  };
}

/**
 * Check if a rate limit window has expired.
 *
 * @param expiresAt - The window expiration timestamp
 * @param now - Optional current time (for testing)
 */
export function isWindowExpired(
  expiresAt: Timestamp,
  now: number = Date.now()
): boolean {
  return now >= expiresAt.toMillis();
}

/**
 * Calculate the time remaining in the current window.
 *
 * @param expiresAt - The window expiration timestamp
 * @param now - Optional current time (for testing)
 * @returns Time remaining in milliseconds (0 if expired)
 */
export function getWindowRemainingMs(
  expiresAt: Timestamp,
  now: number = Date.now()
): number {
  const remaining = expiresAt.toMillis() - now;
  return Math.max(0, remaining);
}

// ============================================================================
// Rate Limit Enforcement
// ============================================================================

/**
 * Check and update the rate limit counter for a key.
 * This is the core rate limiting logic.
 *
 * @param key - The rate limit key
 * @param maxRequests - Maximum requests per window (defaults to RATE_LIMIT_MAX_REQUESTS)
 * @returns The current count after incrementing
 * @throws RateLimitError if the limit is exceeded
 */
export async function checkAndIncrementRateLimit(
  key: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS
): Promise<{ count: number; windowStart: Timestamp; expiresAt: Timestamp }> {
  const rateLimitRef = getRateLimitRef(key);
  const now = Date.now();

  // Use a Firestore transaction to ensure atomicity
  const firestore = rateLimitRef.firestore;
  const result = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateLimitRef);
    const existingDoc = snapshot.exists
      ? (snapshot.data() as RateLimitDoc)
      : null;

    // Check if we need to start a new window
    let doc: RateLimitDoc;

    if (!existingDoc || isWindowExpired(existingDoc.expiresAt, now)) {
      // Start a new window
      const { windowStart, expiresAt } = createRateLimitWindow();
      doc = {
        windowStart,
        count: 1,
        expiresAt,
      };
    } else {
      // Increment existing window
      const newCount = existingDoc.count + 1;

      // Check if we're exceeding the limit
      if (newCount > maxRequests) {
        const retryAfterMs = getWindowRemainingMs(existingDoc.expiresAt, now);
        throw new RateLimitError(retryAfterMs);
      }

      doc = {
        windowStart: existingDoc.windowStart,
        count: newCount,
        expiresAt: existingDoc.expiresAt,
      };
    }

    // Write the updated document
    transaction.set(rateLimitRef, doc);

    return doc;
  });

  return result;
}

/**
 * Enforce rate limiting for a request.
 *
 * This is the main entry point for rate limiting in API routes.
 * Call this at the beginning of tool endpoints.
 *
 * @param request - The incoming Next.js request
 * @throws RateLimitError if the limit is exceeded
 * @throws Error if no valid session exists
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   try {
 *     await enforceRateLimit(request);
 *     // ... handle the request
 *   } catch (error) {
 *     if (error instanceof RateLimitError) {
 *       return NextResponse.json(error.toJSON(), { status: error.statusCode });
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export async function enforceRateLimit(request: NextRequest): Promise<void> {
  const key = await deriveRateLimitKeyFromRequest(request);

  if (!key) {
    throw new Error("No valid session found for rate limiting");
  }

  await checkAndIncrementRateLimit(key);
}

/**
 * Get the current rate limit status for a request without incrementing.
 * Useful for displaying remaining requests to the user.
 *
 * @param request - The incoming Next.js request
 * @returns Current count and window info, or null if no limit exists
 */
export async function getRateLimitStatus(
  request: NextRequest
): Promise<{
  count: number;
  remaining: number;
  windowExpiresAt: Date;
  isLimited: boolean;
} | null> {
  const key = await deriveRateLimitKeyFromRequest(request);

  if (!key) {
    return null;
  }

  const rateLimitRef = getRateLimitRef(key);
  const snapshot = await rateLimitRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const doc = snapshot.data() as RateLimitDoc;
  const now = Date.now();

  // Check if window has expired
  if (isWindowExpired(doc.expiresAt, now)) {
    return null;
  }

  return {
    count: doc.count,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - doc.count),
    windowExpiresAt: doc.expiresAt.toDate(),
    isLimited: doc.count >= RATE_LIMIT_MAX_REQUESTS,
  };
}
