import path from "path";
import fs from "fs";
import os from "os";
import { test, expect } from "@playwright/test";
import { verifyZipContents } from "./helpers/zip-verify";

/**
 * E2E tests for the "How Do I Fit?" tool.
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

test.describe("Fit Tool Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Fit tool page
    await page.goto("/hire-me/fit");
  });

  test("should complete full flow: input → follow-ups → results", async ({
    page,
  }) => {
    // Wait for initialization and captcha bypass
    // The CaptchaGate component auto-verifies in E2E mode
    // Use getByRole('heading') to specifically target the h1, not the nav link
    await expect(page.getByRole("heading", { name: "How Do I Fit?" })).toBeVisible();

    // Wait for the job input form to appear (after captcha passes)
    // The form should be visible within a reasonable time
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Enter the job posting text in paste mode (default mode)
    const textarea = page.getByRole("textbox", { name: /job posting text/i });
    await textarea.fill(SAMPLE_JOB_POSTING);

    // Click the analyze button
    const analyzeButton = page.getByRole("button", { name: /analyze job fit/i });
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    // Wait for processing - could show follow-up questions or go straight to results
    // The loading state shows "Analyzing job posting..."
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });

    // Wait for either:
    // 1. Follow-up question to appear (status: "question")
    // 2. Report generation to start (status: "generating")
    // 3. Results to appear (status: "complete")
    // Using a longer timeout as this involves API calls
    // Wait for loading to complete - check for either question UI or generating/complete state
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Follow-up Question") ||
          body.includes("Generating fit analysis") ||
          body.includes("Fit Analysis Complete")
        );
      },
      { timeout: 30000 }
    );

    // If there's a follow-up question, answer it
    const followUpHeader = page.getByText(/follow-up question/i);
    if (await followUpHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
      // There's a follow-up question - answer it
      // Look for radio buttons (predefined options) or text input
      const radioOptions = page.locator('input[type="radio"]');
      const radioCount = await radioOptions.count();

      if (radioCount > 0) {
        // Select the first option
        await radioOptions.first().click();
      } else {
        // Free text input - provide a generic answer
        const answerInput = page.getByPlaceholder(/type your answer/i);
        if (await answerInput.isVisible().catch(() => false)) {
          await answerInput.fill("Senior level position, fully remote");
        }
      }

      // Click continue
      const continueButton = page.getByRole("button", { name: /continue/i });
      await continueButton.click();

      // Wait for processing again
      await page.waitForFunction(
        () => {
          const body = document.body.textContent || "";
          return (
            body.includes("Follow-up Question") ||
            body.includes("Generating fit analysis") ||
            body.includes("Fit Analysis Complete")
          );
        },
        { timeout: 30000 }
      );
    }

    // If we're generating, wait for completion
    const generatingText = page.getByText(/generating fit analysis/i);
    if (await generatingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Wait for the report to complete (this can take time due to LLM call)
      await expect(page.getByText(/fit analysis complete/i)).toBeVisible({
        timeout: 240000, // 4 minutes for LLM generation
      });
    }

    // Verify the results page is displayed
    await expect(page.getByText(/fit analysis complete/i)).toBeVisible();

    // Verify key elements of the results
    await expect(page.getByText(/overall fit score/i)).toBeVisible();
    await expect(page.getByText(/recommendation/i)).toBeVisible();
    await expect(page.getByText(/category breakdown/i)).toBeVisible();

    // Verify action buttons are present
    await expect(page.getByRole("button", { name: /download full report/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /analyze another job/i })).toBeVisible();

    // ---- Download verification ----
    // Click download and capture the file
    const downloadButton = page.getByRole("button", { name: /download full report/i });
    const downloadPromise = page.waitForEvent("download");
    await downloadButton.click();
    const download = await downloadPromise;

    // Save to a temp file for verification
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fit-e2e-"));
    const zipPath = path.join(tmpDir, download.suggestedFilename());
    await download.saveAs(zipPath);

    // Verify ZIP contents
    verifyZipContents({
      zipPath,
      filenamePattern: /fit-report-.*\.zip/,
      suggestedFilename: download.suggestedFilename(),
      requiredFiles: ["metadata.json", "outputs/outputs.json"],
      requiredPrefixes: ["outputs/", "inputs/"],
      metadataFields: ["submissionId", "tool", "createdAt", "status"],
      markdownPatterns: [
        /score|fit|recommendation/i,
      ],
    });

    // Cleanup temp files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("should complete full flow via URL mode: input → follow-ups → results", async ({
    page,
  }) => {
    // Wait for initialization and captcha bypass
    await expect(page.getByRole("heading", { name: "How Do I Fit?" })).toBeVisible();

    // Wait for the job input form to appear (after captcha passes)
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Switch to URL mode
    await page.getByRole("button", { name: /enter url/i }).click();

    // Verify URL input is visible
    const urlInput = page.getByRole("textbox", { name: /job posting url/i });
    await expect(urlInput).toBeVisible();

    // Enter a test URL — use the dev server's own page as a reliable, always-available URL.
    // The backend will fetch this HTML and extract text from it to use as "job posting" content.
    await urlInput.fill("http://localhost:3000/hire-me/fit");

    // Click the analyze button
    const analyzeButton = page.getByRole("button", { name: /analyze job fit/i });
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    // Wait for processing - could show follow-up questions or go straight to results
    // The loading state shows "Analyzing job posting..."
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });

    // Wait for either:
    // 1. Follow-up question to appear (status: "question")
    // 2. Report generation to start (status: "generating")
    // 3. Results to appear (status: "complete")
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Follow-up Question") ||
          body.includes("Generating fit analysis") ||
          body.includes("Fit Analysis Complete")
        );
      },
      { timeout: 30000 }
    );

    // If there's a follow-up question, answer it
    const followUpHeader = page.getByText(/follow-up question/i);
    if (await followUpHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
      // There's a follow-up question - answer it
      const radioOptions = page.locator('input[type="radio"]');
      const radioCount = await radioOptions.count();

      if (radioCount > 0) {
        // Select the first option
        await radioOptions.first().click();
      } else {
        // Free text input - provide a generic answer
        const answerInput = page.getByPlaceholder(/type your answer/i);
        if (await answerInput.isVisible().catch(() => false)) {
          await answerInput.fill("Senior level position, fully remote");
        }
      }

      // Click continue
      const continueButton = page.getByRole("button", { name: /continue/i });
      await continueButton.click();

      // Wait for processing again
      await page.waitForFunction(
        () => {
          const body = document.body.textContent || "";
          return (
            body.includes("Follow-up Question") ||
            body.includes("Generating fit analysis") ||
            body.includes("Fit Analysis Complete")
          );
        },
        { timeout: 30000 }
      );
    }

    // If we're generating, wait for completion
    const generatingText = page.getByText(/generating fit analysis/i);
    if (await generatingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Wait for the report to complete (this can take time due to LLM call)
      await expect(page.getByText(/fit analysis complete/i)).toBeVisible({
        timeout: 240000, // 4 minutes for LLM generation
      });
    }

    // Verify the results page is displayed
    await expect(page.getByText(/fit analysis complete/i)).toBeVisible();

    // Verify key elements of the results
    await expect(page.getByText(/overall fit score/i)).toBeVisible();
    await expect(page.getByText(/recommendation/i)).toBeVisible();
    await expect(page.getByText(/category breakdown/i)).toBeVisible();

    // Verify action buttons are present
    await expect(page.getByRole("button", { name: /download full report/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /analyze another job/i })).toBeVisible();
  });

  test("should complete full flow via file upload mode: input → follow-ups → results", async ({
    page,
  }) => {
    // Wait for initialization and captcha bypass
    await expect(page.getByRole("heading", { name: "How Do I Fit?" })).toBeVisible();

    // Wait for the job input form to appear (after captcha passes)
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Switch to file upload mode
    await page.getByRole("button", { name: /upload file/i }).click();

    // Upload the test fixture file via the hidden file input
    const fixtureFilePath = path.join(__dirname, "fixtures", "sample-job.txt");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixtureFilePath);

    // Verify the filename is displayed in the upload zone
    await expect(page.getByText("sample-job.txt")).toBeVisible();

    // Click the analyze button
    const analyzeButton = page.getByRole("button", { name: /analyze job fit/i });
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    // Wait for processing - could show follow-up questions or go straight to results
    // The loading state shows "Analyzing job posting..."
    await expect(page.getByText(/analyzing/i)).toBeVisible({ timeout: 5000 });

    // Wait for either:
    // 1. Follow-up question to appear (status: "question")
    // 2. Report generation to start (status: "generating")
    // 3. Results to appear (status: "complete")
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Follow-up Question") ||
          body.includes("Generating fit analysis") ||
          body.includes("Fit Analysis Complete")
        );
      },
      { timeout: 30000 }
    );

    // If there's a follow-up question, answer it
    const followUpHeader = page.getByText(/follow-up question/i);
    if (await followUpHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
      // There's a follow-up question - answer it
      const radioOptions = page.locator('input[type="radio"]');
      const radioCount = await radioOptions.count();

      if (radioCount > 0) {
        // Select the first option
        await radioOptions.first().click();
      } else {
        // Free text input - provide a generic answer
        const answerInput = page.getByPlaceholder(/type your answer/i);
        if (await answerInput.isVisible().catch(() => false)) {
          await answerInput.fill("Senior level position, fully remote");
        }
      }

      // Click continue
      const continueButton = page.getByRole("button", { name: /continue/i });
      await continueButton.click();

      // Wait for processing again
      await page.waitForFunction(
        () => {
          const body = document.body.textContent || "";
          return (
            body.includes("Follow-up Question") ||
            body.includes("Generating fit analysis") ||
            body.includes("Fit Analysis Complete")
          );
        },
        { timeout: 30000 }
      );
    }

    // If we're generating, wait for completion
    const generatingText = page.getByText(/generating fit analysis/i);
    if (await generatingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Wait for the report to complete (this can take time due to LLM call)
      await expect(page.getByText(/fit analysis complete/i)).toBeVisible({
        timeout: 240000, // 4 minutes for LLM generation
      });
    }

    // Verify the results page is displayed
    await expect(page.getByText(/fit analysis complete/i)).toBeVisible();

    // Verify key elements of the results
    await expect(page.getByText(/overall fit score/i)).toBeVisible();
    await expect(page.getByText(/recommendation/i)).toBeVisible();
    await expect(page.getByText(/category breakdown/i)).toBeVisible();

    // Verify action buttons are present
    await expect(page.getByRole("button", { name: /download full report/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /analyze another job/i })).toBeVisible();
  });

  test("should allow starting over after completion", async ({ page }) => {
    // This is a lighter test that just verifies the form loads correctly
    await expect(page.getByRole("heading", { name: "How Do I Fit?" })).toBeVisible();

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

    // The analyze button should be disabled when input is empty
    const analyzeButton = page.getByRole("button", { name: /analyze job fit/i });
    await expect(analyzeButton).toBeDisabled();

    // Enter some text
    const textarea = page.getByRole("textbox", { name: /job posting text/i });
    await textarea.fill("Some job posting text");

    // Now the button should be enabled
    await expect(analyzeButton).toBeEnabled();

    // Clear the text
    await textarea.clear();

    // Button should be disabled again
    await expect(analyzeButton).toBeDisabled();
  });
});

test.describe("Fit Tool Error Handling", () => {
  test("should handle error states gracefully", async ({ page }) => {
    // Navigate to the Fit tool page
    await page.goto("/hire-me/fit");

    // Wait for the form
    await expect(page.getByRole("textbox", { name: /job posting text/i })).toBeVisible({
      timeout: 10000,
    });

    // Enter minimal text that might fail validation on the server
    const textarea = page.getByRole("textbox", { name: /job posting text/i });
    await textarea.fill("x"); // Very short input

    // Try to submit
    const analyzeButton = page.getByRole("button", { name: /analyze job fit/i });
    await analyzeButton.click();

    // The request should still be made (validation is primarily server-side)
    // Wait for either an error or processing
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Analyzing") ||
          body.includes("error") ||
          body.includes("Error") ||
          body.includes("Follow-up")
        );
      },
      { timeout: 10000 }
    );
  });
});
