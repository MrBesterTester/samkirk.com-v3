import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SUBMISSION_ID_BYTES,
  SUBMISSION_RETENTION_DAYS,
  SUBMISSION_RETENTION_MS,
  generateSubmissionId,
  isValidSubmissionId,
  createSubmissionTimestamps,
  createSubmissionTimestampsFromDate,
  calculateExpiresAt,
  isSubmissionExpired,
  buildArtifactGcsPrefix,
  isValidTool,
  isValidStatus,
  isValidCitation,
  isValidCitationsArray,
  VALID_TOOLS,
  VALID_STATUSES,
} from "./submission";
import { Timestamp } from "@google-cloud/firestore";

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

describe("submission module", () => {
  describe("constants", () => {
    it("defines submission ID byte length", () => {
      expect(SUBMISSION_ID_BYTES).toBe(16);
    });

    it("defines 90-day retention period", () => {
      expect(SUBMISSION_RETENTION_DAYS).toBe(90);
    });

    it("calculates retention period in milliseconds correctly", () => {
      const expectedMs = 90 * 24 * 60 * 60 * 1000;
      expect(SUBMISSION_RETENTION_MS).toBe(expectedMs);
    });

    it("has valid tools list", () => {
      expect(VALID_TOOLS).toEqual(["fit", "resume", "interview"]);
    });

    it("has valid statuses list", () => {
      expect(VALID_STATUSES).toEqual([
        "in_progress",
        "complete",
        "blocked",
        "error",
      ]);
    });
  });

  describe("generateSubmissionId", () => {
    it("generates a string ID", () => {
      const id = generateSubmissionId();
      expect(typeof id).toBe("string");
    });

    it("generates IDs of correct length (22 chars for 16 bytes base64url)", () => {
      const id = generateSubmissionId();
      expect(id.length).toBe(22);
    });

    it("generates unique IDs on each call", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSubmissionId());
      }
      expect(ids.size).toBe(100);
    });

    it("generates URL-safe base64 characters only", () => {
      const id = generateSubmissionId();
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("isValidSubmissionId", () => {
    it("returns true for valid submission IDs", () => {
      const validId = generateSubmissionId();
      expect(isValidSubmissionId(validId)).toBe(true);
    });

    it("returns false for IDs that are too short", () => {
      expect(isValidSubmissionId("abc")).toBe(false);
      expect(isValidSubmissionId("")).toBe(false);
    });

    it("returns false for IDs that are too long", () => {
      expect(isValidSubmissionId("a".repeat(30))).toBe(false);
    });

    it("returns false for IDs with invalid characters", () => {
      expect(isValidSubmissionId("a".repeat(21) + "!")).toBe(false);
      expect(isValidSubmissionId("a".repeat(21) + " ")).toBe(false);
      expect(isValidSubmissionId("a".repeat(21) + "+")).toBe(false);
    });

    it("accepts underscores and hyphens (base64url)", () => {
      // A valid 22-char string with underscores and hyphens
      expect(isValidSubmissionId("abcd_efgh-ijklmnopqrst")).toBe(true);
    });
  });

  describe("createSubmissionTimestamps", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("creates createdAt as the current time", () => {
      const now = new Date("2026-02-02T12:00:00Z");
      vi.setSystemTime(now);

      const { createdAt } = createSubmissionTimestamps();
      expect(createdAt.toMillis()).toBe(now.getTime());
    });

    it("creates expiresAt 90 days after createdAt", () => {
      const now = new Date("2026-02-02T12:00:00Z");
      vi.setSystemTime(now);

      const { createdAt, expiresAt } = createSubmissionTimestamps();

      const diffMs = expiresAt.toMillis() - createdAt.toMillis();
      expect(diffMs).toBe(SUBMISSION_RETENTION_MS);
    });

    it("returns Firestore Timestamp objects", () => {
      vi.setSystemTime(new Date("2026-02-02T12:00:00Z"));

      const { createdAt, expiresAt } = createSubmissionTimestamps();
      expect(createdAt).toBeInstanceOf(Timestamp);
      expect(expiresAt).toBeInstanceOf(Timestamp);
    });
  });

  describe("createSubmissionTimestampsFromDate", () => {
    it("creates timestamps based on the provided date", () => {
      const baseDate = new Date("2026-06-15T10:30:00Z");
      const { createdAt, expiresAt } = createSubmissionTimestampsFromDate(baseDate);

      expect(createdAt.toMillis()).toBe(baseDate.getTime());
      expect(expiresAt.toMillis()).toBe(baseDate.getTime() + SUBMISSION_RETENTION_MS);
    });

    it("handles edge cases like end of year", () => {
      const baseDate = new Date("2026-12-31T23:59:59Z");
      const { createdAt, expiresAt } = createSubmissionTimestampsFromDate(baseDate);

      expect(createdAt.toMillis()).toBe(baseDate.getTime());

      // Expiry should be in 2027
      const expiresAtDate = new Date(expiresAt.toMillis());
      expect(expiresAtDate.getFullYear()).toBe(2027);
    });
  });

  describe("calculateExpiresAt", () => {
    it("returns a date 90 days after the input", () => {
      const createdAt = new Date("2026-02-02T12:00:00Z");
      const expiresAt = calculateExpiresAt(createdAt);

      const diffMs = expiresAt.getTime() - createdAt.getTime();
      expect(diffMs).toBe(SUBMISSION_RETENTION_MS);
    });

    it("handles leap year correctly", () => {
      // 2028 is a leap year
      const createdAt = new Date("2028-02-01T12:00:00Z");
      const expiresAt = calculateExpiresAt(createdAt);

      // Should be May 1, 2028 (90 days including Feb 29)
      const expectedDate = new Date(createdAt.getTime() + SUBMISSION_RETENTION_MS);
      expect(expiresAt.getTime()).toBe(expectedDate.getTime());
    });

    it("returns a Date object", () => {
      const createdAt = new Date("2026-02-02T12:00:00Z");
      const expiresAt = calculateExpiresAt(createdAt);
      expect(expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("isSubmissionExpired", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns false when current time is before expiration", () => {
      const now = new Date("2026-02-02T12:00:00Z");
      vi.setSystemTime(now);

      // Expires 1 day from now
      const expiresAt = Timestamp.fromMillis(
        now.getTime() + 24 * 60 * 60 * 1000
      );
      expect(isSubmissionExpired(expiresAt)).toBe(false);
    });

    it("returns true when current time is after expiration", () => {
      const now = new Date("2026-02-02T12:00:00Z");
      vi.setSystemTime(now);

      // Expired 1 day ago
      const expiresAt = Timestamp.fromMillis(
        now.getTime() - 24 * 60 * 60 * 1000
      );
      expect(isSubmissionExpired(expiresAt)).toBe(true);
    });

    it("returns true when current time equals expiration exactly", () => {
      const now = new Date("2026-02-02T12:00:00Z");
      vi.setSystemTime(now);

      const expiresAt = Timestamp.fromMillis(now.getTime());
      expect(isSubmissionExpired(expiresAt)).toBe(true);
    });

    it("correctly identifies submissions created 90 days ago as expired", () => {
      const now = new Date("2026-05-03T12:00:00Z");
      vi.setSystemTime(now);

      // Created exactly 90 days ago
      const createdAt = new Date("2026-02-02T12:00:00Z");
      const expiresAt = Timestamp.fromMillis(
        createdAt.getTime() + SUBMISSION_RETENTION_MS
      );

      expect(isSubmissionExpired(expiresAt)).toBe(true);
    });

    it("correctly identifies submissions created 89 days ago as not expired", () => {
      const now = new Date("2026-05-02T12:00:00Z");
      vi.setSystemTime(now);

      // Created 89 days ago (should not be expired yet)
      const createdAt = new Date("2026-02-02T12:00:00Z");
      const expiresAt = Timestamp.fromMillis(
        createdAt.getTime() + SUBMISSION_RETENTION_MS
      );

      expect(isSubmissionExpired(expiresAt)).toBe(false);
    });
  });

  describe("buildArtifactGcsPrefix", () => {
    it("builds correct prefix for a submission ID", () => {
      expect(buildArtifactGcsPrefix("abc123")).toBe("submissions/abc123/");
    });

    it("includes trailing slash", () => {
      const prefix = buildArtifactGcsPrefix("test-id");
      expect(prefix.endsWith("/")).toBe(true);
    });

    it("handles submission IDs with special characters", () => {
      const id = "abc_def-ghi123";
      expect(buildArtifactGcsPrefix(id)).toBe(`submissions/${id}/`);
    });
  });

  describe("isValidTool", () => {
    it("returns true for valid tools", () => {
      expect(isValidTool("fit")).toBe(true);
      expect(isValidTool("resume")).toBe(true);
      expect(isValidTool("interview")).toBe(true);
    });

    it("returns false for invalid tools", () => {
      expect(isValidTool("invalid")).toBe(false);
      expect(isValidTool("")).toBe(false);
      expect(isValidTool("FIT")).toBe(false); // case sensitive
      expect(isValidTool("other")).toBe(false);
    });
  });

  describe("isValidStatus", () => {
    it("returns true for valid statuses", () => {
      expect(isValidStatus("in_progress")).toBe(true);
      expect(isValidStatus("complete")).toBe(true);
      expect(isValidStatus("blocked")).toBe(true);
      expect(isValidStatus("error")).toBe(true);
    });

    it("returns false for invalid statuses", () => {
      expect(isValidStatus("invalid")).toBe(false);
      expect(isValidStatus("")).toBe(false);
      expect(isValidStatus("COMPLETE")).toBe(false); // case sensitive
      expect(isValidStatus("pending")).toBe(false);
    });
  });

  describe("isValidCitation", () => {
    it("returns true for valid citation objects", () => {
      const citation = {
        chunkId: "chunk-001",
        title: "Experience Section",
        sourceRef: "h2:Experience > Project X",
      };
      expect(isValidCitation(citation)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidCitation(null)).toBe(false);
    });

    it("returns false for non-objects", () => {
      expect(isValidCitation("string")).toBe(false);
      expect(isValidCitation(123)).toBe(false);
      expect(isValidCitation(undefined)).toBe(false);
    });

    it("returns false when chunkId is missing", () => {
      expect(
        isValidCitation({
          title: "Title",
          sourceRef: "ref",
        })
      ).toBe(false);
    });

    it("returns false when title is missing", () => {
      expect(
        isValidCitation({
          chunkId: "chunk-001",
          sourceRef: "ref",
        })
      ).toBe(false);
    });

    it("returns false when sourceRef is missing", () => {
      expect(
        isValidCitation({
          chunkId: "chunk-001",
          title: "Title",
        })
      ).toBe(false);
    });

    it("returns false when fields are not strings", () => {
      expect(
        isValidCitation({
          chunkId: 123,
          title: "Title",
          sourceRef: "ref",
        })
      ).toBe(false);

      expect(
        isValidCitation({
          chunkId: "chunk-001",
          title: null,
          sourceRef: "ref",
        })
      ).toBe(false);
    });

    it("allows extra fields (forward compatibility)", () => {
      const citation = {
        chunkId: "chunk-001",
        title: "Experience Section",
        sourceRef: "h2:Experience > Project X",
        extraField: "some value",
      };
      expect(isValidCitation(citation)).toBe(true);
    });
  });

  describe("isValidCitationsArray", () => {
    it("returns true for empty array", () => {
      expect(isValidCitationsArray([])).toBe(true);
    });

    it("returns true for array with valid citations", () => {
      const citations = [
        {
          chunkId: "chunk-001",
          title: "Experience Section",
          sourceRef: "h2:Experience",
        },
        {
          chunkId: "chunk-002",
          title: "Skills Section",
          sourceRef: "h2:Skills",
        },
      ];
      expect(isValidCitationsArray(citations)).toBe(true);
    });

    it("returns false for non-arrays", () => {
      expect(isValidCitationsArray(null)).toBe(false);
      expect(isValidCitationsArray(undefined)).toBe(false);
      expect(isValidCitationsArray("string")).toBe(false);
      expect(isValidCitationsArray({})).toBe(false);
    });

    it("returns false if any citation is invalid", () => {
      const citations = [
        {
          chunkId: "chunk-001",
          title: "Experience Section",
          sourceRef: "h2:Experience",
        },
        {
          chunkId: "chunk-002",
          // missing title
          sourceRef: "h2:Skills",
        },
      ];
      expect(isValidCitationsArray(citations)).toBe(false);
    });

    it("returns false for array with non-object elements", () => {
      expect(isValidCitationsArray(["string", "another"])).toBe(false);
      expect(isValidCitationsArray([123, 456])).toBe(false);
    });
  });

  describe("TTL computation edge cases", () => {
    it("handles daylight saving time transitions", () => {
      // Test around DST transition (March 2026 in US)
      const beforeDST = new Date("2026-03-07T12:00:00Z");
      const expiresAt = calculateExpiresAt(beforeDST);

      // Should still be exactly 90 days in milliseconds
      expect(expiresAt.getTime() - beforeDST.getTime()).toBe(SUBMISSION_RETENTION_MS);
    });

    it("handles year boundary correctly", () => {
      const endOfYear = new Date("2026-12-01T12:00:00Z");
      const expiresAt = calculateExpiresAt(endOfYear);

      // Should expire in March 2027
      expect(expiresAt.getFullYear()).toBe(2027);
    });

    it("preserves time component across 90 days", () => {
      const specificTime = new Date("2026-02-02T14:35:22.123Z");
      const expiresAt = calculateExpiresAt(specificTime);

      // Time component should be preserved
      expect(expiresAt.getUTCHours()).toBe(14);
      expect(expiresAt.getUTCMinutes()).toBe(35);
      expect(expiresAt.getUTCSeconds()).toBe(22);
      expect(expiresAt.getUTCMilliseconds()).toBe(123);
    });
  });
});
