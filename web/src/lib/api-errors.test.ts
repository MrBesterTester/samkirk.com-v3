/**
 * Tests for api-errors.ts
 *
 * Tests cover:
 * - Error codes and status code mapping
 * - Correlation ID generation and extraction
 * - Error response creation and serialization
 * - Safe logging utilities (redaction, sanitization)
 * - AppError class behavior
 * - Error factory functions
 * - Error detection utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  // Types
  type ErrorCode,
  // Constants
  ERROR_STATUS_CODES,
  CORRELATION_ID_HEADER,
  // Correlation ID
  generateCorrelationId,
  getCorrelationId,
  // Error Response Helpers
  createErrorResponse,
  serializeErrorForResponse,
  // Safe Logging
  containsSensitiveData,
  redactSensitiveData,
  sanitizeErrorForLogging,
  logError,
  logWarning,
  // AppError class
  AppError,
  // Factory Functions
  sessionError,
  captchaRequiredError,
  validationError,
  internalError,
  // Detection Utilities
  isAppError,
  hasErrorCode,
  hasToResponse,
  hasToJSON,
} from "./api-errors";

// ============================================================================
// Error Codes and Status Codes
// ============================================================================

describe("ERROR_STATUS_CODES", () => {
  it("should have a status code for every ErrorCode", () => {
    const allCodes: ErrorCode[] = [
      "NO_SESSION",
      "SESSION_EXPIRED",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "CAPTCHA_REQUIRED",
      "RATE_LIMIT_EXCEEDED",
      "SPEND_CAP_EXCEEDED",
      "INVALID_REQUEST",
      "INVALID_INPUT",
      "EMPTY_INPUT",
      "INVALID_FILE_TYPE",
      "FILE_TOO_LARGE",
      "URL_FETCH_FAILED",
      "URL_BLOCKED",
      "URL_TIMEOUT",
      "URL_CONTENT_TOO_LARGE",
      "INVALID_URL",
      "EXTRACTION_FAILED",
      "LLM_FAILED",
      "CONTENT_BLOCKED",
      "GENERATION_FAILED",
      "FLOW_ERROR",
      "SUBMISSION_NOT_FOUND",
      "RESUME_NOT_AVAILABLE",
      "INTERNAL_ERROR",
    ];

    for (const code of allCodes) {
      expect(ERROR_STATUS_CODES[code]).toBeDefined();
      expect(typeof ERROR_STATUS_CODES[code]).toBe("number");
      expect(ERROR_STATUS_CODES[code]).toBeGreaterThanOrEqual(400);
      expect(ERROR_STATUS_CODES[code]).toBeLessThanOrEqual(599);
    }
  });

  it("should map authentication errors to 401/403", () => {
    expect(ERROR_STATUS_CODES["NO_SESSION"]).toBe(401);
    expect(ERROR_STATUS_CODES["SESSION_EXPIRED"]).toBe(401);
    expect(ERROR_STATUS_CODES["UNAUTHORIZED"]).toBe(401);
    expect(ERROR_STATUS_CODES["FORBIDDEN"]).toBe(403);
    expect(ERROR_STATUS_CODES["CAPTCHA_REQUIRED"]).toBe(403);
  });

  it("should map rate limiting to 429", () => {
    expect(ERROR_STATUS_CODES["RATE_LIMIT_EXCEEDED"]).toBe(429);
  });

  it("should map spend cap to 503", () => {
    expect(ERROR_STATUS_CODES["SPEND_CAP_EXCEEDED"]).toBe(503);
  });

  it("should map validation errors to 400", () => {
    expect(ERROR_STATUS_CODES["INVALID_REQUEST"]).toBe(400);
    expect(ERROR_STATUS_CODES["INVALID_INPUT"]).toBe(400);
    expect(ERROR_STATUS_CODES["EMPTY_INPUT"]).toBe(400);
    expect(ERROR_STATUS_CODES["INVALID_FILE_TYPE"]).toBe(400);
    expect(ERROR_STATUS_CODES["FILE_TOO_LARGE"]).toBe(400);
  });

  it("should map internal error to 500", () => {
    expect(ERROR_STATUS_CODES["INTERNAL_ERROR"]).toBe(500);
  });

  it("should map LLM errors appropriately", () => {
    expect(ERROR_STATUS_CODES["LLM_FAILED"]).toBe(503);
    expect(ERROR_STATUS_CODES["CONTENT_BLOCKED"]).toBe(400);
    expect(ERROR_STATUS_CODES["GENERATION_FAILED"]).toBe(503);
  });

  it("should map URL errors to appropriate codes", () => {
    expect(ERROR_STATUS_CODES["URL_FETCH_FAILED"]).toBe(502);
    expect(ERROR_STATUS_CODES["URL_TIMEOUT"]).toBe(504);
    expect(ERROR_STATUS_CODES["URL_BLOCKED"]).toBe(400);
  });
});

// ============================================================================
// Correlation ID
// ============================================================================

describe("generateCorrelationId", () => {
  it("should generate a non-empty string", () => {
    const id = generateCorrelationId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateCorrelationId());
    }
    expect(ids.size).toBe(100);
  });

  it("should generate URL-safe IDs (base64url)", () => {
    for (let i = 0; i < 20; i++) {
      const id = generateCorrelationId();
      // base64url uses only alphanumeric, -, _
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("should generate IDs of consistent length", () => {
    const ids = Array.from({ length: 10 }, () => generateCorrelationId());
    const lengths = ids.map((id) => id.length);
    expect(new Set(lengths).size).toBe(1);
  });
});

describe("getCorrelationId", () => {
  it("should extract correlation ID from headers", () => {
    const headers = new Headers();
    headers.set(CORRELATION_ID_HEADER, "test-correlation-id");
    const id = getCorrelationId(headers);
    expect(id).toBe("test-correlation-id");
  });

  it("should generate new ID if header is missing", () => {
    const headers = new Headers();
    const id = getCorrelationId(headers);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate new ID if header is empty", () => {
    const headers = new Headers();
    headers.set(CORRELATION_ID_HEADER, "");
    const id = getCorrelationId(headers);
    expect(id).not.toBe("");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate new ID if header is too long", () => {
    const headers = new Headers();
    headers.set(CORRELATION_ID_HEADER, "x".repeat(100));
    const id = getCorrelationId(headers);
    expect(id.length).toBeLessThanOrEqual(64);
  });

  it("should work with object implementing get method", () => {
    const headers = {
      get(name: string): string | null {
        if (name === CORRELATION_ID_HEADER) return "custom-id";
        return null;
      },
    };
    const id = getCorrelationId(headers);
    expect(id).toBe("custom-id");
  });
});

describe("CORRELATION_ID_HEADER", () => {
  it("should be X-Correlation-Id", () => {
    expect(CORRELATION_ID_HEADER).toBe("X-Correlation-Id");
  });
});

// ============================================================================
// Error Response Creation
// ============================================================================

describe("createErrorResponse", () => {
  it("should create a NextResponse with error payload", () => {
    const response = createErrorResponse({
      message: "Test error",
      code: "INVALID_REQUEST",
    });

    expect(response.status).toBe(400);
  });

  it("should use ERROR_STATUS_CODES for status", () => {
    const response = createErrorResponse({
      message: "Rate limited",
      code: "RATE_LIMIT_EXCEEDED",
    });

    expect(response.status).toBe(429);
  });

  it("should allow status code override", () => {
    const response = createErrorResponse({
      message: "Custom status",
      code: "INVALID_REQUEST",
      statusCode: 418, // I'm a teapot
    });

    expect(response.status).toBe(418);
  });

  it("should include correlation ID header when provided", () => {
    const response = createErrorResponse({
      message: "Test",
      code: "INTERNAL_ERROR",
      correlationId: "test-id-123",
    });

    expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("test-id-123");
  });

  it("should include Retry-After header for rate limiting", () => {
    const response = createErrorResponse({
      message: "Rate limited",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterMs: 30000,
    });

    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("should round up Retry-After to nearest second", () => {
    const response = createErrorResponse({
      message: "Rate limited",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterMs: 1500,
    });

    expect(response.headers.get("Retry-After")).toBe("2");
  });
});

describe("serializeErrorForResponse", () => {
  it("should create standard error payload", () => {
    const payload = serializeErrorForResponse({
      message: "Test error",
      code: "INVALID_INPUT",
    });

    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Test error");
    expect(payload.code).toBe("INVALID_INPUT");
  });

  it("should include optional fields when provided", () => {
    const payload = serializeErrorForResponse({
      message: "Rate limited",
      code: "RATE_LIMIT_EXCEEDED",
      correlationId: "corr-123",
      contactEmail: "test@example.com",
      retryAfterMs: 60000,
    });

    expect(payload.correlationId).toBe("corr-123");
    expect(payload.contactEmail).toBe("test@example.com");
    expect(payload.retryAfterMs).toBe(60000);
  });

  it("should include shouldPromptPaste when true", () => {
    const payload = serializeErrorForResponse({
      message: "URL fetch failed",
      code: "URL_FETCH_FAILED",
      shouldPromptPaste: true,
    });

    expect(payload.shouldPromptPaste).toBe(true);
  });

  it("should not include optional fields when undefined", () => {
    const payload = serializeErrorForResponse({
      message: "Test",
      code: "INVALID_REQUEST",
    });

    expect(payload).not.toHaveProperty("correlationId");
    expect(payload).not.toHaveProperty("contactEmail");
    expect(payload).not.toHaveProperty("retryAfterMs");
    expect(payload).not.toHaveProperty("shouldPromptPaste");
  });
});

// ============================================================================
// Safe Logging
// ============================================================================

describe("containsSensitiveData", () => {
  it("should detect api_key", () => {
    expect(containsSensitiveData("my api_key is here")).toBe(true);
    expect(containsSensitiveData("apiKey=123")).toBe(true);
    expect(containsSensitiveData("API-KEY")).toBe(true);
  });

  it("should detect secret", () => {
    expect(containsSensitiveData("client_secret=abc")).toBe(true);
    expect(containsSensitiveData("SECRET_VALUE")).toBe(true);
  });

  it("should detect password", () => {
    expect(containsSensitiveData("password=hunter2")).toBe(true);
    expect(containsSensitiveData("PASSWORD")).toBe(true);
  });

  it("should detect token", () => {
    expect(containsSensitiveData("access_token=xyz")).toBe(true);
    expect(containsSensitiveData("TOKEN")).toBe(true);
  });

  it("should detect auth-related terms", () => {
    expect(containsSensitiveData("authorization: Bearer")).toBe(true);
    expect(containsSensitiveData("AUTH_HEADER")).toBe(true);
  });

  it("should detect credential", () => {
    expect(containsSensitiveData("credentials.json")).toBe(true);
    expect(containsSensitiveData("CREDENTIAL")).toBe(true);
  });

  it("should detect bearer", () => {
    expect(containsSensitiveData("Bearer token")).toBe(true);
  });

  it("should detect private_key", () => {
    expect(containsSensitiveData("private_key=")).toBe(true);
    expect(containsSensitiveData("PRIVATE-KEY")).toBe(true);
  });

  it("should detect service_account", () => {
    expect(containsSensitiveData("service_account.json")).toBe(true);
    expect(containsSensitiveData("SERVICE-ACCOUNT")).toBe(true);
  });

  it("should detect client_secret", () => {
    expect(containsSensitiveData("client_secret=abc")).toBe(true);
    expect(containsSensitiveData("CLIENT-SECRET")).toBe(true);
  });

  it("should return false for safe text", () => {
    expect(containsSensitiveData("Hello world")).toBe(false);
    expect(containsSensitiveData("Invalid request body")).toBe(false);
    expect(containsSensitiveData("File not found")).toBe(false);
  });
});

describe("redactSensitiveData", () => {
  it("should redact api_key values", () => {
    const result = redactSensitiveData("api_key=sk-123abc");
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("sk-123abc");
  });

  it("should redact password values", () => {
    const result = redactSensitiveData("password='hunter2'");
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("hunter2");
  });

  it("should redact token values", () => {
    const result = redactSensitiveData('token="eyJhbGc..."');
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("eyJhbGc");
  });

  it("should redact secret values", () => {
    const result = redactSensitiveData("client_secret:my-secret-value");
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("my-secret-value");
  });

  it("should preserve non-sensitive parts", () => {
    const result = redactSensitiveData("Error: api_key=abc123 in file");
    expect(result).toContain("Error:");
    expect(result).toContain("in file");
  });

  it("should handle multiple sensitive values", () => {
    const result = redactSensitiveData(
      "api_key=abc password=123 token=xyz"
    );
    expect(result).not.toContain("abc");
    expect(result).not.toContain("123");
    expect(result).not.toContain("xyz");
  });

  it("should return unchanged text if no sensitive data", () => {
    const text = "This is a normal error message";
    const result = redactSensitiveData(text);
    expect(result).toBe(text);
  });
});

describe("sanitizeErrorForLogging", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should extract name and message from Error objects", () => {
    const error = new Error("Test error");
    const result = sanitizeErrorForLogging(error);

    expect(result.name).toBe("Error");
    expect(result.message).toBe("Test error");
  });

  it("should extract code from errors with code property", () => {
    const error = new AppError("INVALID_REQUEST", "Bad input");
    const result = sanitizeErrorForLogging(error);

    expect(result.code).toBe("INVALID_REQUEST");
  });

  it("should include correlation ID when provided", () => {
    const error = new Error("Test");
    const result = sanitizeErrorForLogging(error, "corr-123");

    expect(result.correlationId).toBe("corr-123");
  });

  it("should redact sensitive data in message", () => {
    const error = new Error("Failed with api_key=secret123");
    const result = sanitizeErrorForLogging(error);

    expect(result.message).toContain("[REDACTED]");
    expect(result.message).not.toContain("secret123");
  });

  it("should include stack trace in development", () => {
    process.env.NODE_ENV = "development";
    const error = new Error("Test");
    const result = sanitizeErrorForLogging(error);

    expect(result.stack).toBeDefined();
  });

  it("should exclude stack trace in production", () => {
    process.env.NODE_ENV = "production";
    const error = new Error("Test");
    const result = sanitizeErrorForLogging(error);

    expect(result.stack).toBeUndefined();
  });

  it("should handle string errors", () => {
    const result = sanitizeErrorForLogging("Something went wrong");

    expect(result.name).toBe("Error");
    expect(result.message).toBe("Something went wrong");
  });

  it("should handle unknown error types", () => {
    const result = sanitizeErrorForLogging({ foo: "bar" });

    expect(result.name).toBe("UnknownError");
    expect(result.message).toBe("An unknown error occurred");
  });

  it("should handle null", () => {
    const result = sanitizeErrorForLogging(null);

    expect(result.name).toBe("UnknownError");
    expect(result.message).toBe("An unknown error occurred");
  });

  it("should redact sensitive data in stack trace", () => {
    process.env.NODE_ENV = "development";
    const error = new Error("Test");
    error.stack = "Error: password=hunter2 at Function";
    const result = sanitizeErrorForLogging(error);

    if (result.stack) {
      expect(result.stack).not.toContain("hunter2");
    }
  });
});

describe("logError", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log error as JSON", () => {
    logError("test-context", new Error("Test error"));

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.level).toBe("error");
    expect(logged.context).toBe("test-context");
    expect(logged.message).toBe("Test error");
    expect(logged.timestamp).toBeDefined();
  });

  it("should include correlation ID", () => {
    logError("test", new Error("Test"), "corr-456");

    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.correlationId).toBe("corr-456");
  });

  it("should redact sensitive data", () => {
    logError("test", new Error("api_key=secret123"));

    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.message).not.toContain("secret123");
  });
});

describe("logWarning", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should log warning as JSON", () => {
    logWarning("test-context", "Test warning");

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.level).toBe("warn");
    expect(logged.context).toBe("test-context");
    expect(logged.message).toBe("Test warning");
  });

  it("should include correlation ID", () => {
    logWarning("test", "Warning", "corr-789");

    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.correlationId).toBe("corr-789");
  });

  it("should redact sensitive data", () => {
    logWarning("test", "password=hunter2");

    const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logged.message).not.toContain("hunter2");
  });
});

// ============================================================================
// AppError Class
// ============================================================================

describe("AppError", () => {
  it("should extend Error", () => {
    const error = new AppError("INVALID_REQUEST", "Test");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it("should set name to AppError", () => {
    const error = new AppError("INVALID_REQUEST", "Test");
    expect(error.name).toBe("AppError");
  });

  it("should set code and message", () => {
    const error = new AppError("INVALID_REQUEST", "Invalid input");
    expect(error.code).toBe("INVALID_REQUEST");
    expect(error.message).toBe("Invalid input");
  });

  it("should use default status code from ERROR_STATUS_CODES", () => {
    const error = new AppError("RATE_LIMIT_EXCEEDED", "Too many requests");
    expect(error.statusCode).toBe(429);
  });

  it("should allow status code override", () => {
    const error = new AppError("INVALID_REQUEST", "Test", {
      statusCode: 422,
    });
    expect(error.statusCode).toBe(422);
  });

  it("should set optional fields", () => {
    const error = new AppError("RATE_LIMIT_EXCEEDED", "Rate limited", {
      contactEmail: "support@example.com",
      retryAfterMs: 30000,
    });

    expect(error.contactEmail).toBe("support@example.com");
    expect(error.retryAfterMs).toBe(30000);
  });

  it("should set shouldPromptPaste", () => {
    const error = new AppError("URL_FETCH_FAILED", "Fetch failed", {
      shouldPromptPaste: true,
    });

    expect(error.shouldPromptPaste).toBe(true);
  });

  describe("toJSON()", () => {
    it("should return standard error payload", () => {
      const error = new AppError("INVALID_REQUEST", "Test error");
      const json = error.toJSON();

      expect(json.success).toBe(false);
      expect(json.error).toBe("Test error");
      expect(json.code).toBe("INVALID_REQUEST");
    });

    it("should include optional fields", () => {
      const error = new AppError("RATE_LIMIT_EXCEEDED", "Rate limited", {
        contactEmail: "test@example.com",
        retryAfterMs: 60000,
      });
      const json = error.toJSON();

      expect(json.contactEmail).toBe("test@example.com");
      expect(json.retryAfterMs).toBe(60000);
    });
  });

  describe("toResponse()", () => {
    it("should create NextResponse with correct status", () => {
      const error = new AppError("FORBIDDEN", "Access denied");
      const response = error.toResponse();

      expect(response.status).toBe(403);
    });

    it("should include correlation ID when provided", () => {
      const error = new AppError("INVALID_REQUEST", "Test");
      const response = error.toResponse("corr-abc");

      expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("corr-abc");
    });

    it("should include Retry-After header for rate limiting", () => {
      const error = new AppError("RATE_LIMIT_EXCEEDED", "Rate limited", {
        retryAfterMs: 45000,
      });
      const response = error.toResponse();

      expect(response.headers.get("Retry-After")).toBe("45");
    });
  });
});

// ============================================================================
// Factory Functions
// ============================================================================

describe("sessionError", () => {
  it("should create NO_SESSION error", () => {
    const response = sessionError("NO_SESSION");
    expect(response.status).toBe(401);
  });

  it("should create SESSION_EXPIRED error", () => {
    const response = sessionError("SESSION_EXPIRED");
    expect(response.status).toBe(401);
  });

  it("should include correlation ID", () => {
    const response = sessionError("NO_SESSION", "corr-123");
    expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("corr-123");
  });
});

describe("captchaRequiredError", () => {
  it("should create 403 response", () => {
    const response = captchaRequiredError();
    expect(response.status).toBe(403);
  });

  it("should include correlation ID", () => {
    const response = captchaRequiredError("corr-456");
    expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("corr-456");
  });
});

describe("validationError", () => {
  it("should create 400 response by default", () => {
    const response = validationError("Invalid input");
    expect(response.status).toBe(400);
  });

  it("should use custom error code", () => {
    const response = validationError("Empty input", "EMPTY_INPUT");
    expect(response.status).toBe(400);
  });

  it("should include correlation ID", () => {
    const response = validationError("Test", "INVALID_REQUEST", "corr-789");
    expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("corr-789");
  });
});

describe("internalError", () => {
  it("should create 500 response", () => {
    const response = internalError();
    expect(response.status).toBe(500);
  });

  it("should have generic message (no details)", async () => {
    const response = internalError();
    const body = await response.json();
    expect(body.error).toBe("An unexpected error occurred. Please try again.");
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("should include correlation ID", () => {
    const response = internalError("corr-abc");
    expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("corr-abc");
  });
});

// ============================================================================
// Error Detection Utilities
// ============================================================================

describe("isAppError", () => {
  it("should return true for AppError instances", () => {
    const error = new AppError("INVALID_REQUEST", "Test");
    expect(isAppError(error)).toBe(true);
  });

  it("should return false for regular Error", () => {
    const error = new Error("Test");
    expect(isAppError(error)).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });

  it("should return false for objects with similar shape", () => {
    const fake = { code: "INVALID_REQUEST", message: "Test" };
    expect(isAppError(fake)).toBe(false);
  });
});

describe("hasErrorCode", () => {
  it("should return true for objects with code and message", () => {
    const obj = { code: "INVALID_REQUEST", message: "Test" };
    expect(hasErrorCode(obj)).toBe(true);
  });

  it("should return true for AppError", () => {
    const error = new AppError("INVALID_REQUEST", "Test");
    expect(hasErrorCode(error)).toBe(true);
  });

  it("should return false for regular Error", () => {
    const error = new Error("Test");
    expect(hasErrorCode(error)).toBe(false);
  });

  it("should return false for objects without code", () => {
    const obj = { message: "Test" };
    expect(hasErrorCode(obj)).toBe(false);
  });

  it("should return false for objects without message", () => {
    const obj = { code: "TEST" };
    expect(hasErrorCode(obj)).toBe(false);
  });

  it("should return false for non-objects", () => {
    expect(hasErrorCode("string")).toBe(false);
    expect(hasErrorCode(123)).toBe(false);
    expect(hasErrorCode(null)).toBe(false);
  });
});

describe("hasToResponse", () => {
  it("should return true for AppError", () => {
    const error = new AppError("INVALID_REQUEST", "Test");
    expect(hasToResponse(error)).toBe(true);
  });

  it("should return true for objects with toResponse method", () => {
    const obj = { toResponse: () => ({}) };
    expect(hasToResponse(obj)).toBe(true);
  });

  it("should return false for regular Error", () => {
    const error = new Error("Test");
    expect(hasToResponse(error)).toBe(false);
  });

  it("should return false for objects without toResponse", () => {
    const obj = { code: "TEST" };
    expect(hasToResponse(obj)).toBe(false);
  });

  it("should return false for non-objects", () => {
    expect(hasToResponse(null)).toBe(false);
    expect(hasToResponse("string")).toBe(false);
  });
});

describe("hasToJSON", () => {
  it("should return true for AppError", () => {
    const error = new AppError("INVALID_REQUEST", "Test");
    expect(hasToJSON(error)).toBe(true);
  });

  it("should return true for objects with toJSON method", () => {
    const obj = { toJSON: () => ({}) };
    expect(hasToJSON(obj)).toBe(true);
  });

  it("should return false for regular Error", () => {
    const error = new Error("Test");
    expect(hasToJSON(error)).toBe(false);
  });

  it("should return false for objects without toJSON", () => {
    const obj = { code: "TEST" };
    expect(hasToJSON(obj)).toBe(false);
  });
});

// ============================================================================
// Integration Scenarios
// ============================================================================

describe("Integration Scenarios", () => {
  it("should support typical API error handling flow", () => {
    // Simulate catching various errors
    const errors = [
      new AppError("RATE_LIMIT_EXCEEDED", "Too many requests", {
        retryAfterMs: 30000,
        contactEmail: "support@example.com",
      }),
      new AppError("INVALID_REQUEST", "Missing required field"),
      new AppError("INTERNAL_ERROR", "Database connection failed"),
    ];

    for (const error of errors) {
      // Error can be serialized
      const json = error.toJSON();
      expect(json.success).toBe(false);
      expect(json.code).toBeDefined();

      // Error can create response
      const response = error.toResponse("corr-test");
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("should support safe error logging flow", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      throw new Error("Database error: password=secret123 failed");
    } catch (error) {
      const correlationId = generateCorrelationId();
      logError("db-query", error, correlationId);

      const logged = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(logged.message).not.toContain("secret123");
      expect(logged.correlationId).toBe(correlationId);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("should support correlation ID propagation", () => {
    const incomingHeaders = new Headers();
    incomingHeaders.set(CORRELATION_ID_HEADER, "incoming-corr-id");

    // Extract from incoming request
    const correlationId = getCorrelationId(incomingHeaders);
    expect(correlationId).toBe("incoming-corr-id");

    // Use in error response
    const error = new AppError("INVALID_REQUEST", "Bad input");
    const response = error.toResponse(correlationId);

    // Response has same correlation ID
    expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("incoming-corr-id");
  });
});
