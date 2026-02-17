import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  getSessionIdFromCookies,
  isSessionValid,
  getSession,
} from "@/lib/session";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";
import { enforceSpendCap, SpendCapError } from "@/lib/spend-cap";

// ============================================================================
// Types
// ============================================================================

export type ToolProtectionResult =
  | { ok: true; sessionId: string }
  | { ok: false; response: NextResponse };

export interface ToolProtectionOptions {
  /** Skip rate limit enforcement (default: false) */
  skipRateLimit?: boolean;
  /** Skip spend cap enforcement (default: false) */
  skipSpendCap?: boolean;
}

// ============================================================================
// Internal Helper: Check Captcha Passed
// ============================================================================

/**
 * Check if the captcha has been passed for a session.
 * Reads the session from Firestore and checks the captchaPassedAt field.
 */
async function hasCaptchaPassed(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  return !!session.captchaPassedAt;
}

// ============================================================================
// Main Wrapper
// ============================================================================

/**
 * Run the standard 4-check security pattern for tool routes:
 * 1. Session check (cookie present + not expired)
 * 2. Captcha check (captchaPassedAt set on session)
 * 3. Rate limit enforcement (unless skipRateLimit is true)
 * 4. Spend cap enforcement (unless skipSpendCap is true)
 *
 * Returns `{ ok: true, sessionId }` on success, or `{ ok: false, response }`
 * with a pre-built NextResponse containing the exact error shape used by
 * the tool routes.
 *
 * @param request - The incoming Next.js request
 * @param options - Optional flags to skip rate limit or spend cap checks
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const protection = await withToolProtection(request);
 *   if (!protection.ok) return protection.response;
 *   const { sessionId } = protection;
 *   // ... handle the request
 * }
 * ```
 */
export async function withToolProtection(
  request: NextRequest,
  options?: ToolProtectionOptions
): Promise<ToolProtectionResult> {
  const { skipRateLimit = false, skipSpendCap = false } = options ?? {};

  // 1. Check session
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "No session found. Please refresh the page.",
          code: "NO_SESSION",
        },
        { status: 401 }
      ),
    };
  }

  const sessionValid = await isSessionValid(sessionId);
  if (!sessionValid) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Session expired. Please refresh the page.",
          code: "SESSION_EXPIRED",
        },
        { status: 401 }
      ),
    };
  }

  // 2. Check captcha
  const captchaPassed = await hasCaptchaPassed(sessionId);
  if (!captchaPassed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Please complete the captcha verification first.",
          code: "CAPTCHA_REQUIRED",
        },
        { status: 403 }
      ),
    };
  }

  // 3. Enforce rate limit
  if (!skipRateLimit) {
    try {
      await enforceRateLimit(request);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              error: error.message,
              code: "RATE_LIMIT_EXCEEDED",
              contactEmail: error.contactEmail,
            },
            { status: error.statusCode }
          ),
        };
      }
      throw error;
    }
  }

  // 4. Enforce spend cap
  if (!skipSpendCap) {
    try {
      await enforceSpendCap();
    } catch (error) {
      if (error instanceof SpendCapError) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              error: error.message,
              code: "SPEND_CAP_EXCEEDED",
              contactEmail: error.contactEmail,
            },
            { status: error.statusCode }
          ),
        };
      }
      throw error;
    }
  }

  return { ok: true, sessionId };
}
