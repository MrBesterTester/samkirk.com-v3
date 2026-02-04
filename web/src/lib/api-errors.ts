import "server-only";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

// ============================================================================
// Error Codes
// ============================================================================

/**
 * All error codes used across the application.
 * Grouped by category for clarity.
 */
export type ErrorCode =
  // Authentication/Session errors
  | "NO_SESSION"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CAPTCHA_REQUIRED"
  // Rate limiting/Resource errors
  | "RATE_LIMIT_EXCEEDED"
  | "SPEND_CAP_EXCEEDED"
  // Validation errors
  | "INVALID_REQUEST"
  | "INVALID_INPUT"
  | "EMPTY_INPUT"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  // Upstream/Fetch errors
  | "URL_FETCH_FAILED"
  | "URL_BLOCKED"
  | "URL_TIMEOUT"
  | "URL_CONTENT_TOO_LARGE"
  | "INVALID_URL"
  | "EXTRACTION_FAILED"
  // LLM errors
  | "LLM_FAILED"
  | "CONTENT_BLOCKED"
  | "GENERATION_FAILED"
  // Flow/Business logic errors
  | "FLOW_ERROR"
  | "SUBMISSION_NOT_FOUND"
  | "RESUME_NOT_AVAILABLE"
  // Internal errors
  | "INTERNAL_ERROR";

/**
 * HTTP status codes for each error category.
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // Authentication/Session: 401/403
  NO_SESSION: 401,
  SESSION_EXPIRED: 401,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CAPTCHA_REQUIRED: 403,
  // Rate limiting/Resource: 429/503
  RATE_LIMIT_EXCEEDED: 429,
  SPEND_CAP_EXCEEDED: 503,
  // Validation: 400
  INVALID_REQUEST: 400,
  INVALID_INPUT: 400,
  EMPTY_INPUT: 400,
  INVALID_FILE_TYPE: 400,
  FILE_TOO_LARGE: 400,
  // Upstream/Fetch: 400/502
  URL_FETCH_FAILED: 502,
  URL_BLOCKED: 400,
  URL_TIMEOUT: 504,
  URL_CONTENT_TOO_LARGE: 400,
  INVALID_URL: 400,
  EXTRACTION_FAILED: 400,
  // LLM: 500/503
  LLM_FAILED: 503,
  CONTENT_BLOCKED: 400,
  GENERATION_FAILED: 503,
  // Flow/Business logic: 400/404
  FLOW_ERROR: 400,
  SUBMISSION_NOT_FOUND: 404,
  RESUME_NOT_AVAILABLE: 503,
  // Internal: 500
  INTERNAL_ERROR: 500,
};

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Standard error response payload.
 * All API errors should conform to this shape.
 */
export interface ApiErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Human-readable error message */
  error: string;
  /** Machine-readable error code */
  code: ErrorCode;
  /** Correlation ID for request tracing (optional) */
  correlationId?: string;
  /** Contact email for user support (rate limit/spend cap) */
  contactEmail?: string;
  /** Time in ms until retry is allowed (rate limit) */
  retryAfterMs?: number;
  /** UI hint to prompt for paste instead of URL (job ingestion) */
  shouldPromptPaste?: boolean;
}

/**
 * Options for creating an API error response.
 */
export interface ApiErrorOptions {
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code: ErrorCode;
  /** Correlation ID (auto-generated if not provided) */
  correlationId?: string;
  /** Contact email for user support */
  contactEmail?: string;
  /** Time in ms until retry is allowed */
  retryAfterMs?: number;
  /** UI hint for job ingestion errors */
  shouldPromptPaste?: boolean;
  /** Override HTTP status code (defaults to ERROR_STATUS_CODES[code]) */
  statusCode?: number;
}

// ============================================================================
// Correlation ID
// ============================================================================

/**
 * Header name for correlation IDs.
 */
export const CORRELATION_ID_HEADER = "X-Correlation-Id";

/**
 * Generate a new correlation ID.
 * Uses URL-safe base64 encoding for compact representation.
 */
export function generateCorrelationId(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Extract correlation ID from request headers or generate a new one.
 */
export function getCorrelationId(
  headers: Headers | { get(name: string): string | null }
): string {
  const existing = headers.get(CORRELATION_ID_HEADER);
  if (existing && existing.length > 0 && existing.length <= 64) {
    return existing;
  }
  return generateCorrelationId();
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Create a standard API error response.
 *
 * @param options - Error options
 * @returns NextResponse with error payload and appropriate status code
 */
export function createErrorResponse(
  options: ApiErrorOptions
): NextResponse<ApiErrorResponse> {
  const {
    message,
    code,
    correlationId,
    contactEmail,
    retryAfterMs,
    shouldPromptPaste,
    statusCode = ERROR_STATUS_CODES[code],
  } = options;

  const payload: ApiErrorResponse = {
    success: false,
    error: message,
    code,
  };

  // Only include optional fields if they have values
  if (correlationId) {
    payload.correlationId = correlationId;
  }
  if (contactEmail) {
    payload.contactEmail = contactEmail;
  }
  if (typeof retryAfterMs === "number") {
    payload.retryAfterMs = retryAfterMs;
  }
  if (shouldPromptPaste) {
    payload.shouldPromptPaste = shouldPromptPaste;
  }

  const headers = new Headers();
  if (correlationId) {
    headers.set(CORRELATION_ID_HEADER, correlationId);
  }
  if (typeof retryAfterMs === "number") {
    // Standard HTTP header for rate limiting
    headers.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
  }

  return NextResponse.json(payload, { status: statusCode, headers });
}

/**
 * Serialize an error to a JSON-safe format.
 * Strips sensitive data and limits message length.
 */
export function serializeErrorForResponse(options: ApiErrorOptions): ApiErrorResponse {
  const {
    message,
    code,
    correlationId,
    contactEmail,
    retryAfterMs,
    shouldPromptPaste,
  } = options;

  const payload: ApiErrorResponse = {
    success: false,
    error: message,
    code,
  };

  if (correlationId) {
    payload.correlationId = correlationId;
  }
  if (contactEmail) {
    payload.contactEmail = contactEmail;
  }
  if (typeof retryAfterMs === "number") {
    payload.retryAfterMs = retryAfterMs;
  }
  if (shouldPromptPaste) {
    payload.shouldPromptPaste = shouldPromptPaste;
  }

  return payload;
}

// ============================================================================
// Safe Logging
// ============================================================================

/**
 * Patterns that indicate potentially sensitive data in error messages.
 */
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /auth/i,
  /credential/i,
  /bearer/i,
  /private[_-]?key/i,
  /service[_-]?account/i,
  /client[_-]?secret/i,
];

/**
 * Redaction placeholder.
 */
const REDACTED = "[REDACTED]";

/**
 * Check if a string contains potentially sensitive data.
 */
export function containsSensitiveData(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Redact sensitive patterns from a string.
 */
export function redactSensitiveData(text: string): string {
  let result = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    // Replace the sensitive key and following value (common formats)
    result = result.replace(
      new RegExp(`(${pattern.source})[=:]\\s*["']?[^"'\\s]+["']?`, "gi"),
      `$1=${REDACTED}`
    );
  }
  return result;
}

/**
 * Sanitize an error for safe logging.
 * Removes stack traces in production and redacts sensitive data.
 */
export function sanitizeErrorForLogging(
  error: unknown,
  correlationId?: string
): {
  name: string;
  message: string;
  code?: string;
  correlationId?: string;
  stack?: string;
} {
  const isProduction = process.env.NODE_ENV === "production";

  // Handle Error objects
  if (error instanceof Error) {
    const sanitized: {
      name: string;
      message: string;
      code?: string;
      correlationId?: string;
      stack?: string;
    } = {
      name: error.name,
      message: redactSensitiveData(error.message),
    };

    // Include code if it's an AppError-like object
    if ("code" in error && typeof error.code === "string") {
      sanitized.code = error.code;
    }

    if (correlationId) {
      sanitized.correlationId = correlationId;
    }

    // Include stack trace only in development
    if (!isProduction && error.stack) {
      sanitized.stack = redactSensitiveData(error.stack);
    }

    return sanitized;
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      name: "Error",
      message: redactSensitiveData(error),
      correlationId,
    };
  }

  // Handle unknown errors
  return {
    name: "UnknownError",
    message: "An unknown error occurred",
    correlationId,
  };
}

/**
 * Log an error safely without exposing secrets.
 * Use this instead of console.error in production code.
 */
export function logError(
  context: string,
  error: unknown,
  correlationId?: string
): void {
  const sanitized = sanitizeErrorForLogging(error, correlationId);

  // Use structured logging format
  console.error(
    JSON.stringify({
      level: "error",
      context,
      ...sanitized,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Log a warning safely without exposing secrets.
 */
export function logWarning(
  context: string,
  message: string,
  correlationId?: string
): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      context,
      message: redactSensitiveData(message),
      correlationId,
      timestamp: new Date().toISOString(),
    })
  );
}

// ============================================================================
// Base Application Error Class
// ============================================================================

/**
 * Base class for all application errors.
 * Provides consistent error handling across the codebase.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly contactEmail?: string;
  readonly retryAfterMs?: number;
  readonly shouldPromptPaste?: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      contactEmail?: string;
      retryAfterMs?: number;
      shouldPromptPaste?: boolean;
      statusCode?: number;
    }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? ERROR_STATUS_CODES[code];
    this.contactEmail = options?.contactEmail;
    this.retryAfterMs = options?.retryAfterMs;
    this.shouldPromptPaste = options?.shouldPromptPaste;
  }

  /**
   * Convert to a JSON response payload.
   */
  toJSON(): ApiErrorResponse {
    return serializeErrorForResponse({
      message: this.message,
      code: this.code,
      contactEmail: this.contactEmail,
      retryAfterMs: this.retryAfterMs,
      shouldPromptPaste: this.shouldPromptPaste,
    });
  }

  /**
   * Create a NextResponse from this error.
   */
  toResponse(correlationId?: string): NextResponse<ApiErrorResponse> {
    return createErrorResponse({
      message: this.message,
      code: this.code,
      correlationId,
      contactEmail: this.contactEmail,
      retryAfterMs: this.retryAfterMs,
      shouldPromptPaste: this.shouldPromptPaste,
      statusCode: this.statusCode,
    });
  }
}

// ============================================================================
// Typed Error Factory Functions
// ============================================================================

/**
 * Create a session error response.
 */
export function sessionError(
  type: "NO_SESSION" | "SESSION_EXPIRED",
  correlationId?: string
): NextResponse<ApiErrorResponse> {
  const messages = {
    NO_SESSION: "No session found. Please refresh the page.",
    SESSION_EXPIRED: "Session expired. Please refresh the page.",
  };
  return createErrorResponse({
    message: messages[type],
    code: type,
    correlationId,
  });
}

/**
 * Create a captcha required error response.
 */
export function captchaRequiredError(
  correlationId?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse({
    message: "Please complete the captcha verification first.",
    code: "CAPTCHA_REQUIRED",
    correlationId,
  });
}

/**
 * Create a validation error response.
 */
export function validationError(
  message: string,
  code: ErrorCode = "INVALID_REQUEST",
  correlationId?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse({
    message,
    code,
    correlationId,
  });
}

/**
 * Create an internal error response.
 * Never exposes the original error message to the client.
 */
export function internalError(
  correlationId?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse({
    message: "An unexpected error occurred. Please try again.",
    code: "INTERNAL_ERROR",
    correlationId,
  });
}

// ============================================================================
// Error Detection Utilities
// ============================================================================

/**
 * Check if an error is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error has the shape of an API error (has code property).
 */
export function hasErrorCode(
  error: unknown
): error is { code: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Check if an error has a toResponse method.
 */
export function hasToResponse(
  error: unknown
): error is { toResponse(correlationId?: string): NextResponse<ApiErrorResponse> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "toResponse" in error &&
    typeof (error as { toResponse: unknown }).toResponse === "function"
  );
}

/**
 * Check if an error has a toJSON method.
 */
export function hasToJSON(
  error: unknown
): error is { toJSON(): ApiErrorResponse } {
  return (
    typeof error === "object" &&
    error !== null &&
    "toJSON" in error &&
    typeof (error as { toJSON: unknown }).toJSON === "function"
  );
}
