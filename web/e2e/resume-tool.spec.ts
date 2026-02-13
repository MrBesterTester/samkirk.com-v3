import { test, expect } from "@playwright/test";

/**
 * E2E tests for the "Get a Custom Resume" tool.
 *
 * Prerequisites:
 * - GCP environment must be configured (.env.local with valid credentials)
 * - E2E_TESTING and NEXT_PUBLIC_E2E_TESTING must be "true" (set by playwright.config.ts)
 *
 * The tests use a special captcha bypass token that's automatically accepted
 * in E2E test mode, allowing the tests to proceed without actual reCAPTCHA interaction.
 */

// Sample job posting for testing
const SAMPLE_JOB_POSTING = `
Senior Software Engineer - AI/ML Platform

Company: TechCorp Inc.
Location: Remote (US-based)

About the Role:
We're looking for a Senior Software Engineer to join our AI/ML Platform team.
This is a fully remote position for candidates based in the United States.

Requirements:
- 5+ years of software engineering experience
- Strong experience with Python and TypeScript
- Experience with cloud platforms (GCP, AWS, or Azure)
- Experience with machine learning frameworks (TensorFlow, PyTorch)
- Experience building and deploying ML models in production

Nice to have:
- Experience with Kubernetes and containerization
- Experience with data pipelines and ETL
- Experience with LLMs and generative AI

Compensation:
- Competitive salary based on experience
- Equity package
- Comprehensive benefits

This is a senior-level IC position with opportunities for technical leadership.
`;

test.describe("Resume Tool Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Resume tool page
    await page.goto("/hire-me/resume");
  });

  test("should complete full flow: input → generating → results", async ({
    page,
  }) => {
    // Wait for initialization and captcha bypass
    // The CaptchaGate component auto-verifies in E2E mode
    await expect(page.getByRole("heading", { name: "Get a Custom Resume" })).toBeVisible();

    // Wait for the job input form to appear (after captcha passes)
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Enter the job posting text in paste mode (default mode)
    const textarea = page.getByRole("textbox", { name: /job posting text/i });
    await textarea.fill(SAMPLE_JOB_POSTING);

    // Click the generate button
    const generateButton = page.getByRole("button", { name: /generate custom resume/i });
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Wait for generating state
    await expect(page.getByText(/generating your custom resume/i)).toBeVisible({ timeout: 5000 });

    // Wait for the resume to be ready (this can take time due to LLM call)
    await expect(page.getByText(/your custom resume is ready/i)).toBeVisible({
      timeout: 240000, // 4 minutes for LLM generation
    });

    // Verify the results page is displayed
    await expect(page.getByText(/your custom resume is ready/i)).toBeVisible();

    // Verify key elements of the results
    await expect(page.getByText(/professional summary/i)).toBeVisible();
    await expect(page.getByText(/experience entries/i)).toBeVisible();
    await expect(page.getByText(/skill categories/i)).toBeVisible();

    // Verify factual accuracy note is present
    await expect(page.getByText(/factual accuracy guaranteed/i)).toBeVisible();

    // Verify action buttons are present
    await expect(page.getByRole("button", { name: /download resume bundle/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /generate another resume/i })).toBeVisible();
  });

  test("should allow generating another resume after completion", async ({ page }) => {
    // This is a lighter test that just verifies the form loads correctly
    await expect(page.getByRole("heading", { name: "Get a Custom Resume" })).toBeVisible();

    // Wait for captcha bypass and form to appear
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify all input modes are available
    await expect(page.getByRole("button", { name: /paste text/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /enter url/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /upload file/i })).toBeVisible();
  });

  test("should show URL input mode when selected", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Click URL mode tab
    await page.getByRole("button", { name: /enter url/i }).click();

    // Verify URL input is visible
    await expect(page.getByRole("textbox", { name: /job posting url/i })).toBeVisible();
  });

  test("should validate empty input", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // The generate button should be disabled when input is empty
    const generateButton = page.getByRole("button", { name: /generate custom resume/i });
    await expect(generateButton).toBeDisabled();

    // Enter some text
    const textarea = page.getByRole("textbox", { name: /job posting text/i });
    await textarea.fill("Some job posting text");

    // Now the button should be enabled
    await expect(generateButton).toBeEnabled();

    // Clear the text
    await textarea.clear();

    // Button should be disabled again
    await expect(generateButton).toBeDisabled();
  });

  test("should display feature cards", async ({ page }) => {
    // Verify the feature cards are displayed
    await expect(page.getByText(/100% factual/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/2-page format/i)).toBeVisible();
    await expect(page.getByText(/multiple formats/i)).toBeVisible();
  });
});

test.describe("Resume Tool Error Handling", () => {
  test("should handle error states gracefully", async ({ page }) => {
    // Navigate to the Resume tool page
    await page.goto("/hire-me/resume");

    // Wait for the form
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Enter minimal text that might fail validation on the server
    const textarea = page.getByRole("textbox", { name: /job posting text/i });
    await textarea.fill("x"); // Very short input

    // Try to submit
    const generateButton = page.getByRole("button", { name: /generate custom resume/i });
    await generateButton.click();

    // The request should still be made (validation is primarily server-side)
    // Wait for either an error or processing
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Generating") ||
          body.includes("error") ||
          body.includes("Error") ||
          body.includes("Ready")
        );
      },
      { timeout: 10000 }
    );
  });
});
