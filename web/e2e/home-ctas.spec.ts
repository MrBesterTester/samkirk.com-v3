import { test, expect, type Page } from "@playwright/test";

/**
 * The two conversion buttons on the home page.
 *
 * "Book a Call" is the only path a prospective client has to Sam's calendar,
 * and it had no coverage at all before this file: a dead scheduling URL or a
 * silently-dropped analytics event would have shipped unnoticed.
 *
 * "Interview me NOW" is the entry point to /hire-me. These tests deliberately
 * stop at the landing — they verify the button navigates and the tool page is
 * ready for input, without sending a chat message, so no LLM call is made.
 */

/** The Google Calendar appointment page behind "Book a Call". */
const BOOKING_URL = "https://calendar.app.google/8H2wFxaahHkoTeM6A";

type GaCall = [string, string, Record<string, unknown>?];

/**
 * Read the GA4 events the trackers emitted.
 *
 * The real gtag snippet only loads on production deployments now
 * (lib/analytics-gate.ts), so on localhost nothing defines `window.gtag` and
 * `trackEvent` would no-op. This installs a stub that records calls, which the
 * previous version could not do because the real snippet replaced it.
 *
 * The stub pushes into `dataLayer`, the same array the real snippet uses, so
 * this keeps working unchanged if the suite is ever pointed at a build where
 * the real tag does load — the snippet's own `dataLayer || []` preserves what
 * we seeded, and both sets of calls land in one place.
 *
 * gtag pushes its raw `arguments` object, so each entry is array-like rather
 * than an array; it is normalised in-page before crossing into Node.
 */
async function captureGaEvents(page: Page): Promise<() => Promise<GaCall[]>> {
  await page.addInitScript(() => {
    const layer = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ||
      []) as unknown[];
    (window as unknown as { dataLayer: unknown[] }).dataLayer = layer;
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag =
      function (...args: unknown[]) {
        layer.push(args);
      };
  });

  return () =>
    page.evaluate(() => {
      const layer =
        (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];
      return layer
        .map((entry) => Array.from(entry as ArrayLike<unknown>))
        .filter((entry) => entry[0] === "event") as GaCall[];
    });
}

test.describe("Home page — Book a Call", () => {
  // One test in this block reaches Google's live scheduling page. It is the
  // only external dependency in the suite, and the only way to notice that the
  // booking link has gone dead without waiting for a client to report it.
  test("is visible with its booking copy", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /book a free 30-min consultation/i })
    ).toBeVisible();

    const cta = page.getByRole("link", { name: /book a call/i });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test("points at the scheduling page and opens it safely in a new tab", async ({
    page,
  }) => {
    await page.goto("/");

    const cta = page.getByRole("link", { name: /book a call/i });

    await expect(cta).toHaveAttribute("href", BOOKING_URL);
    await expect(cta).toHaveAttribute("target", "_blank");
    // rel guards against the new tab reaching back into this one via window.opener.
    await expect(cta).toHaveAttribute("rel", /noopener/);
    await expect(cta).toHaveAttribute("rel", /noreferrer/);
  });

  test("emits the contact_click event when clicked", async ({ page }) => {
    const readGa = await captureGaEvents(page);
    await page.goto("/");

    // The click opens a new tab; capture and close it so the run stays clean.
    const popupPromise = page.waitForEvent("popup").catch(() => null);
    await page.getByRole("link", { name: /book a call/i }).click();
    const popup = await popupPromise;
    if (popup) await popup.close();

    const events = await readGa();
    const contact = events.filter((e) => e[1] === "contact_click");

    expect(contact).toHaveLength(1);
    expect(contact[0][2]).toMatchObject({ method: "calendar" });
  });

  test("the scheduling page really renders a bookable calendar", async ({
    page,
  }) => {
    // A status check alone is not enough: Google serves its "this page isn't
    // available" screen with a 200, so a revoked link would still look healthy.
    // Load the page and insist on the things only a working scheduler shows.
    await page.goto(BOOKING_URL, { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/30-Minute Introductory Call with Sam Kirk/i);
    await expect(page.getByText(/select an appointment time/i)).toBeVisible({
      timeout: 20_000,
    });

    // At least one slot must be offered — a scheduler with zero availability
    // is indistinguishable, to a visitor, from a broken one.
    const slots = page.getByRole("button", { name: /^\d{1,2}:\d{2}(am|pm)$/i });
    expect(await slots.count()).toBeGreaterThan(0);
  });
});

test.describe("Home page — Interview me NOW", () => {
  test("is visible under the hiring-manager section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /hiring manager\?/i })
    ).toBeVisible();

    const cta = page.getByRole("link", { name: /interview me now/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/hire-me");
  });

  test("navigates to the hire-me tool", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /interview me now/i }).click();

    await expect(page).toHaveURL(/\/hire-me$/);
    await expect(
      page.getByRole("heading", { name: "Interview me NOW" })
    ).toBeVisible();
  });

  test("lands on a tool that is ready for input", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /interview me now/i }).click();
    await expect(page).toHaveURL(/\/hire-me$/);

    // Stops here on purpose: the controls being present and enabled is the
    // contract this button owes. Sending a message would spend an LLM call.
    const jobInput = page.locator(
      'textarea[placeholder*="Paste the full job posting"]'
    );
    await expect(jobInput).toBeVisible();
    await expect(jobInput).toBeEnabled();
  });

  test("emits the cta_click event with a stable id", async ({ page }) => {
    const readGa = await captureGaEvents(page);
    await page.goto("/");

    await page.getByRole("link", { name: /interview me now/i }).click();
    await expect(page).toHaveURL(/\/hire-me$/);

    // Read before navigation tears the context down — Playwright keeps the
    // same JS context for a client-side Next.js route change.
    const events = await readGa();
    const cta = events.filter((e) => e[1] === "cta_click");

    expect(cta).toHaveLength(1);
    expect(cta[0][2]).toMatchObject({
      cta_id: "home_interview_me_now",
      cta_text: "Interview me NOW",
      page_path: "/",
    });
  });
});
