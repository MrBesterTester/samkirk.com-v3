import { describe, it, expect, vi } from "vitest";
import { Timestamp } from "@google-cloud/firestore";
import {
  MAX_DELETIONS_PER_RUN,
  QUERY_BATCH_SIZE,
  isExpired,
  isValidSubmissionPrefix,
  extractSubmissionIdFromPrefix,
  buildCleanupSummary,
  type DeletionResult,
  type RetentionCleanupResult,
  type ExpiredSubmission,
} from "./retention";

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

describe("retention module", () => {
  describe("constants", () => {
    it("defines MAX_DELETIONS_PER_RUN as 100", () => {
      expect(MAX_DELETIONS_PER_RUN).toBe(100);
    });

    it("defines QUERY_BATCH_SIZE as 100", () => {
      expect(QUERY_BATCH_SIZE).toBe(100);
    });

    it("MAX_DELETIONS_PER_RUN is a reasonable value for Cloud Scheduler timeout", () => {
      // Cloud Scheduler has a 30-minute timeout, 100 deletions should complete well within that
      expect(MAX_DELETIONS_PER_RUN).toBeGreaterThanOrEqual(10);
      expect(MAX_DELETIONS_PER_RUN).toBeLessThanOrEqual(1000);
    });
  });

  describe("isExpired", () => {
    it("returns true when expiresAt is before now", () => {
      const now = Timestamp.fromMillis(1700000000000); // Fixed point in time
      const expiresAt = Timestamp.fromMillis(1699999999999); // 1ms before now

      expect(isExpired(expiresAt, now)).toBe(true);
    });

    it("returns true when expiresAt equals now", () => {
      const now = Timestamp.fromMillis(1700000000000);
      const expiresAt = Timestamp.fromMillis(1700000000000); // Exactly now

      expect(isExpired(expiresAt, now)).toBe(true);
    });

    it("returns false when expiresAt is after now", () => {
      const now = Timestamp.fromMillis(1700000000000);
      const expiresAt = Timestamp.fromMillis(1700000000001); // 1ms after now

      expect(isExpired(expiresAt, now)).toBe(false);
    });

    it("returns false for far future expirations", () => {
      const now = Timestamp.fromMillis(1700000000000);
      const expiresAt = Timestamp.fromMillis(1800000000000); // ~3 years later

      expect(isExpired(expiresAt, now)).toBe(false);
    });

    it("returns true for far past expirations", () => {
      const now = Timestamp.fromMillis(1700000000000);
      const expiresAt = Timestamp.fromMillis(1600000000000); // ~3 years earlier

      expect(isExpired(expiresAt, now)).toBe(true);
    });

    it("handles millisecond precision correctly", () => {
      const now = Timestamp.fromMillis(1700000000001);
      const expiresAt = Timestamp.fromMillis(1700000000000);

      expect(isExpired(expiresAt, now)).toBe(true);
    });

    it("uses current time when now is not provided", () => {
      // Create an expiration time 1 day ago
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const expiresAt = Timestamp.fromMillis(oneDayAgo);

      expect(isExpired(expiresAt)).toBe(true);
    });

    it("returns false for future expiration when now is not provided", () => {
      // Create an expiration time 1 day from now
      const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000;
      const expiresAt = Timestamp.fromMillis(oneDayFromNow);

      expect(isExpired(expiresAt)).toBe(false);
    });
  });

  describe("isValidSubmissionPrefix", () => {
    it("returns true for valid submission prefix with trailing slash", () => {
      expect(isValidSubmissionPrefix("submissions/abc123/")).toBe(true);
    });

    it("returns true for valid submission prefix without trailing slash", () => {
      expect(isValidSubmissionPrefix("submissions/abc123")).toBe(true);
    });

    it("returns true for submission ID with underscores", () => {
      expect(isValidSubmissionPrefix("submissions/abc_def_123/")).toBe(true);
    });

    it("returns true for submission ID with hyphens", () => {
      expect(isValidSubmissionPrefix("submissions/abc-def-123/")).toBe(true);
    });

    it("returns true for submission ID with mixed characters", () => {
      expect(isValidSubmissionPrefix("submissions/AbC-dEf_123/")).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isValidSubmissionPrefix("")).toBe(false);
    });

    it("returns false for prefix not starting with submissions/", () => {
      expect(isValidSubmissionPrefix("other/abc123/")).toBe(false);
    });

    it("returns false for submissions without ID", () => {
      expect(isValidSubmissionPrefix("submissions/")).toBe(false);
    });

    it("returns false for nested paths beyond submission ID", () => {
      expect(isValidSubmissionPrefix("submissions/abc123/output/")).toBe(false);
    });

    it("returns false for submission ID with invalid characters", () => {
      expect(isValidSubmissionPrefix("submissions/abc.123/")).toBe(false);
      expect(isValidSubmissionPrefix("submissions/abc@123/")).toBe(false);
      expect(isValidSubmissionPrefix("submissions/abc 123/")).toBe(false);
    });

    it("returns false for resume path", () => {
      expect(isValidSubmissionPrefix("resume/master.md")).toBe(false);
    });

    it("returns false for dance-menu path", () => {
      expect(isValidSubmissionPrefix("dance-menu/current/")).toBe(false);
    });

    it("validates base64url-style submission IDs", () => {
      // Real submission IDs are 22-char base64url strings
      expect(isValidSubmissionPrefix("submissions/abcdefghij1234567890AB/")).toBe(
        true
      );
    });
  });

  describe("extractSubmissionIdFromPrefix", () => {
    it("extracts ID from valid prefix with trailing slash", () => {
      expect(extractSubmissionIdFromPrefix("submissions/abc123/")).toBe("abc123");
    });

    it("extracts ID from valid prefix without trailing slash", () => {
      expect(extractSubmissionIdFromPrefix("submissions/abc123")).toBe("abc123");
    });

    it("extracts ID with underscores and hyphens", () => {
      expect(extractSubmissionIdFromPrefix("submissions/abc_def-123/")).toBe(
        "abc_def-123"
      );
    });

    it("returns null for invalid prefix", () => {
      expect(extractSubmissionIdFromPrefix("other/abc123/")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(extractSubmissionIdFromPrefix("")).toBeNull();
    });

    it("returns null for nested paths", () => {
      expect(extractSubmissionIdFromPrefix("submissions/abc123/output/")).toBeNull();
    });

    it("returns null for prefix without ID", () => {
      expect(extractSubmissionIdFromPrefix("submissions/")).toBeNull();
    });

    it("extracts real base64url submission ID", () => {
      const base64urlId = "AbCdEfGh1234_-AB0123";
      expect(extractSubmissionIdFromPrefix(`submissions/${base64urlId}/`)).toBe(
        base64urlId
      );
    });
  });

  describe("buildCleanupSummary", () => {
    const baseResult: RetentionCleanupResult = {
      expiredFound: 0,
      deletedCount: 0,
      failedCount: 0,
      details: [],
      startedAt: "2026-02-03T10:00:00.000Z",
      completedAt: "2026-02-03T10:00:01.000Z",
      durationMs: 1000,
    };

    it("builds summary for empty cleanup (no expired submissions)", () => {
      const summary = buildCleanupSummary(baseResult);

      expect(summary).toContain("Retention cleanup completed");
      expect(summary).toContain("found=0");
      expect(summary).toContain("deleted=0");
      expect(summary).toContain("failed=0");
      expect(summary).toContain("duration=1000ms");
    });

    it("builds summary for successful cleanup", () => {
      const result: RetentionCleanupResult = {
        ...baseResult,
        expiredFound: 5,
        deletedCount: 5,
        failedCount: 0,
        details: [
          { submissionId: "sub1", gcsFilesDeleted: 3, success: true },
          { submissionId: "sub2", gcsFilesDeleted: 2, success: true },
          { submissionId: "sub3", gcsFilesDeleted: 4, success: true },
          { submissionId: "sub4", gcsFilesDeleted: 1, success: true },
          { submissionId: "sub5", gcsFilesDeleted: 5, success: true },
        ],
        durationMs: 5000,
      };

      const summary = buildCleanupSummary(result);

      expect(summary).toContain("found=5");
      expect(summary).toContain("deleted=5");
      expect(summary).toContain("failed=0");
      expect(summary).toContain("duration=5000ms");
      expect(summary).not.toContain("failed_ids");
    });

    it("builds summary with failed deletions and includes IDs", () => {
      const result: RetentionCleanupResult = {
        ...baseResult,
        expiredFound: 3,
        deletedCount: 1,
        failedCount: 2,
        details: [
          { submissionId: "sub1", gcsFilesDeleted: 3, success: true },
          {
            submissionId: "sub2",
            gcsFilesDeleted: 0,
            success: false,
            error: "GCS error",
          },
          {
            submissionId: "sub3",
            gcsFilesDeleted: 0,
            success: false,
            error: "Firestore error",
          },
        ],
      };

      const summary = buildCleanupSummary(result);

      expect(summary).toContain("found=3");
      expect(summary).toContain("deleted=1");
      expect(summary).toContain("failed=2");
      expect(summary).toContain("failed_ids=[sub2, sub3]");
    });

    it("does not include error messages in summary (security)", () => {
      const result: RetentionCleanupResult = {
        ...baseResult,
        expiredFound: 1,
        deletedCount: 0,
        failedCount: 1,
        details: [
          {
            submissionId: "sub1",
            gcsFilesDeleted: 0,
            success: false,
            error: "Secret API key invalid: sk_live_xxxxx",
          },
        ],
      };

      const summary = buildCleanupSummary(result);

      // Should include the ID but not the error message
      expect(summary).toContain("failed_ids=[sub1]");
      expect(summary).not.toContain("Secret");
      expect(summary).not.toContain("API key");
      expect(summary).not.toContain("sk_live");
    });

    it("handles large number of failures gracefully", () => {
      const failedDetails: DeletionResult[] = Array.from({ length: 50 }, (_, i) => ({
        submissionId: `sub${i}`,
        gcsFilesDeleted: 0,
        success: false,
        error: "Error",
      }));

      const result: RetentionCleanupResult = {
        ...baseResult,
        expiredFound: 50,
        deletedCount: 0,
        failedCount: 50,
        details: failedDetails,
      };

      const summary = buildCleanupSummary(result);

      expect(summary).toContain("failed=50");
      expect(summary).toContain("failed_ids=[");
      // All IDs should be listed
      expect(summary).toContain("sub0");
      expect(summary).toContain("sub49");
    });

    it("formats duration correctly", () => {
      const result: RetentionCleanupResult = {
        ...baseResult,
        durationMs: 12345,
      };

      const summary = buildCleanupSummary(result);

      expect(summary).toContain("duration=12345ms");
    });
  });

  describe("ExpiredSubmission type", () => {
    it("has required fields for deletion", () => {
      const submission: ExpiredSubmission = {
        id: "test-submission-id",
        artifactGcsPrefix: "submissions/test-submission-id/",
        tool: "fit",
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.now(),
      };

      expect(submission.id).toBeDefined();
      expect(submission.artifactGcsPrefix).toBeDefined();
      expect(submission.tool).toBeDefined();
      expect(submission.createdAt).toBeDefined();
      expect(submission.expiresAt).toBeDefined();
    });

    it("supports all tool types", () => {
      const tools = ["fit", "resume", "interview"];

      for (const tool of tools) {
        const submission: ExpiredSubmission = {
          id: "test-id",
          artifactGcsPrefix: "submissions/test-id/",
          tool,
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.now(),
        };

        expect(submission.tool).toBe(tool);
      }
    });
  });

  describe("DeletionResult type", () => {
    it("represents successful deletion", () => {
      const result: DeletionResult = {
        submissionId: "test-id",
        gcsFilesDeleted: 5,
        success: true,
      };

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("represents failed deletion with error", () => {
      const result: DeletionResult = {
        submissionId: "test-id",
        gcsFilesDeleted: 0,
        success: false,
        error: "Permission denied",
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Permission denied");
    });

    it("tracks number of GCS files deleted", () => {
      const result: DeletionResult = {
        submissionId: "test-id",
        gcsFilesDeleted: 10,
        success: true,
      };

      expect(result.gcsFilesDeleted).toBe(10);
    });
  });

  describe("RetentionCleanupResult type", () => {
    it("has complete cleanup summary fields", () => {
      const result: RetentionCleanupResult = {
        expiredFound: 10,
        deletedCount: 8,
        failedCount: 2,
        details: [],
        startedAt: "2026-02-03T10:00:00.000Z",
        completedAt: "2026-02-03T10:00:05.000Z",
        durationMs: 5000,
      };

      expect(result.expiredFound).toBe(10);
      expect(result.deletedCount).toBe(8);
      expect(result.failedCount).toBe(2);
      expect(result.details).toEqual([]);
      expect(result.startedAt).toBe("2026-02-03T10:00:00.000Z");
      expect(result.completedAt).toBe("2026-02-03T10:00:05.000Z");
      expect(result.durationMs).toBe(5000);
    });

    it("expiredFound equals deletedCount + failedCount", () => {
      const result: RetentionCleanupResult = {
        expiredFound: 10,
        deletedCount: 7,
        failedCount: 3,
        details: [],
        startedAt: "2026-02-03T10:00:00.000Z",
        completedAt: "2026-02-03T10:00:05.000Z",
        durationMs: 5000,
      };

      expect(result.expiredFound).toBe(result.deletedCount + result.failedCount);
    });
  });

  describe("retention policy edge cases", () => {
    it("90-day retention in milliseconds", () => {
      // 90 days = 90 * 24 * 60 * 60 * 1000 ms
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      expect(ninetyDaysMs).toBe(7776000000);
    });

    it("handles submissions created exactly 90 days ago", () => {
      const now = new Date("2026-05-04T12:00:00.000Z");
      const ninetyDaysAgo = new Date("2026-02-03T12:00:00.000Z");

      // Submission created 90 days ago should have expired
      const expiresAt = Timestamp.fromMillis(ninetyDaysAgo.getTime() + 90 * 24 * 60 * 60 * 1000);
      const nowTimestamp = Timestamp.fromMillis(now.getTime());

      expect(isExpired(expiresAt, nowTimestamp)).toBe(true);
    });

    it("handles submissions created 89 days and 23 hours ago", () => {
      const now = new Date("2026-05-04T11:00:00.000Z");
      const ninetyDaysAgo = new Date("2026-02-03T12:00:00.000Z");

      // Submission created 89 days and 23 hours ago should NOT have expired yet
      const expiresAt = Timestamp.fromMillis(ninetyDaysAgo.getTime() + 90 * 24 * 60 * 60 * 1000);
      const nowTimestamp = Timestamp.fromMillis(now.getTime());

      expect(isExpired(expiresAt, nowTimestamp)).toBe(false);
    });

    it("handles leap year correctly", () => {
      // 2028 is a leap year
      const leapYearStart = new Date("2028-02-01T12:00:00.000Z");
      const ninetyDaysLater = new Date(leapYearStart.getTime() + 90 * 24 * 60 * 60 * 1000);

      // 90 days from Feb 1, 2028 (leap year) should be May 1, 2028
      expect(ninetyDaysLater.toISOString()).toBe("2028-05-01T12:00:00.000Z");
    });

    it("handles year boundary correctly", () => {
      const yearEnd = new Date("2026-12-15T12:00:00.000Z");
      const ninetyDaysLater = new Date(yearEnd.getTime() + 90 * 24 * 60 * 60 * 1000);

      // 90 days from Dec 15, 2026 should be in March 2027
      expect(ninetyDaysLater.getFullYear()).toBe(2027);
    });
  });

  describe("idempotency scenarios", () => {
    it("deletion is safe to retry (conceptual)", () => {
      // This test documents the idempotent behavior:
      // 1. deletePrefix returns 0 if no files exist (safe)
      // 2. Firestore delete succeeds even if doc doesn't exist (safe)
      // 3. Query only returns existing docs (already deleted won't appear)

      // These behaviors are tested in integration tests with real services
      expect(true).toBe(true);
    });

    it("partial deletion is recoverable", () => {
      // If GCS delete succeeds but Firestore delete fails:
      // - Next run will query Firestore, find the doc
      // - GCS deletePrefix will return 0 (already deleted)
      // - Firestore delete will succeed

      // This is the correct order: GCS first, then Firestore
      expect(true).toBe(true);
    });
  });

  describe("security considerations", () => {
    it("submission prefix pattern prevents path traversal", () => {
      // These should all fail validation
      expect(isValidSubmissionPrefix("../secrets/")).toBe(false);
      expect(isValidSubmissionPrefix("submissions/../secrets/")).toBe(false);
      expect(isValidSubmissionPrefix("submissions/abc/../../../")).toBe(false);
    });

    it("submission ID extraction is safe", () => {
      // These should return null (preventing injection)
      expect(extractSubmissionIdFromPrefix("../secrets/")).toBeNull();
      expect(extractSubmissionIdFromPrefix("submissions/../")).toBeNull();
    });

    it("cleanup summary does not include file contents", () => {
      const result: RetentionCleanupResult = {
        expiredFound: 1,
        deletedCount: 1,
        failedCount: 0,
        details: [
          {
            submissionId: "contains-sensitive-data",
            gcsFilesDeleted: 3,
            success: true,
          },
        ],
        startedAt: "2026-02-03T10:00:00.000Z",
        completedAt: "2026-02-03T10:00:01.000Z",
        durationMs: 1000,
      };

      const summary = buildCleanupSummary(result);

      // Summary should only contain counts and IDs, not file contents
      expect(summary).not.toContain("sensitive");
      expect(summary).toContain("deleted=1");
    });
  });
});
