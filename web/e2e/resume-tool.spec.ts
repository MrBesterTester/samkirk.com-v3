import path from "path";
import fs from "fs";
import os from "os";
import { test, expect, type Page } from "@playwright/test";
import { verifyZipContents } from "./helpers/zip-verify";

/**
 * E2E tests for the Resume Generation flow on the unified Hire Me page.
 *
 * Prerequisites:
 * - GCP environment must be configured (.env.local with valid credentials)
 * - E2E_TESTING and NEXT_PUBLIC_E2E_TESTING must be "true" (set by playwright.config.ts)
 *
 * The unified /hire-me page combines all three tools (fit, resume, interview)
 * into a single chat-based interface. The flow is:
 * 1. Click "Add Job" to expand the JobContextBar
 * 2. Enter job posting text (paste/URL/file)
 * 3. Click "Load Job"
 * 4. Click "Generate Resume" preset chip
 * 5. View resume preview card in chat stream
 * 6. Download resume bundle from actions bar
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

/**
 * Helper: Load a job posting via the JobContextBar using paste mode.
 */
async function loadJobViaPaste(page: import("@playwright/test").Page, text: string) {
  await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();

  // Wait for ToolGate captcha to pass
  await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
    timeout: 15000,
  });

  // Expand JobContextBar
  await page.getByRole("button", { name: "Add Job" }).click();

  // Fill in the job posting text
  const textarea = page.locator('textarea[placeholder*="Paste the full job posting"]');
  await expect(textarea).toBeVisible({ timeout: 5000 });
  await textarea.fill(text);

  // Submit
  await page.getByRole("button", { name: "Load Job" }).click();

  // Wait for preset chips
  await expect(page.getByRole("button", { name: /Generate Resume/i })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Helper: Load a job posting via URL mode.
 */
async function loadJobViaUrl(page: import("@playwright/test").Page, url: string) {
  await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();
  await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
    timeout: 15000,
  });

  await page.getByRole("button", { name: "Add Job" }).click();
  await page.getByRole("button", { name: "Enter URL" }).click();

  const urlInput = page.locator('input[type="url"]');
  await expect(urlInput).toBeVisible();
  await urlInput.fill(url);

  await page.getByRole("button", { name: "Load Job" }).click();

  await expect(page.getByRole("button", { name: /Generate Resume/i })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Helper: Load a job posting via file upload mode.
 */
async function loadJobViaFile(page: import("@playwright/test").Page, filePath: string) {
  await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();
  await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
    timeout: 15000,
  });

  await page.getByRole("button", { name: "Add Job" }).click();
  await page.getByRole("button", { name: "Upload File" }).click();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  const fileName = path.basename(filePath);
  await expect(page.getByText(fileName)).toBeVisible();

  await page.getByRole("button", { name: "Load Job" }).click();

  await expect(page.getByRole("button", { name: /Generate Resume/i })).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Resume Tool Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hire-me");
  });

  test("should complete full flow: input → generating → results", async ({
    page,
  }) => {
    // Load job posting via paste mode
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    // Click "Generate Resume" preset chip
    await page.getByRole("button", { name: /Generate Resume/i }).click();

    // Wait for generating system message
    await expect(page.getByText(/generating your custom resume/i)).toBeVisible({ timeout: 5000 });

    // Wait for the resume preview card to appear in chat stream
    await expect(page.getByText(/summary/i).first()).toBeVisible({
      timeout: 240000, // 4 minutes for LLM generation
    });

    // Verify download button appears in the actions bar
    await expect(page.getByRole("button", { name: /custom resume/i })).toBeVisible();

    // ---- Download verification ----
    const downloadButton = page.getByRole("button", { name: /custom resume/i });
    const downloadPromise = page.waitForEvent("download");
    await downloadButton.click();
    const download = await downloadPromise;

    // Save to a temp file for verification
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-e2e-"));
    const zipPath = path.join(tmpDir, download.suggestedFilename());
    await download.saveAs(zipPath);

    // Verify ZIP contents
    verifyZipContents({
      zipPath,
      filenamePattern: /\.zip/,
      suggestedFilename: download.suggestedFilename(),
      requiredFiles: ["metadata.json", "outputs/outputs.json"],
      requiredPrefixes: ["outputs/"],
      metadataFields: ["submissionId", "tool", "createdAt", "status"],
      markdownPatterns: [
        /summary|experience|skill/i,
      ],
    });

    // Cleanup temp files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("should complete full flow via URL mode: input → generating → results", async ({
    page,
    baseURL,
  }) => {
    // Use baseURL so this works against Vercel previews too
    await loadJobViaUrl(page, `${baseURL}/hire-me`);

    await page.getByRole("button", { name: /Generate Resume/i }).click();

    await expect(page.getByText(/generating your custom resume/i)).toBeVisible({ timeout: 5000 });

    // Wait for resume preview card
    await expect(page.getByText(/summary/i).first()).toBeVisible({
      timeout: 240000,
    });

    await expect(page.getByRole("button", { name: /custom resume/i })).toBeVisible();
  });

  test("should complete full flow via file upload mode: input → generating → results", async ({
    page,
  }) => {
    const fixtureFilePath = path.join(__dirname, "fixtures", "sample-job.txt");
    await loadJobViaFile(page, fixtureFilePath);

    await page.getByRole("button", { name: /Generate Resume/i }).click();

    await expect(page.getByText(/generating your custom resume/i)).toBeVisible({ timeout: 5000 });

    // Wait for resume preview card
    await expect(page.getByText(/summary/i).first()).toBeVisible({
      timeout: 240000,
    });

    await expect(page.getByRole("button", { name: /custom resume/i })).toBeVisible();
  });

  test("should load job posting and show both preset chips", async ({ page }) => {
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    // Verify both preset chips are visible
    await expect(page.getByRole("button", { name: /Analyze My Fit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Generate Resume/i })).toBeVisible();
  });

  test("should show URL input mode when selected", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();
    await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: "Add Job" }).click();

    // Switch to URL mode
    await page.getByRole("button", { name: "Enter URL" }).click();

    // Verify URL input is visible
    await expect(page.locator('input[type="url"]')).toBeVisible();
  });

  test("should disable Load Job when input is empty", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();
    await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: "Add Job" }).click();

    // Load Job should be disabled when empty
    const loadButton = page.getByRole("button", { name: "Load Job" });
    await expect(loadButton).toBeDisabled();

    const textarea = page.locator('textarea[placeholder*="Paste the full job posting"]');
    await textarea.fill("Some job posting text");

    await expect(loadButton).toBeEnabled();

    await textarea.clear();

    await expect(loadButton).toBeDisabled();
  });

  test("should display welcome message with topic list", async ({ page }) => {
    // Verify the welcome message is displayed in the chat stream
    await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/work history and experience/i)).toBeVisible();
    await expect(page.getByText(/technical skills and projects/i)).toBeVisible();
  });
});

test.describe("Resume Tool Error Handling", () => {
  test("should handle error states gracefully", async ({ page }) => {
    await page.goto("/hire-me");

    // Load a minimal job posting
    await loadJobViaPaste(page, "x");

    // Click "Generate Resume" to trigger the flow with minimal input
    await page.getByRole("button", { name: /Generate Resume/i }).click();

    // Wait for either an error or processing
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Generating") ||
          body.includes("error") ||
          body.includes("Error") ||
          body.includes("summary")
        );
      },
      { timeout: 15000 }
    );
  });
});
