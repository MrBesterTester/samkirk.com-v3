/**
 * Decide whether the GA4 tag should load.
 *
 * The tag used to load whenever a real measurement ID was configured, with no
 * environment check. Every `npm run dev` page load and every Playwright run
 * therefore reported into the production property: in the 2026-08-05..2026-09-02
 * window, 297 of 347 "active users" were `localhost`, and 310 of them arrived on
 * the single day the E2E suite was run repeatedly. Playwright opens a fresh
 * browser context per test, so each one counted as a brand-new user — which is
 * also what made the traffic look like one-session-per-user bot noise.
 *
 * Gating on the deployment environment keeps development and preview traffic out
 * of the numbers the site is actually judged by.
 */
export interface AnalyticsEnv {
  /** GA4 measurement ID, e.g. "G-QPGLH8V5MM". */
  measurementId?: string;
  /** Vercel's deployment environment: "production" | "preview" | "development". */
  vercelEnv?: string;
  /** Set to "true" by the E2E harness. */
  e2eTesting?: string;
}

/** The placeholder shipped in the template, which must never be sent to GA. */
const PLACEHOLDER = "XXXXXXXXXX";

export function shouldLoadAnalytics({
  measurementId,
  vercelEnv,
  e2eTesting,
}: AnalyticsEnv): boolean {
  if (!measurementId || measurementId.includes(PLACEHOLDER)) return false;

  // Belt and braces: the E2E harness runs against localhost, which the
  // environment check already excludes, but a suite pointed at a production
  // build should not pollute the numbers either.
  if (e2eTesting === "true") return false;

  return vercelEnv === "production";
}
