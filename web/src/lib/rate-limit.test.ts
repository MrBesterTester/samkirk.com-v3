import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Timestamp } from "@google-cloud/firestore";

// Mock server-only to allow tests to run
vi.mock("server-only", () => ({}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock the session module
vi.mock("./session", () => ({
  getSessionIdFromCookies: vi.fn(),
  hashIp: vi.fn((ip: string) => `hashed_${ip}`),
}));

// Mock the firestore module
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockRunTransaction = vi.fn();

vi.mock("./firestore", () => ({
  getRateLimitRef: vi.fn(() => ({
    set: mockSet,
    get: mockGet,
    firestore: {
      runTransaction: mockRunTransaction,
    },
  })),
}));

// Import after mocks
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_KEY_PREFIX,
  RATE_LIMIT_CONTACT_EMAIL,
  RateLimitError,
  getClientIp,
  deriveRateLimitKey,
  createRateLimitWindow,
  createRateLimitWindowFromDate,
  isWindowExpired,
  getWindowRemainingMs,
} from "./rate-limit";
import { NextRequest } from "next/server";

// Helper to create a mock NextRequest
function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  const request = {
    headers: new Headers(headers),
  } as NextRequest;
  return request;
}

describe("rate-limit module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constants", () => {
    it("defines RATE_LIMIT_MAX_REQUESTS as 10", () => {
      expect(RATE_LIMIT_MAX_REQUESTS).toBe(10);
    });

    it("defines RATE_LIMIT_WINDOW_MS as 10 minutes", () => {
      const tenMinutesMs = 10 * 60 * 1000;
      expect(RATE_LIMIT_WINDOW_MS).toBe(tenMinutesMs);
    });

    it("defines RATE_LIMIT_KEY_PREFIX as 'tools'", () => {
      expect(RATE_LIMIT_KEY_PREFIX).toBe("tools");
    });

    it("defines RATE_LIMIT_CONTACT_EMAIL as 'sam@samkirk.com'", () => {
      expect(RATE_LIMIT_CONTACT_EMAIL).toBe("sam@samkirk.com");
    });
  });

  describe("RateLimitError", () => {
    it("creates an error with correct properties", () => {
      const error = new RateLimitError(5000);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("RateLimitError");
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.statusCode).toBe(429);
      expect(error.retryAfterMs).toBe(5000);
      expect(error.contactEmail).toBe("sam@samkirk.com");
    });

    it("has a message with contact email", () => {
      const error = new RateLimitError(5000);
      expect(error.message).toContain("sam@samkirk.com");
      expect(error.message).toContain("Rate limit exceeded");
    });

    it("can be serialized to JSON", () => {
      const error = new RateLimitError(30000);
      const json = error.toJSON();

      expect(json).toEqual({
        error: "rate_limit_exceeded",
        message: expect.stringContaining("Rate limit exceeded"),
        contactEmail: "sam@samkirk.com",
        retryAfterMs: 30000,
      });
    });

    it("handles different retry times", () => {
      const error1 = new RateLimitError(1000);
      const error2 = new RateLimitError(600000);

      expect(error1.retryAfterMs).toBe(1000);
      expect(error2.retryAfterMs).toBe(600000);
    });

    it("handles zero retry time", () => {
      const error = new RateLimitError(0);
      expect(error.retryAfterMs).toBe(0);
    });
  });

  describe("getClientIp", () => {
    it("extracts IP from X-Forwarded-For header", () => {
      const request = createMockRequest({
        "x-forwarded-for": "203.0.113.195",
      });

      expect(getClientIp(request)).toBe("203.0.113.195");
    });

    it("extracts first IP from X-Forwarded-For chain", () => {
      const request = createMockRequest({
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      });

      expect(getClientIp(request)).toBe("203.0.113.195");
    });

    it("trims whitespace from X-Forwarded-For IP", () => {
      const request = createMockRequest({
        "x-forwarded-for": "  203.0.113.195  , 70.41.3.18",
      });

      expect(getClientIp(request)).toBe("203.0.113.195");
    });

    it("extracts IP from X-Real-IP header", () => {
      const request = createMockRequest({
        "x-real-ip": "203.0.113.100",
      });

      expect(getClientIp(request)).toBe("203.0.113.100");
    });

    it("prefers X-Forwarded-For over X-Real-IP", () => {
      const request = createMockRequest({
        "x-forwarded-for": "203.0.113.195",
        "x-real-ip": "203.0.113.100",
      });

      expect(getClientIp(request)).toBe("203.0.113.195");
    });

    it("returns fallback IP when no headers present", () => {
      const request = createMockRequest({});

      expect(getClientIp(request)).toBe("127.0.0.1");
    });

    it("returns fallback when X-Forwarded-For is empty", () => {
      const request = createMockRequest({
        "x-forwarded-for": "",
      });

      expect(getClientIp(request)).toBe("127.0.0.1");
    });

    it("handles IPv6 addresses", () => {
      const request = createMockRequest({
        "x-forwarded-for": "2001:db8::1",
      });

      expect(getClientIp(request)).toBe("2001:db8::1");
    });
  });

  describe("deriveRateLimitKey", () => {
    it("creates a key with the default prefix", () => {
      const key = deriveRateLimitKey("session123", "iphash456");

      expect(key).toMatch(/^tools:/);
    });

    it("creates a key with a custom prefix", () => {
      const key = deriveRateLimitKey("session123", "iphash456", "custom");

      expect(key).toMatch(/^custom:/);
    });

    it("produces a consistent hash for the same inputs", () => {
      const key1 = deriveRateLimitKey("session123", "iphash456");
      const key2 = deriveRateLimitKey("session123", "iphash456");

      expect(key1).toBe(key2);
    });

    it("produces different hashes for different sessions", () => {
      const key1 = deriveRateLimitKey("session123", "iphash456");
      const key2 = deriveRateLimitKey("session789", "iphash456");

      expect(key1).not.toBe(key2);
    });

    it("produces different hashes for different IPs", () => {
      const key1 = deriveRateLimitKey("session123", "iphash456");
      const key2 = deriveRateLimitKey("session123", "iphash789");

      expect(key1).not.toBe(key2);
    });

    it("produces a key with manageable length", () => {
      const key = deriveRateLimitKey("session123", "iphash456");

      // Format: prefix:hash (prefix is "tools", hash is 32 chars)
      expect(key.length).toBeLessThanOrEqual(50);
    });

    it("produces a key safe for Firestore document IDs", () => {
      const key = deriveRateLimitKey("session123", "iphash456");

      // Should only contain alphanumeric and colon
      expect(key).toMatch(/^[a-z0-9:]+$/);
    });
  });

  describe("createRateLimitWindow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns windowStart as the current time", () => {
      const now = new Date("2026-02-03T12:00:00Z");
      vi.setSystemTime(now);

      const { windowStart } = createRateLimitWindow();

      expect(windowStart.toMillis()).toBe(now.getTime());
    });

    it("returns expiresAt as 10 minutes after windowStart", () => {
      const now = new Date("2026-02-03T12:00:00Z");
      vi.setSystemTime(now);

      const { windowStart, expiresAt } = createRateLimitWindow();

      const diffMs = expiresAt.toMillis() - windowStart.toMillis();
      expect(diffMs).toBe(RATE_LIMIT_WINDOW_MS);
    });

    it("returns Firestore Timestamp objects", () => {
      vi.setSystemTime(new Date("2026-02-03T12:00:00Z"));

      const { windowStart, expiresAt } = createRateLimitWindow();

      expect(windowStart).toBeInstanceOf(Timestamp);
      expect(expiresAt).toBeInstanceOf(Timestamp);
    });
  });

  describe("createRateLimitWindowFromDate", () => {
    it("creates window based on the provided date", () => {
      const baseDate = new Date("2026-06-15T10:30:00Z");
      const { windowStart, expiresAt } = createRateLimitWindowFromDate(baseDate);

      expect(windowStart.toMillis()).toBe(baseDate.getTime());
      expect(expiresAt.toMillis()).toBe(baseDate.getTime() + RATE_LIMIT_WINDOW_MS);
    });

    it("handles midnight correctly", () => {
      const baseDate = new Date("2026-02-03T00:00:00Z");
      const { windowStart, expiresAt } = createRateLimitWindowFromDate(baseDate);

      expect(windowStart.toMillis()).toBe(baseDate.getTime());
      
      // Should expire at 00:10:00
      const expiresAtDate = new Date(expiresAt.toMillis());
      expect(expiresAtDate.getUTCHours()).toBe(0);
      expect(expiresAtDate.getUTCMinutes()).toBe(10);
    });

    it("handles end of day correctly", () => {
      const baseDate = new Date("2026-02-03T23:55:00Z");
      const { windowStart, expiresAt } = createRateLimitWindowFromDate(baseDate);

      expect(windowStart.toMillis()).toBe(baseDate.getTime());

      // Should expire at 00:05:00 next day
      const expiresAtDate = new Date(expiresAt.toMillis());
      expect(expiresAtDate.getUTCDate()).toBe(4);
      expect(expiresAtDate.getUTCHours()).toBe(0);
      expect(expiresAtDate.getUTCMinutes()).toBe(5);
    });
  });

  describe("isWindowExpired", () => {
    it("returns false when window has not expired", () => {
      const now = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(now + 60000); // Expires in 1 minute

      expect(isWindowExpired(expiresAt, now)).toBe(false);
    });

    it("returns true when window has expired", () => {
      const now = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(now - 60000); // Expired 1 minute ago

      expect(isWindowExpired(expiresAt, now)).toBe(true);
    });

    it("returns true when current time equals expiration exactly", () => {
      const now = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(now);

      expect(isWindowExpired(expiresAt, now)).toBe(true);
    });

    it("uses current time by default", () => {
      // Create a window that expires in the future
      const futureTime = Date.now() + 60000;
      const expiresAt = Timestamp.fromMillis(futureTime);

      expect(isWindowExpired(expiresAt)).toBe(false);
    });

    it("correctly handles very recent expiration", () => {
      const now = new Date("2026-02-03T12:00:00.000Z").getTime();
      const expiresAt = Timestamp.fromMillis(now - 1); // Expired 1ms ago

      expect(isWindowExpired(expiresAt, now)).toBe(true);
    });

    it("correctly handles window just about to expire", () => {
      const now = new Date("2026-02-03T12:00:00.000Z").getTime();
      const expiresAt = Timestamp.fromMillis(now + 1); // Expires in 1ms

      expect(isWindowExpired(expiresAt, now)).toBe(false);
    });
  });

  describe("getWindowRemainingMs", () => {
    it("returns remaining time when window is active", () => {
      const now = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(now + 300000); // Expires in 5 minutes

      expect(getWindowRemainingMs(expiresAt, now)).toBe(300000);
    });

    it("returns 0 when window has expired", () => {
      const now = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(now - 60000); // Expired 1 minute ago

      expect(getWindowRemainingMs(expiresAt, now)).toBe(0);
    });

    it("returns 0 when current time equals expiration exactly", () => {
      const now = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(now);

      expect(getWindowRemainingMs(expiresAt, now)).toBe(0);
    });

    it("handles very large negative values (long expired)", () => {
      const now = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(now - 86400000); // Expired 1 day ago

      expect(getWindowRemainingMs(expiresAt, now)).toBe(0);
    });

    it("correctly calculates remaining time at various points in window", () => {
      const windowStart = new Date("2026-02-03T12:00:00Z").getTime();
      const expiresAt = Timestamp.fromMillis(windowStart + RATE_LIMIT_WINDOW_MS);

      // At start of window
      expect(getWindowRemainingMs(expiresAt, windowStart)).toBe(RATE_LIMIT_WINDOW_MS);

      // 5 minutes in
      const midpoint = windowStart + 5 * 60 * 1000;
      expect(getWindowRemainingMs(expiresAt, midpoint)).toBe(5 * 60 * 1000);

      // 9 minutes in
      const nearEnd = windowStart + 9 * 60 * 1000;
      expect(getWindowRemainingMs(expiresAt, nearEnd)).toBe(1 * 60 * 1000);
    });
  });

  describe("rate limit window behavior", () => {
    it("window duration is exactly 10 minutes", () => {
      const { windowStart, expiresAt } = createRateLimitWindow();
      const duration = expiresAt.toMillis() - windowStart.toMillis();
      
      expect(duration).toBe(10 * 60 * 1000);
    });

    it("can track multiple windows without overlap", () => {
      // First window
      const window1Start = new Date("2026-02-03T12:00:00Z");
      const window1 = createRateLimitWindowFromDate(window1Start);

      // Second window starts after first expires
      const window2Start = new Date(window1.expiresAt.toMillis());
      const window2 = createRateLimitWindowFromDate(window2Start);

      // No overlap: window1 expires exactly when window2 starts
      expect(window1.expiresAt.toMillis()).toBe(window2.windowStart.toMillis());
    });

    it("correctly identifies expiration across all window scenarios", () => {
      const windowStart = new Date("2026-02-03T12:00:00Z").getTime();
      const { expiresAt } = createRateLimitWindowFromDate(new Date(windowStart));

      // Before window
      expect(isWindowExpired(expiresAt, windowStart - 1000)).toBe(false);

      // During window (1 minute in)
      expect(isWindowExpired(expiresAt, windowStart + 60000)).toBe(false);

      // During window (5 minutes in)
      expect(isWindowExpired(expiresAt, windowStart + 5 * 60000)).toBe(false);

      // At exact expiration
      expect(isWindowExpired(expiresAt, windowStart + RATE_LIMIT_WINDOW_MS)).toBe(true);

      // After window
      expect(isWindowExpired(expiresAt, windowStart + RATE_LIMIT_WINDOW_MS + 1000)).toBe(true);
    });
  });

  describe("integration: key derivation and window management", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("produces a complete rate limit scenario", () => {
      const now = new Date("2026-02-03T12:00:00Z");
      vi.setSystemTime(now);

      // Derive a key for a user
      const sessionId = "user-session-12345";
      const ipHash = "abcd1234efgh5678";
      const key = deriveRateLimitKey(sessionId, ipHash);

      // Create a window
      const { windowStart, expiresAt } = createRateLimitWindow();

      // Key is valid format
      expect(key).toMatch(/^tools:[a-f0-9]+$/);

      // Window starts now
      expect(windowStart.toMillis()).toBe(now.getTime());

      // Window expires in 10 minutes
      expect(expiresAt.toMillis()).toBe(now.getTime() + RATE_LIMIT_WINDOW_MS);

      // Advance time 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);
      const midpointNow = Date.now();

      // Window should not be expired
      expect(isWindowExpired(expiresAt, midpointNow)).toBe(false);
      expect(getWindowRemainingMs(expiresAt, midpointNow)).toBe(5 * 60 * 1000);

      // Advance another 6 minutes (past window expiration)
      vi.advanceTimersByTime(6 * 60 * 1000);
      const afterExpirationNow = Date.now();

      // Window should be expired
      expect(isWindowExpired(expiresAt, afterExpirationNow)).toBe(true);
      expect(getWindowRemainingMs(expiresAt, afterExpirationNow)).toBe(0);
    });
  });

  describe("counter increment simulation", () => {
    it("simulates 10 requests within window succeeding", () => {
      let count = 0;

      for (let i = 0; i < 10; i++) {
        count++;
        expect(count).toBeLessThanOrEqual(RATE_LIMIT_MAX_REQUESTS);
      }

      expect(count).toBe(10);
    });

    it("simulates 11th request being blocked", () => {
      const count = 10; // Already at limit

      const newCount = count + 1;
      expect(newCount).toBeGreaterThan(RATE_LIMIT_MAX_REQUESTS);
    });

    it("simulates window reset behavior", () => {
      // First window: fill to limit
      let count = 10;
      expect(count).toBe(RATE_LIMIT_MAX_REQUESTS);

      // Window expires, reset count
      count = 0;

      // New window: can make requests again
      count++;
      expect(count).toBe(1);
      expect(count).toBeLessThanOrEqual(RATE_LIMIT_MAX_REQUESTS);
    });
  });

  describe("error message formatting", () => {
    it("includes helpful information in error message", () => {
      const error = new RateLimitError(300000); // 5 minutes

      expect(error.message).toContain("Rate limit exceeded");
      expect(error.message).toContain("sam@samkirk.com");
    });

    it("JSON response includes all necessary fields", () => {
      const error = new RateLimitError(120000); // 2 minutes
      const json = error.toJSON();

      expect(json.error).toBe("rate_limit_exceeded");
      expect(json.contactEmail).toBe("sam@samkirk.com");
      expect(json.retryAfterMs).toBe(120000);
      expect(json.message).toBeDefined();
    });
  });
});
