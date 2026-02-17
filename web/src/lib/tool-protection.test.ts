import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only to allow tests to run
vi.mock("server-only", () => ({}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock the session module
const mockGetSessionIdFromCookies = vi.fn();
const mockIsSessionValid = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/session", () => ({
  getSessionIdFromCookies: (...args: unknown[]) =>
    mockGetSessionIdFromCookies(...args),
  isSessionValid: (...args: unknown[]) => mockIsSessionValid(...args),
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

// Mock the rate-limit module
const mockEnforceRateLimit = vi.fn();

vi.mock("@/lib/rate-limit", () => {
  class RateLimitErrorImpl extends Error {
    readonly code = "RATE_LIMIT_EXCEEDED";
    readonly statusCode = 429;
    readonly contactEmail: string;
    readonly retryAfterMs: number;

    constructor(retryAfterMs: number) {
      super(
        `Rate limit exceeded. Please contact sam@samkirk.com for access.`
      );
      this.name = "RateLimitError";
      this.contactEmail = "sam@samkirk.com";
      this.retryAfterMs = retryAfterMs;
    }
  }

  return {
    enforceRateLimit: (...args: unknown[]) => mockEnforceRateLimit(...args),
    RateLimitError: RateLimitErrorImpl,
  };
});

// Mock the spend-cap module
const mockEnforceSpendCap = vi.fn();

vi.mock("@/lib/spend-cap", () => {
  class SpendCapErrorImpl extends Error {
    readonly code = "SPEND_CAP_EXCEEDED";
    readonly statusCode = 503;
    readonly contactEmail: string;
    readonly currentSpendUsd: number;
    readonly budgetUsd: number;

    constructor(currentSpendUsd: number, budgetUsd: number = 20) {
      super(
        `Monthly spend cap reached. Tool temporarily unavailable. Please contact sam@samkirk.com for assistance.`
      );
      this.name = "SpendCapError";
      this.contactEmail = "sam@samkirk.com";
      this.currentSpendUsd = currentSpendUsd;
      this.budgetUsd = budgetUsd;
    }
  }

  return {
    enforceSpendCap: (...args: unknown[]) => mockEnforceSpendCap(...args),
    SpendCapError: SpendCapErrorImpl,
  };
});

// Import after mocks
import { withToolProtection } from "./tool-protection";
import { RateLimitError } from "@/lib/rate-limit";
import { SpendCapError } from "@/lib/spend-cap";
import { NextRequest } from "next/server";
import { Timestamp } from "@google-cloud/firestore";

// Helper to create a mock NextRequest
function createMockRequest(
  headers: Record<string, string> = {}
): NextRequest {
  const request = {
    headers: new Headers(headers),
  } as NextRequest;
  return request;
}

// Helper to set up a fully passing scenario
function setupPassingMocks(sessionId = "valid-session-id-43chars-aaaaaaaaaaaaa") {
  mockGetSessionIdFromCookies.mockResolvedValue(sessionId);
  mockIsSessionValid.mockResolvedValue(true);
  mockGetSession.mockResolvedValue({
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
    captchaPassedAt: Timestamp.now(),
  });
  mockEnforceRateLimit.mockResolvedValue(undefined);
  mockEnforceSpendCap.mockResolvedValue(undefined);
}

describe("tool-protection module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withToolProtection", () => {
    // ========================================================================
    // Step 1: Session check
    // ========================================================================

    describe("session checks", () => {
      it("returns NO_SESSION when no session cookie exists", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue(null);
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.response.status).toBe(401);
          const body = await result.response.json();
          expect(body).toEqual({
            success: false,
            error: "No session found. Please refresh the page.",
            code: "NO_SESSION",
          });
        }
      });

      it("returns SESSION_EXPIRED when session is invalid", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue("some-session-id");
        mockIsSessionValid.mockResolvedValue(false);
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.response.status).toBe(401);
          const body = await result.response.json();
          expect(body).toEqual({
            success: false,
            error: "Session expired. Please refresh the page.",
            code: "SESSION_EXPIRED",
          });
        }
      });

      it("passes the session ID to isSessionValid", async () => {
        const sessionId = "my-session-123";
        mockGetSessionIdFromCookies.mockResolvedValue(sessionId);
        mockIsSessionValid.mockResolvedValue(false);
        const request = createMockRequest();

        await withToolProtection(request);

        expect(mockIsSessionValid).toHaveBeenCalledWith(sessionId);
      });
    });

    // ========================================================================
    // Step 2: Captcha check
    // ========================================================================

    describe("captcha checks", () => {
      it("returns CAPTCHA_REQUIRED when captcha not passed (no session found)", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue("session-123");
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue(null);
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.response.status).toBe(403);
          const body = await result.response.json();
          expect(body).toEqual({
            success: false,
            error: "Please complete the captcha verification first.",
            code: "CAPTCHA_REQUIRED",
          });
        }
      });

      it("returns CAPTCHA_REQUIRED when captchaPassedAt is not set", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue("session-123");
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue({
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
          // no captchaPassedAt
        });
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.response.status).toBe(403);
          const body = await result.response.json();
          expect(body.code).toBe("CAPTCHA_REQUIRED");
        }
      });

      it("passes captcha check when captchaPassedAt is set", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(true);
      });
    });

    // ========================================================================
    // Step 3: Rate limit
    // ========================================================================

    describe("rate limit checks", () => {
      it("returns RATE_LIMIT_EXCEEDED when rate limit is hit", async () => {
        const sessionId = "session-123";
        mockGetSessionIdFromCookies.mockResolvedValue(sessionId);
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue({
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
          captchaPassedAt: Timestamp.now(),
        });
        mockEnforceRateLimit.mockRejectedValue(new RateLimitError(30000));
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.response.status).toBe(429);
          const body = await result.response.json();
          expect(body).toEqual({
            success: false,
            error: expect.stringContaining("Rate limit exceeded"),
            code: "RATE_LIMIT_EXCEEDED",
            contactEmail: "sam@samkirk.com",
          });
        }
      });

      it("passes the request to enforceRateLimit", async () => {
        setupPassingMocks();
        const request = createMockRequest({
          "x-forwarded-for": "1.2.3.4",
        });

        await withToolProtection(request);

        expect(mockEnforceRateLimit).toHaveBeenCalledWith(request);
      });

      it("re-throws non-RateLimitError errors from enforceRateLimit", async () => {
        const sessionId = "session-123";
        mockGetSessionIdFromCookies.mockResolvedValue(sessionId);
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue({
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
          captchaPassedAt: Timestamp.now(),
        });
        const unexpectedError = new Error("Firestore unavailable");
        mockEnforceRateLimit.mockRejectedValue(unexpectedError);
        const request = createMockRequest();

        await expect(withToolProtection(request)).rejects.toThrow(
          "Firestore unavailable"
        );
      });
    });

    // ========================================================================
    // Step 4: Spend cap
    // ========================================================================

    describe("spend cap checks", () => {
      it("returns SPEND_CAP_EXCEEDED when spend cap is hit", async () => {
        const sessionId = "session-123";
        mockGetSessionIdFromCookies.mockResolvedValue(sessionId);
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue({
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
          captchaPassedAt: Timestamp.now(),
        });
        mockEnforceRateLimit.mockResolvedValue(undefined);
        mockEnforceSpendCap.mockRejectedValue(new SpendCapError(25, 20));
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.response.status).toBe(503);
          const body = await result.response.json();
          expect(body).toEqual({
            success: false,
            error: expect.stringContaining("Monthly spend cap reached"),
            code: "SPEND_CAP_EXCEEDED",
            contactEmail: "sam@samkirk.com",
          });
        }
      });

      it("re-throws non-SpendCapError errors from enforceSpendCap", async () => {
        const sessionId = "session-123";
        mockGetSessionIdFromCookies.mockResolvedValue(sessionId);
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue({
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
          captchaPassedAt: Timestamp.now(),
        });
        mockEnforceRateLimit.mockResolvedValue(undefined);
        const unexpectedError = new Error("Firestore write failed");
        mockEnforceSpendCap.mockRejectedValue(unexpectedError);
        const request = createMockRequest();

        await expect(withToolProtection(request)).rejects.toThrow(
          "Firestore write failed"
        );
      });
    });

    // ========================================================================
    // Success path
    // ========================================================================

    describe("success path", () => {
      it("returns ok: true with sessionId when all checks pass", async () => {
        const sessionId = "valid-session-id-43chars-aaaaaaaaaaaaa";
        setupPassingMocks(sessionId);
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.sessionId).toBe(sessionId);
        }
      });

      it("calls all checks in order", async () => {
        const callOrder: string[] = [];

        mockGetSessionIdFromCookies.mockImplementation(async () => {
          callOrder.push("getSessionIdFromCookies");
          return "session-123";
        });
        mockIsSessionValid.mockImplementation(async () => {
          callOrder.push("isSessionValid");
          return true;
        });
        mockGetSession.mockImplementation(async () => {
          callOrder.push("getSession");
          return {
            createdAt: Timestamp.now(),
            expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
            captchaPassedAt: Timestamp.now(),
          };
        });
        mockEnforceRateLimit.mockImplementation(async () => {
          callOrder.push("enforceRateLimit");
        });
        mockEnforceSpendCap.mockImplementation(async () => {
          callOrder.push("enforceSpendCap");
        });

        const request = createMockRequest();
        await withToolProtection(request);

        expect(callOrder).toEqual([
          "getSessionIdFromCookies",
          "isSessionValid",
          "getSession",
          "enforceRateLimit",
          "enforceSpendCap",
        ]);
      });
    });

    // ========================================================================
    // Options: skipRateLimit
    // ========================================================================

    describe("skipRateLimit option", () => {
      it("skips rate limit when skipRateLimit is true", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        const result = await withToolProtection(request, {
          skipRateLimit: true,
        });

        expect(result.ok).toBe(true);
        expect(mockEnforceRateLimit).not.toHaveBeenCalled();
      });

      it("enforces rate limit when skipRateLimit is false", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        await withToolProtection(request, { skipRateLimit: false });

        expect(mockEnforceRateLimit).toHaveBeenCalledTimes(1);
      });

      it("enforces rate limit when skipRateLimit is not specified", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        await withToolProtection(request);

        expect(mockEnforceRateLimit).toHaveBeenCalledTimes(1);
      });

      it("still enforces spend cap when skipRateLimit is true", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        await withToolProtection(request, { skipRateLimit: true });

        expect(mockEnforceSpendCap).toHaveBeenCalledTimes(1);
      });
    });

    // ========================================================================
    // Options: skipSpendCap
    // ========================================================================

    describe("skipSpendCap option", () => {
      it("skips spend cap when skipSpendCap is true", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        const result = await withToolProtection(request, {
          skipSpendCap: true,
        });

        expect(result.ok).toBe(true);
        expect(mockEnforceSpendCap).not.toHaveBeenCalled();
      });

      it("enforces spend cap when skipSpendCap is false", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        await withToolProtection(request, { skipSpendCap: false });

        expect(mockEnforceSpendCap).toHaveBeenCalledTimes(1);
      });

      it("enforces spend cap when skipSpendCap is not specified", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        await withToolProtection(request);

        expect(mockEnforceSpendCap).toHaveBeenCalledTimes(1);
      });

      it("still enforces rate limit when skipSpendCap is true", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        await withToolProtection(request, { skipSpendCap: true });

        expect(mockEnforceRateLimit).toHaveBeenCalledTimes(1);
      });
    });

    // ========================================================================
    // Options: both skip flags
    // ========================================================================

    describe("both skip options combined", () => {
      it("skips both rate limit and spend cap when both are true", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        const result = await withToolProtection(request, {
          skipRateLimit: true,
          skipSpendCap: true,
        });

        expect(result.ok).toBe(true);
        expect(mockEnforceRateLimit).not.toHaveBeenCalled();
        expect(mockEnforceSpendCap).not.toHaveBeenCalled();
      });

      it("still performs session and captcha checks when both skip flags are true", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        await withToolProtection(request, {
          skipRateLimit: true,
          skipSpendCap: true,
        });

        expect(mockGetSessionIdFromCookies).toHaveBeenCalledTimes(1);
        expect(mockIsSessionValid).toHaveBeenCalledTimes(1);
        expect(mockGetSession).toHaveBeenCalledTimes(1);
      });
    });

    // ========================================================================
    // Short-circuit behavior
    // ========================================================================

    describe("short-circuit behavior", () => {
      it("does not call isSessionValid when no session cookie", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue(null);
        const request = createMockRequest();

        await withToolProtection(request);

        expect(mockIsSessionValid).not.toHaveBeenCalled();
      });

      it("does not call getSession when session is expired", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue("session-123");
        mockIsSessionValid.mockResolvedValue(false);
        const request = createMockRequest();

        await withToolProtection(request);

        expect(mockGetSession).not.toHaveBeenCalled();
      });

      it("does not call enforceRateLimit when captcha not passed", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue("session-123");
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue({
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
          // no captchaPassedAt
        });
        const request = createMockRequest();

        await withToolProtection(request);

        expect(mockEnforceRateLimit).not.toHaveBeenCalled();
      });

      it("does not call enforceSpendCap when rate limit is exceeded", async () => {
        mockGetSessionIdFromCookies.mockResolvedValue("session-123");
        mockIsSessionValid.mockResolvedValue(true);
        mockGetSession.mockResolvedValue({
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + 86400000),
          captchaPassedAt: Timestamp.now(),
        });
        mockEnforceRateLimit.mockRejectedValue(new RateLimitError(5000));
        const request = createMockRequest();

        await withToolProtection(request);

        expect(mockEnforceSpendCap).not.toHaveBeenCalled();
      });
    });

    // ========================================================================
    // Options defaults
    // ========================================================================

    describe("options defaults", () => {
      it("works with no options parameter", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        const result = await withToolProtection(request);

        expect(result.ok).toBe(true);
        expect(mockEnforceRateLimit).toHaveBeenCalledTimes(1);
        expect(mockEnforceSpendCap).toHaveBeenCalledTimes(1);
      });

      it("works with empty options object", async () => {
        setupPassingMocks();
        const request = createMockRequest();

        const result = await withToolProtection(request, {});

        expect(result.ok).toBe(true);
        expect(mockEnforceRateLimit).toHaveBeenCalledTimes(1);
        expect(mockEnforceSpendCap).toHaveBeenCalledTimes(1);
      });
    });
  });
});
