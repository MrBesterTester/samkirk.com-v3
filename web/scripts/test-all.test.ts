/**
 * Tests for the master test runner's output parsing.
 *
 * These exist because of a specific failure on 2026-07-14: a test file aborted
 * in beforeAll (dead GCP credential), which fails the FILE while failing zero
 * individual tests. The runner reported "FAILED / 1309 passed / 0 failed" -- a
 * row that reads as green -- and that report passed a ship gate.
 */
import { describe, it, expect } from "vitest";
import { parseVitestOutput } from "./test-all";

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
