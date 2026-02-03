import "server-only";

import { getEnv } from "./env";

// ============================================================================
// Types
// ============================================================================

/**
 * Response from Google's reCAPTCHA verification API.
 * @see https://developers.google.com/recaptcha/docs/verify
 */
export interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string; // Timestamp of the challenge (ISO format)
  hostname?: string; // Hostname of the site where the reCAPTCHA was solved
  "error-codes"?: string[]; // Error codes if verification failed
}

/**
 * Result of captcha verification.
 */
export interface CaptchaVerifyResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Google reCAPTCHA verification API endpoint */
export const RECAPTCHA_VERIFY_URL =
  "https://www.google.com/recaptcha/api/siteverify";

// ============================================================================
// Verification Logic
// ============================================================================

/**
 * Build the request body for reCAPTCHA verification.
 * Returns URL-encoded form data as required by the API.
 */
export function buildVerifyRequestBody(
  secretKey: string,
  token: string,
  remoteIp?: string
): string {
  const params = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (remoteIp) {
    params.append("remoteip", remoteIp);
  }

  return params.toString();
}

/**
 * Verify a reCAPTCHA token with Google's API.
 *
 * @param token - The reCAPTCHA response token from the client
 * @param remoteIp - Optional client IP address for additional security
 * @returns Verification result with success status and optional error message
 */
export async function verifyCaptchaToken(
  token: string,
  remoteIp?: string
): Promise<CaptchaVerifyResult> {
  // Validate token format
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      error: "Missing or invalid captcha token",
    };
  }

  const env = getEnv();
  const requestBody = buildVerifyRequestBody(
    env.RECAPTCHA_SECRET_KEY,
    token,
    remoteIp
  );

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `reCAPTCHA API returned status ${response.status}`,
      };
    }

    const data: RecaptchaVerifyResponse = await response.json();

    if (data.success) {
      return { success: true };
    }

    // Map error codes to user-friendly messages
    const errorMessage = mapRecaptchaErrorCodes(data["error-codes"]);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    // Network or parsing error
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: "Failed to verify captcha",
    };
  }
}

/**
 * Map reCAPTCHA error codes to user-friendly messages.
 * @see https://developers.google.com/recaptcha/docs/verify#error_code_reference
 */
export function mapRecaptchaErrorCodes(
  errorCodes: string[] | undefined
): string {
  if (!errorCodes || errorCodes.length === 0) {
    return "Captcha verification failed";
  }

  // Check for specific error codes
  if (errorCodes.includes("missing-input-response")) {
    return "Please complete the captcha";
  }
  if (errorCodes.includes("invalid-input-response")) {
    return "Invalid captcha response. Please try again.";
  }
  if (errorCodes.includes("timeout-or-duplicate")) {
    return "Captcha expired. Please try again.";
  }
  if (errorCodes.includes("missing-input-secret")) {
    return "Server configuration error";
  }
  if (errorCodes.includes("invalid-input-secret")) {
    return "Server configuration error";
  }
  if (errorCodes.includes("bad-request")) {
    return "Invalid request";
  }

  // Default message for unknown errors
  return "Captcha verification failed";
}
