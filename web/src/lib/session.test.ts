import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only to allow tests to run
vi.mock("server-only", () => ({}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock firestore module
vi.mock("./firestore", () => ({
  getSessionRef: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  })),
}));

// Import after mocks
import {
  generateSessionId,
  isValidSessionId,
  getSessionCookieOptions,
  createSessionTimestamps,
  hashIp,
  SESSION_ID_BYTES,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  SESSION_TTL_SECONDS,
} from "./session";

describe("session module", () => {
  describe("generateSessionId", () => {
    it("generates a string of correct length", () => {
      const sessionId = generateSessionId();
      // 32 bytes in base64url = 43 characters (no padding)
      expect(sessionId).toHaveLength(43);
    });

    it("generates URL-safe base64 characters only", () => {
      const sessionId = generateSessionId();
      // base64url uses only A-Z, a-z, 0-9, -, _
      expect(sessionId).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("generates unique IDs on each call", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSessionId());
      }
      // All 100 should be unique
      expect(ids.size).toBe(100);
    });

    it("generates cryptographically random IDs", () => {
      // Generate multiple IDs and check they have good entropy
      // (no obvious patterns like all zeros)
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);

      // Check that IDs don't start with the same prefix (extremely unlikely if random)
      // This is a weak entropy check but catches obvious bugs
      const prefix1 = id1.substring(0, 10);
      const prefix2 = id2.substring(0, 10);
      expect(prefix1).not.toBe(prefix2);
    });
  });

  describe("isValidSessionId", () => {
    it("accepts valid session IDs", () => {
      const validId = generateSessionId();
      expect(isValidSessionId(validId)).toBe(true);
    });

    it("rejects empty string", () => {
      expect(isValidSessionId("")).toBe(false);
    });

    it("rejects too short IDs", () => {
      expect(isValidSessionId("abc123")).toBe(false);
    });

    it("rejects too long IDs", () => {
      const longId = "a".repeat(100);
      expect(isValidSessionId(longId)).toBe(false);
    });

    it("rejects IDs with invalid characters", () => {
      // Create a 43-character string with invalid characters
      const invalidId = "a".repeat(42) + "!";
      expect(isValidSessionId(invalidId)).toBe(false);
    });

    it("rejects IDs with spaces", () => {
      const idWithSpace = "a".repeat(42) + " ";
      expect(isValidSessionId(idWithSpace)).toBe(false);
    });

    it("rejects IDs with plus sign (standard base64, not base64url)", () => {
      const idWithPlus = "a".repeat(42) + "+";
      expect(isValidSessionId(idWithPlus)).toBe(false);
    });

    it("rejects IDs with slash (standard base64, not base64url)", () => {
      const idWithSlash = "a".repeat(42) + "/";
      expect(isValidSessionId(idWithSlash)).toBe(false);
    });

    it("accepts IDs with underscore (valid in base64url)", () => {
      const idWithUnderscore = "a".repeat(42) + "_";
      expect(isValidSessionId(idWithUnderscore)).toBe(true);
    });

    it("accepts IDs with hyphen (valid in base64url)", () => {
      const idWithHyphen = "a".repeat(42) + "-";
      expect(isValidSessionId(idWithHyphen)).toBe(true);
    });
  });

  describe("getSessionCookieOptions", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      // Reset NODE_ENV after each test
      // @ts-expect-error -- reassigning readonly NODE_ENV for test teardown
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("returns httpOnly: true", () => {
      const options = getSessionCookieOptions();
      expect(options.httpOnly).toBe(true);
    });

    it("returns sameSite: strict", () => {
      const options = getSessionCookieOptions();
      expect(options.sameSite).toBe("strict");
    });

    it("returns path: /", () => {
      const options = getSessionCookieOptions();
      expect(options.path).toBe("/");
    });

    it("returns correct maxAge in seconds", () => {
      const options = getSessionCookieOptions();
      expect(options.maxAge).toBe(SESSION_TTL_SECONDS);
    });

    it("sets secure: true in production", () => {
      // @ts-expect-error -- reassigning readonly NODE_ENV for test setup
      process.env.NODE_ENV = "production";
      const options = getSessionCookieOptions();
      expect(options.secure).toBe(true);
    });

    it("sets secure: false in development", () => {
      // @ts-expect-error -- reassigning readonly NODE_ENV for test setup
      process.env.NODE_ENV = "development";
      const options = getSessionCookieOptions();
      expect(options.secure).toBe(false);
    });

    it("sets secure: false in test", () => {
      // @ts-expect-error -- reassigning readonly NODE_ENV for test setup
      process.env.NODE_ENV = "test";
      const options = getSessionCookieOptions();
      expect(options.secure).toBe(false);
    });
  });

  describe("createSessionTimestamps", () => {
    it("returns createdAt as a Firestore Timestamp", () => {
      const { createdAt } = createSessionTimestamps();
      expect(createdAt).toHaveProperty("toMillis");
      expect(typeof createdAt.toMillis()).toBe("number");
    });

    it("returns expiresAt as a Firestore Timestamp", () => {
      const { expiresAt } = createSessionTimestamps();
      expect(expiresAt).toHaveProperty("toMillis");
      expect(typeof expiresAt.toMillis()).toBe("number");
    });

    it("sets expiresAt to SESSION_TTL_MS after createdAt", () => {
      const { createdAt, expiresAt } = createSessionTimestamps();
      const diff = expiresAt.toMillis() - createdAt.toMillis();
      expect(diff).toBe(SESSION_TTL_MS);
    });

    it("creates timestamps close to current time", () => {
      const before = Date.now();
      const { createdAt } = createSessionTimestamps();
      const after = Date.now();

      const createdAtMs = createdAt.toMillis();
      expect(createdAtMs).toBeGreaterThanOrEqual(before);
      expect(createdAtMs).toBeLessThanOrEqual(after);
    });
  });

  describe("hashIp", () => {
    it("returns a 16-character hex string", () => {
      const hash = hashIp("192.168.1.1");
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("returns the same hash for the same IP", () => {
      const hash1 = hashIp("192.168.1.1");
      const hash2 = hashIp("192.168.1.1");
      expect(hash1).toBe(hash2);
    });

    it("returns different hashes for different IPs", () => {
      const hash1 = hashIp("192.168.1.1");
      const hash2 = hashIp("192.168.1.2");
      expect(hash1).not.toBe(hash2);
    });

    it("handles IPv6 addresses", () => {
      const hash = hashIp("::1");
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("handles empty string", () => {
      const hash = hashIp("");
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("constants", () => {
    it("SESSION_ID_BYTES is 32", () => {
      expect(SESSION_ID_BYTES).toBe(32);
    });

    it("SESSION_COOKIE_NAME is session_id", () => {
      expect(SESSION_COOKIE_NAME).toBe("session_id");
    });

    it("SESSION_TTL_MS is 7 days in milliseconds", () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(SESSION_TTL_MS).toBe(sevenDaysMs);
    });

    it("SESSION_TTL_SECONDS equals SESSION_TTL_MS / 1000", () => {
      expect(SESSION_TTL_SECONDS).toBe(SESSION_TTL_MS / 1000);
    });
  });
});
