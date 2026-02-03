import { NextRequest, NextResponse } from "next/server";
import { verifyCaptchaToken } from "@/lib/captcha";
import {
  getSessionIdFromCookies,
  isSessionValid,
  markCaptchaPassed,
} from "@/lib/session";

// ============================================================================
// Types
// ============================================================================

interface VerifyRequest {
  token: string;
}

interface VerifySuccessResponse {
  success: true;
}

interface VerifyErrorResponse {
  success: false;
  error: string;
}

type VerifyResponse = VerifySuccessResponse | VerifyErrorResponse;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract client IP from request headers.
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "127.0.0.1";
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/captcha/verify
 *
 * Verifies a reCAPTCHA token and marks the session as captcha-passed.
 *
 * Request body:
 * - token: string - The reCAPTCHA response token from the client widget
 *
 * Response:
 * - success: true - Captcha verified and session marked
 * - success: false, error: string - Verification failed with reason
 *
 * Requirements:
 * - Must have a valid session (call /api/session/init first)
 * - Session is updated with captchaPassedAt timestamp on success
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<VerifyResponse>> {
  try {
    // Parse request body
    let body: VerifyRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { token } = body;

    // Validate token is present
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing captcha token" },
        { status: 400 }
      );
    }

    // Get and validate session
    const sessionId = await getSessionIdFromCookies();
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "No session found. Please refresh the page." },
        { status: 401 }
      );
    }

    const sessionValid = await isSessionValid(sessionId);
    if (!sessionValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Session expired. Please refresh the page.",
        },
        { status: 401 }
      );
    }

    // Verify the captcha token with Google
    const clientIp = getClientIp(request);
    const result = await verifyCaptchaToken(token, clientIp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Captcha verification failed" },
        { status: 400 }
      );
    }

    // Mark the session as captcha-passed
    await markCaptchaPassed(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Captcha verify error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
