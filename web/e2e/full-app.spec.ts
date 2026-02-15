import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import { resolve } from "path";

// Load env vars from .env.local (Playwright doesn't auto-load these)
config({ path: resolve(process.cwd(), ".env.local") });

const gcpAvailable = Boolean(process.env.GCP_PROJECT_ID);

/**
 * Full E2E tests for the deployed samkirk.com application.
 *
 * This test suite verifies:
 * - All public pages render correctly
 * - Navigation works
 * - Admin pages require authentication
 * - API endpoint health checks
 * - Guardrails (reCAPTCHA, rate limit display) function
 *
 * Prerequisites:
 * - E2E_TESTING and NEXT_PUBLIC_E2E_TESTING must be "true" (set by playwright.config.ts)
 * - For admin auth tests, OAuth is not automated (manual verification required)
 *
 * Note: The /hire-me page is now a unified chat-based interface.
 * Full tool flows are tested in their respective spec files.
 */

test.describe("Public Pages - Render Correctly", () => {
  test("home page loads with correct content", async ({ page }) => {
    await page.goto("/");

    // Page title or main heading should be visible
    await expect(page.locator("h1")).toBeVisible();

    // Navigation should be present
    await expect(page.getByRole("navigation")).toBeVisible();

    // Should have links to main sections (use .first() — nav link + CTA both match)
    await expect(page.getByRole("link", { name: /hire me/i }).first()).toBeVisible();
  });

  test("hire-me page loads with unified interface", async ({ page }) => {
    await page.goto("/hire-me");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Should show the unified "Interview me NOW" heading
    await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();

    // Should have the "Add Job" button for job context
    await expect(page.getByRole("button", { name: "Add Job" })).toBeVisible();

    // Description text should be visible
    await expect(
      page.getByText(/help you, the hiring manager, quickly evaluate/i)
    ).toBeVisible();
  });

  test("dance menu page loads", async ({ page }) => {
    await page.goto("/dance-menu");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Page should show menu content or "no menu" message
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("song dedication page loads", async ({ page }) => {
    await page.goto("/song-dedication");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("explorations hub page loads", async ({ page }) => {
    await page.goto("/explorations");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Should have links to exploration topics
    await expect(page.getByRole("link", { name: /category theory/i })).toBeVisible();
  });
});

test.describe("Exploration Pages - Render Correctly", () => {
  test("category theory page loads", async ({ page }) => {
    await page.goto("/explorations/category-theory");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("pocket flow page loads", async ({ page }) => {
    await page.goto("/explorations/pocket-flow");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("dance instruction page loads", async ({ page }) => {
    await page.goto("/explorations/dance-instruction");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("uber level ai skills page loads", async ({ page }) => {
    await page.goto("/explorations/uber-level-ai-skills");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Admin Pages - Authentication Required", () => {
  test("admin landing redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to login page or show access denied
    await page.waitForURL(/\/(admin\/login|api\/auth)/);

    // Or if showing access denied on the page
    const url = page.url();
    const body = await page.textContent("body");

    expect(
      url.includes("login") ||
      url.includes("auth") ||
      body?.toLowerCase().includes("sign in") ||
      body?.toLowerCase().includes("access denied")
    ).toBeTruthy();
  });

  test("admin resume page requires authentication", async ({ page }) => {
    await page.goto("/admin/resume");

    // Should redirect to login or show auth required
    await page.waitForURL(/\/(admin\/login|api\/auth)/, { timeout: 5000 }).catch(() => {
      // If no redirect, page should show auth-required message
    });

    const url = page.url();
    const body = await page.textContent("body");

    expect(
      url.includes("login") ||
      url.includes("auth") ||
      body?.toLowerCase().includes("sign in") ||
      body?.toLowerCase().includes("access denied")
    ).toBeTruthy();
  });

  test("admin dance-menu page requires authentication", async ({ page }) => {
    await page.goto("/admin/dance-menu");

    await page.waitForURL(/\/(admin\/login|api\/auth)/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    const body = await page.textContent("body");

    expect(
      url.includes("login") ||
      url.includes("auth") ||
      body?.toLowerCase().includes("sign in") ||
      body?.toLowerCase().includes("access denied")
    ).toBeTruthy();
  });

  test("admin submissions page requires authentication", async ({ page }) => {
    await page.goto("/admin/submissions");

    await page.waitForURL(/\/(admin\/login|api\/auth)/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    const body = await page.textContent("body");

    expect(
      url.includes("login") ||
      url.includes("auth") ||
      body?.toLowerCase().includes("sign in") ||
      body?.toLowerCase().includes("access denied")
    ).toBeTruthy();
  });
});

test.describe("Navigation - Links Work", () => {
  test("can navigate from home to hire-me", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /hire me/i }).first().click();

    await expect(page).toHaveURL(/\/hire-me/);
  });

  test("old sub-routes return 404", async ({ page }) => {
    // /hire-me/fit, /hire-me/resume, /hire-me/interview were removed
    const response1 = await page.goto("/hire-me/fit");
    expect(response1?.status()).toBe(404);

    const response2 = await page.goto("/hire-me/resume");
    expect(response2?.status()).toBe(404);

    const response3 = await page.goto("/hire-me/interview");
    expect(response3?.status()).toBe(404);
  });

  test("can navigate to explorations", async ({ page }) => {
    await page.goto("/");

    // Find and click explorations link
    const explorationsLink = page.getByRole("link", { name: /explorations/i }).first();
    await explorationsLink.click();

    await expect(page).toHaveURL(/\/explorations/);
  });
});

test.describe("API Endpoints - Basic Health", () => {
  test("session init endpoint responds with valid session payload", async ({ request }) => {
    test.skip(!gcpAvailable, "Requires GCP credentials");
    const response = await request.post("/api/session/init");

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Validate response contract: { sessionId, expiresAt, isNew }
    expect(body).toHaveProperty("sessionId");
    expect(typeof body.sessionId).toBe("string");
    expect(body.sessionId.length).toBeGreaterThan(0);

    expect(body).toHaveProperty("expiresAt");
    expect(typeof body.expiresAt).toBe("string");
    // Verify expiresAt is a valid ISO date string
    expect(new Date(body.expiresAt).toISOString()).toBe(body.expiresAt);

    expect(body).toHaveProperty("isNew");
    expect(typeof body.isNew).toBe("boolean");
  });

  test("maintenance retention endpoint responds to GET", async ({ request }) => {
    const response = await request.get("/api/maintenance/retention");

    // Should respond with status info
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Error Handling - 404 Pages", () => {
  test("non-existent page shows 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345");

    // Should return 404 status
    expect(response?.status()).toBe(404);
  });

  test("non-existent API route returns error", async ({ request }) => {
    const response = await request.get("/api/this-does-not-exist");

    // Should return 404
    expect(response.status()).toBe(404);
  });
});

test.describe("Accessibility - Basic Checks", () => {
  test("home page has proper heading structure", async ({ page }) => {
    await page.goto("/");

    // Should have exactly one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("hire-me page has proper heading structure", async ({ page }) => {
    await page.goto("/hire-me");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("pages have skip to main content or main landmark", async ({ page }) => {
    await page.goto("/");

    // Should have main element
    await expect(page.locator("main")).toBeVisible();
  });
});
