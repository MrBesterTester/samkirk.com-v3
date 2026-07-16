/**
 * Tests for the master test runner's output parsing.
 *
 * These exist because of a specific failure on 2026-07-14: a test file aborted
 * in beforeAll (dead GCP credential), which fails the FILE while failing zero
 * individual tests. The runner reported "FAILED / 1309 passed / 0 failed" -- a
 * row that reads as green -- and that report passed a ship gate.
 */
import { describe, it, expect, afterEach } from "vitest";
import { parseVitestOutput, detectGcp } from "./test-all";

describe("parseVitestOutput", () => {
  it("counts a normal green run", () => {
    const output = `
 Test Files  42 passed (42)
      Tests  1309 passed | 2 skipped (1311)
`;
    expect(parseVitestOutput(output)).toEqual({
      passed: 1309,
      failed: 0,
      skipped: 2,
      failedFiles: 0,
    });
  });

  it("reports a suite-level abort even when zero individual tests failed", () => {
    // Verbatim shape of the 2026-07-14 unit run.
    const output = `
 Test Files  1 failed | 41 passed (42)
      Tests  1309 passed | 2 skipped (1311)
`;
    const result = parseVitestOutput(output);
    expect(result.failed).toBe(0);
    expect(result.failedFiles).toBe(1);
  });

  it("counts ordinary test failures alongside file failures", () => {
    const output = `
 Test Files  2 failed | 40 passed (42)
      Tests  3 failed | 1306 passed | 2 skipped (1311)
`;
    expect(parseVitestOutput(output)).toEqual({
      passed: 1306,
      failed: 3,
      skipped: 2,
      failedFiles: 2,
    });
  });

  it("returns zeroes rather than throwing on unparseable output", () => {
    expect(parseVitestOutput("build exploded before vitest started")).toEqual({
      passed: 0,
      failed: 0,
      skipped: 0,
      failedFiles: 0,
    });
  });
});

describe("detectGcp", () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns false when the env vars are absent", async () => {
    delete process.env.GCP_PROJECT_ID;
    delete process.env.GCS_PUBLIC_BUCKET;
    await expect(detectGcp()).resolves.toBe(false);
  });

  it("returns false when env vars are set but the credential is dead", async () => {
    // This is the 2026-07-14 state: .env.local named a project, so the old
    // name-check returned true and summary.md recorded `gcp_available: true`
    // -- while every GCP call failed on invalid_grant. An env var being a
    // non-empty string says nothing about whether the credential works.
    process.env.GCP_PROJECT_ID = "samkirk-v3";
    process.env.GCS_PUBLIC_BUCKET = "samkirk-v3-public";
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "/nonexistent/creds.json";
    process.env.CLOUDSDK_CONFIG = "/nonexistent/gcloud";

    await expect(detectGcp()).resolves.toBe(false);
  });
});
