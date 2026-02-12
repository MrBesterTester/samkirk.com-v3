import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionId,
  getSessionIdFromCookies,
  setSessionCookie,
  createSession,
  getSession,
  isSessionValid,
  hashIp,
  SESSION_TTL_MS,
} from "@/lib/session";

/**
 * Response type for session init endpoint.
 */
interface SessionInitResponse {
  sessionId: string;
  expiresAt: string;
  isNew: boolean;
  captchaPassed: boolean;
}

/**
 * Error response type.
 */
interface ErrorResponse {
  error: string;
}

/**
 * Extract client IP from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 */
function getClientIp(request: NextRequest): string {
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

/**
 * POST /api/session/init
 *
 * Creates a new session or validates an existing one.
 *
 * Behavior:
 * - If no session cookie exists, creates a new session
 * - If a valid session cookie exists and session is not expired, returns existing session info
 * - If session cookie exists but session is expired/invalid, creates a new session
 *
 * Response:
 * - sessionId: The session identifier
 * - expiresAt: ISO timestamp when the session expires
 * - isNew: Whether a new session was created
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SessionInitResponse | ErrorResponse>> {
  try {
    // Try to get existing session from cookies
    const existingSessionId = await getSessionIdFromCookies();

    if (existingSessionId) {
      // Check if the existing session is still valid in Firestore
      const isValid = await isSessionValid(existingSessionId);

      if (isValid) {
        // Session exists and is valid - check if captcha already passed
        const sessionDoc = await getSession(existingSessionId);
        const captchaPassed = !!sessionDoc?.captchaPassedAt;
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

        return NextResponse.json({
          sessionId: existingSessionId,
          expiresAt,
          isNew: false,
          captchaPassed,
        });
      }
    }

    // No valid session - create a new one
    const sessionId = generateSessionId();
    const clientIp = getClientIp(request);
    const ipHash = hashIp(clientIp);

    // Create session in Firestore
    const sessionData = await createSession(sessionId, ipHash);

    // Set the session cookie
    await setSessionCookie(sessionId);

    return NextResponse.json({
      sessionId,
      expiresAt: sessionData.expiresAt.toDate().toISOString(),
      isNew: true,
      captchaPassed: false,
    });
  } catch (error) {
    console.error("Session init error:", error);

    // Don't expose internal error details to clients
    return NextResponse.json(
      { error: "Failed to initialize session" },
      { status: 500 }
    );
  }
}
