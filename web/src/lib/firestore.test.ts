import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  Collections,
  sessionDocPath,
  rateLimitDocPath,
  spendMonthlyDocPath,
  getCurrentMonthKey,
  resumeIndexDocPath,
  resumeChunkDocPath,
  submissionDocPath,
} from "./firestore";

// Mock the server-only module to allow testing
vi.mock("server-only", () => ({}));

// Mock the env module
vi.mock("./env", () => ({
  getEnv: () => ({
    GCP_PROJECT_ID: "test-project",
    GCS_PUBLIC_BUCKET: "test-public-bucket",
    GCS_PRIVATE_BUCKET: "test-private-bucket",
    VERTEX_AI_LOCATION: "us-central1",
    VERTEX_AI_MODEL: "gemini-pro",
    RECAPTCHA_SITE_KEY: "test-site-key",
    RECAPTCHA_SECRET_KEY: "test-secret-key",
    GOOGLE_OAUTH_CLIENT_ID: "test-client-id",
    GOOGLE_OAUTH_CLIENT_SECRET: "test-client-secret",
  }),
}));

describe("firestore path helpers", () => {
  describe("Collections", () => {
    it("defines expected collection names", () => {
      expect(Collections.SESSIONS).toBe("sessions");
      expect(Collections.RATE_LIMITS).toBe("rateLimits");
      expect(Collections.SPEND_MONTHLY).toBe("spendMonthly");
      expect(Collections.RESUME_INDEX).toBe("resumeIndex");
      expect(Collections.RESUME_CHUNKS).toBe("resumeChunks");
      expect(Collections.SUBMISSIONS).toBe("submissions");
    });
  });

  describe("sessionDocPath", () => {
    it("builds correct path for session document", () => {
      expect(sessionDocPath("abc123")).toBe("sessions/abc123");
      expect(sessionDocPath("session-with-dashes")).toBe(
        "sessions/session-with-dashes"
      );
    });
  });

  describe("rateLimitDocPath", () => {
    it("builds correct path for rate limit document", () => {
      expect(rateLimitDocPath("hash123")).toBe("rateLimits/hash123");
      expect(rateLimitDocPath("session+ip+tools")).toBe(
        "rateLimits/session+ip+tools"
      );
    });
  });

  describe("spendMonthlyDocPath", () => {
    it("builds correct path for monthly spend document", () => {
      expect(spendMonthlyDocPath("2026-02")).toBe("spendMonthly/2026-02");
      expect(spendMonthlyDocPath("2025-12")).toBe("spendMonthly/2025-12");
    });
  });

  describe("getCurrentMonthKey", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns YYYY-MM format for current month", () => {
      vi.setSystemTime(new Date("2026-02-15"));
      expect(getCurrentMonthKey()).toBe("2026-02");
    });

    it("pads single-digit months with leading zero", () => {
      // Use middle of month/day to avoid timezone edge cases
      vi.setSystemTime(new Date("2026-01-15T12:00:00"));
      expect(getCurrentMonthKey()).toBe("2026-01");

      vi.setSystemTime(new Date("2026-09-15T12:00:00"));
      expect(getCurrentMonthKey()).toBe("2026-09");
    });

    it("handles December correctly", () => {
      vi.setSystemTime(new Date("2026-12-31"));
      expect(getCurrentMonthKey()).toBe("2026-12");
    });
  });

  describe("resumeIndexDocPath", () => {
    it("returns the fixed path for resume index", () => {
      expect(resumeIndexDocPath()).toBe("resumeIndex/current");
    });
  });

  describe("resumeChunkDocPath", () => {
    it("builds correct path for resume chunk document", () => {
      expect(resumeChunkDocPath("chunk-001")).toBe("resumeChunks/chunk-001");
      expect(resumeChunkDocPath("v1-experience-1")).toBe(
        "resumeChunks/v1-experience-1"
      );
    });
  });

  describe("submissionDocPath", () => {
    it("builds correct path for submission document", () => {
      expect(submissionDocPath("sub-abc123")).toBe("submissions/sub-abc123");
      expect(submissionDocPath("uuid-format")).toBe("submissions/uuid-format");
    });
  });
});
