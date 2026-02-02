import "server-only";

import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { Timestamp } from "@google-cloud/firestore";
import { getSessionRef, type SessionDoc } from "./firestore";

// ============================================================================
// Constants
// ============================================================================

/** Session cookie name */
export const SESSION_COOKIE_NAME = "session_id";

/** Session ID length in bytes (32 bytes = 256 bits of entropy) */
export const SESSION_ID_BYTES = 32;

/** Session TTL in milliseconds (7 days) */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Session TTL in seconds (for cookie maxAge) */
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

// ============================================================================
// Session ID Generation
// ============================================================================

/**
 * Generate a cryptographically random session ID.
 * Returns a URL-safe base64 string (43 characters for 32 bytes).
 */
export function generateSessionId(): string {
  const bytes = randomBytes(SESSION_ID_BYTES);
  // Use base64url encoding (URL-safe, no padding)
  return bytes.toString("base64url");
}

/**
 * Validate that a session ID has the expected format.
 * Must be a base64url string of the expected length.
 */
export function isValidSessionId(sessionId: string): boolean {
  // 32 bytes in base64url = 43 characters (no padding)
  if (sessionId.length !== 43) {
    return false;
  }
  // Check for valid base64url characters
  return /^[A-Za-z0-9_-]+$/.test(sessionId);
}

// ============================================================================
// Cookie Operations
// ============================================================================

/**
 * Cookie configuration options for the session cookie.
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: Only sent over HTTPS (in production)
 * - sameSite: Strict CSRF protection
 * - path: Available across the entire site
 */
export function getSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  maxAge: number;
} {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

/**
 * Get the current session ID from cookies, if present and valid.
 */
export async function getSessionIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  if (!isValidSessionId(sessionCookie.value)) {
    return null;
  }

  return sessionCookie.value;
}

/**
 * Set the session cookie with the given session ID.
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  const options = getSessionCookieOptions();

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, options);
}

// ============================================================================
// Firestore Session Operations
// ============================================================================

/**
 * Create session expiration timestamps.
 * Returns both createdAt and expiresAt as Firestore Timestamps.
 */
export function createSessionTimestamps(): {
  createdAt: Timestamp;
  expiresAt: Timestamp;
} {
  const now = Date.now();
  const expiresAtMs = now + SESSION_TTL_MS;

  return {
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAtMs),
  };
}

/**
 * Create a new session in Firestore.
 * Returns the session document data.
 */
export async function createSession(
  sessionId: string,
  ipHash?: string
): Promise<SessionDoc> {
  const { createdAt, expiresAt } = createSessionTimestamps();

  const sessionData: SessionDoc = {
    createdAt,
    expiresAt,
    ...(ipHash && { ipHash }),
  };

  const sessionRef = getSessionRef(sessionId);
  await sessionRef.set(sessionData);

  return sessionData;
}

/**
 * Get a session from Firestore.
 * Returns null if the session doesn't exist.
 */
export async function getSession(
  sessionId: string
): Promise<SessionDoc | null> {
  const sessionRef = getSessionRef(sessionId);
  const snapshot = await sessionRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as SessionDoc;
}

/**
 * Check if a session exists and is not expired.
 */
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);

  if (!session) {
    return false;
  }

  const now = Date.now();
  const expiresAtMs = session.expiresAt.toMillis();

  return now < expiresAtMs;
}

/**
 * Update the captchaPassedAt timestamp on a session.
 */
export async function markCaptchaPassed(sessionId: string): Promise<void> {
  const sessionRef = getSessionRef(sessionId);
  await sessionRef.update({
    captchaPassedAt: Timestamp.now(),
  });
}

// ============================================================================
// IP Hashing (for rate limiting)
// ============================================================================

/**
 * Hash an IP address for storage (privacy-preserving).
 * Uses SHA-256 truncated to first 16 hex characters.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").substring(0, 16);
}
