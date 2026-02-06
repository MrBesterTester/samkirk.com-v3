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
 * - Tool pages load and show captcha gate
 * - Guardrails (reCAPTCHA, rate limit display) function
 *
 * Prerequisites:
 * - E2E_TESTING and NEXT_PUBLIC_E2E_TESTING must be "true" (set by playwright.config.ts)
 * - For admin auth tests, OAuth is not automated (manual verification required)
 *
 * Note: Full tool flows (Fit, Resume, Interview) are tested in their respective
 * spec files. This suite focuses on page accessibility and navigation.
 */

test.describe("Public Pages - Render Correctly", () => {
  test("home page loads with correct content", async ({ page }) => {
    await page.goto("/");

    // Page title or main heading should be visible
    await expect(page.locator("h1")).toBeVisible();

    // Navigation should be present
    await expect(page.getByRole("navigation")).toBeVisible();

    // Should have links to main sections
    await expect(page.getByRole("link", { name: /tools/i })).toBeVisible();
  });

  test("tools hub page loads", async ({ page }) => {
    await page.goto("/tools");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Should have links to all three tools
    await expect(page.getByRole("link", { name: /fit/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /resume/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /interview/i })).toBeVisible();
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

test.describe("Tool Pages - Load with Captcha Gate", () => {
  test("fit tool page loads", async ({ page }) => {
    test.skip(!gcpAvailable, "Requires GCP credentials");
    await page.goto("/tools/fit");

    await expect(page.getByRole("heading", { name: "How Do I Fit?" })).toBeVisible();

    // In E2E mode, captcha auto-bypasses and form appears
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("resume tool page loads", async ({ page }) => {
    test.skip(!gcpAvailable, "Requires GCP credentials");
    await page.goto("/tools/resume");

    await expect(page.getByRole("heading", { name: "Get a Custom Resume" })).toBeVisible();

    // In E2E mode, captcha auto-bypasses and form appears
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("interview tool page loads", async ({ page }) => {
    test.skip(!gcpAvailable, "Requires GCP credentials");
    await page.goto("/tools/interview");

    await expect(page.getByRole("heading", { name: "Interview Me Now" })).toBeVisible();

    // In E2E mode, captcha auto-bypasses and chat appears
    await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
      timeout: 10000,
    });
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
  test("can navigate from home to tools", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /tools/i }).first().click();

    await expect(page).toHaveURL(/\/tools/);
  });

  test("can navigate from tools to fit tool", async ({ page }) => {
    await page.goto("/tools");

    await page.getByRole("link", { name: /fit/i }).first().click();

    await expect(page).toHaveURL(/\/tools\/fit/);
  });

  test("can navigate from tools to resume tool", async ({ page }) => {
    await page.goto("/tools");

    await page.getByRole("link", { name: /resume/i }).first().click();

    await expect(page).toHaveURL(/\/tools\/resume/);
  });

  test("can navigate from tools to interview tool", async ({ page }) => {
    await page.goto("/tools");

    await page.getByRole("link", { name: /interview/i }).first().click();

    await expect(page).toHaveURL(/\/tools\/interview/);
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
  test("session init endpoint responds", async ({ request }) => {
    test.skip(!gcpAvailable, "Requires GCP credentials");
    const response = await request.post("/api/session/init");

    // Should respond (200 or 4xx for validation)
    expect(response.status()).toBeLessThan(500);
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

  test("tool pages have proper heading structure", async ({ page }) => {
    await page.goto("/tools/fit");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("pages have skip to main content or main landmark", async ({ page }) => {
    await page.goto("/");

    // Should have main element
    await expect(page.locator("main")).toBeVisible();
  });
});
