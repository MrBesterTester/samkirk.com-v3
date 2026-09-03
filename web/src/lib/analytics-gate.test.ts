import { describe, expect, it } from "vitest";

import { shouldLoadAnalytics } from "./analytics-gate";

const REAL_ID = "G-QPGLH8V5MM";

describe("shouldLoadAnalytics", () => {
  it("loads on the production deployment", () => {
    expect(
      shouldLoadAnalytics({ measurementId: REAL_ID, vercelEnv: "production" }),
    ).toBe(true);
  });

  it("stays off on a local dev server", () => {
    // The defect this exists to prevent: `npm run dev` and every Playwright run
    // reported into the production property. 297 of 347 "users" in the
    // 2026-08-05..09-02 window were localhost.
    expect(
      shouldLoadAnalytics({ measurementId: REAL_ID, vercelEnv: undefined }),
    ).toBe(false);
  });

  it("stays off on preview deployments", () => {
    expect(
      shouldLoadAnalytics({ measurementId: REAL_ID, vercelEnv: "preview" }),
    ).toBe(false);
  });

  it("stays off in E2E mode even on production", () => {
    expect(
      shouldLoadAnalytics({
        measurementId: REAL_ID,
        vercelEnv: "production",
        e2eTesting: "true",
      }),
    ).toBe(false);
  });

  it("stays off when the measurement ID is missing", () => {
    expect(shouldLoadAnalytics({ measurementId: "", vercelEnv: "production" })).toBe(
      false,
    );
    expect(
      shouldLoadAnalytics({ measurementId: undefined, vercelEnv: "production" }),
    ).toBe(false);
  });

  it("stays off for the placeholder measurement ID", () => {
    expect(
      shouldLoadAnalytics({
        measurementId: "G-XXXXXXXXXX",
        vercelEnv: "production",
      }),
    ).toBe(false);
  });
});
