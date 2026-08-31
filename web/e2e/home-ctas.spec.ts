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
 * The app hard-codes a measurement ID (lib/seo.ts), so the real gtag snippet
 * loads and replaces any stub we install — which is why this reads the
 * dataLayer the snippet pushes into rather than a stub of our own. Seeding the
 * array first means it exists even if the GA script itself is blocked, and the
 * snippet's `dataLayer || []` keeps what we seeded.
 *
 * gtag pushes its raw `arguments` object, so each entry is array-like rather
 * than an array; it is normalised in-page before crossing into Node.
 */
async function captureGaEvents(page: Page): Promise<() => Promise<GaCall[]>> {
  await page.addInitScript(() => {
    (window as unknown as { dataLayer: unknown[] }).dataLayer =
      (window as unknown as { dataLayer?: unknown[] }).dataLayer || [];
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

  test("the scheduling page is actually reachable", async ({ request }) => {
    // The one check that catches a revoked or expired Google booking link —
    // everything else here would still pass with a dead URL.
    const response = await request.get(BOOKING_URL, { maxRedirects: 5 });

    expect(response.status(), `GET ${BOOKING_URL}`).toBeLessThan(400);
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
    await expect(page.getByRole("button", { name: "Add Job" })).toBeVisible();
    await expect(page.getByRole("textbox").first()).toBeEnabled();
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
