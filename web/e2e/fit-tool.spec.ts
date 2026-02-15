import path from "path";
import fs from "fs";
import os from "os";
import { test, expect } from "@playwright/test";
import { verifyZipContents } from "./helpers/zip-verify";

/**
 * E2E tests for the Fit Analysis flow on the unified Hire Me page.
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
 * 4. Click "Analyze My Fit" preset chip
 * 5. Answer follow-up questions in chat
 * 6. View fit report in chat stream
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
 * Waits for the ToolGate captcha to pass, expands the job bar,
 * enters text, and clicks Load Job.
 */
async function loadJobViaPaste(page: import("@playwright/test").Page, text: string) {
  // Wait for the page heading
  await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();

  // Wait for ToolGate to finish (captcha auto-passes in E2E mode)
  // The chat area should become visible (welcome message)
  await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
    timeout: 15000,
  });

  // Click "Add Job" to expand the JobContextBar
  await page.getByRole("button", { name: "Add Job" }).click();

  // The paste textarea should now be visible
  const textarea = page.locator('textarea[placeholder*="Paste the full job posting"]');
  await expect(textarea).toBeVisible({ timeout: 5000 });

  // Enter the job posting text
  await textarea.fill(text);

  // Click "Load Job" button
  await page.getByRole("button", { name: "Load Job" }).click();

  // Wait for the "Analyze My Fit" preset chip to appear (indicates job is loaded)
  await expect(page.getByRole("button", { name: /Analyze My Fit/i })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Helper: Load a job posting via URL mode.
 */
async function loadJobViaUrl(page: import("@playwright/test").Page, url: string) {
  // Wait for the page heading
  await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();

  // Wait for ToolGate captcha to pass
  await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
    timeout: 15000,
  });

  // Click "Add Job" to expand the JobContextBar
  await page.getByRole("button", { name: "Add Job" }).click();

  // Switch to URL mode tab
  await page.getByRole("button", { name: "Enter URL" }).click();

  // Enter the URL
  const urlInput = page.locator('input[type="url"]');
  await expect(urlInput).toBeVisible();
  await urlInput.fill(url);

  // Click "Load Job" button
  await page.getByRole("button", { name: "Load Job" }).click();

  // Wait for the preset chips to appear
  await expect(page.getByRole("button", { name: /Analyze My Fit/i })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Helper: Load a job posting via file upload mode.
 */
async function loadJobViaFile(page: import("@playwright/test").Page, filePath: string) {
  // Wait for the page heading
  await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();

  // Wait for ToolGate captcha to pass
  await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
    timeout: 15000,
  });

  // Click "Add Job" to expand the JobContextBar
  await page.getByRole("button", { name: "Add Job" }).click();

  // Switch to file upload mode tab
  await page.getByRole("button", { name: "Upload File" }).click();

  // Upload the file via the hidden file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Verify the filename is displayed
  const fileName = path.basename(filePath);
  await expect(page.getByText(fileName)).toBeVisible();

  // Click "Load Job" button
  await page.getByRole("button", { name: "Load Job" }).click();

  // Wait for the preset chips to appear
  await expect(page.getByRole("button", { name: /Analyze My Fit/i })).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Helper: Answer follow-up questions in the fit analysis flow.
 *
 * The FitQuestionCard renders radio inputs with className="sr-only" inside <label>
 * elements. Playwright's .check({ force: true }) on the radio input reliably
 * triggers the React onChange handler even when the input is visually hidden.
 * We scope our search to the LAST question card (the active one) to avoid
 * interacting with already-answered questions.
 */
async function answerFitQuestions(page: import("@playwright/test").Page) {
  for (let i = 0; i < 10; i++) {
    // Brief pause to let React finish rendering any new question card
    if (i > 0) {
      await page.waitForTimeout(500);
    }

    // Check for a Submit Answer button (enabled or disabled — means there's an active question)
    const submitButton = page.getByRole("button", { name: /submit answer/i });
    const submitVisible = await submitButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!submitVisible) {
      break; // No active question — we're past the question phase
    }

    // Select an answer. The FitQuestionCard renders options as:
    //   <label class="flex cursor-pointer ...">
    //     <div><!-- visual radio circle --></div>
    //     <span>Option text</span>
    //     <input type="radio" class="sr-only" onChange={...} />
    //   </label>
    // Answered questions render as read-only (no labels/radios).
    //
    // Strategy: Use page.evaluate() to find the first radio input's parent label
    // and trigger a click that properly flows through React's event system.
    const hasRadios = await page.getByRole("radio").count().then(c => c > 0).catch(() => false);

    if (hasRadios) {
      // Use evaluate to click the label element wrapping the first radio input.
      // This approach works because the native click on the label element triggers
      // the browser's built-in label-input association, which fires the radio's
      // change event through React's event delegation system.
      await page.evaluate(() => {
        const radios = document.querySelectorAll('input[type="radio"]');
        if (radios.length > 0) {
          const label = radios[0].closest("label");
          if (label) {
            label.click();
          }
        }
      });
      // Wait for React state to propagate (submit button should become enabled)
      await page.waitForTimeout(500);
    } else {
      // Fallback: check for a free-text input
      const answerInput = page.getByPlaceholder(/type your answer/i);
      if (await answerInput.isVisible().catch(() => false)) {
        await answerInput.fill("Senior level position, fully remote");
      } else {
        break;
      }
    }

    // Submit the answer — wait for the button to become enabled after selection
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Capture current "Answered" badge count BEFORE clicking Submit,
    // so we can detect when the count increases after the answer is accepted.
    const prevAnswered = await page.getByText("Answered", { exact: true }).count();

    // Use evaluate to click the submit button, bypassing Playwright's pointer-events
    // interception check. The Submit Answer button can be obscured by the fixed-position
    // chat input bar at the bottom of the page on smaller viewports.
    await submitButton.evaluate((el) => (el as HTMLButtonElement).click());

    // Wait for the answer to be accepted. After clicking Submit Answer, the question
    // card transitions to read-only ("Answered" badge). Then either:
    // - A new question card appears (with its own Submit Answer button, initially disabled)
    // - The report generation starts ("Generating your fit report")
    // - The report appears ("Fit Report")
    // We detect transition by counting "Answered" badges increasing.
    await page.waitForFunction(
      (prevCount) => {
        const body = document.body.textContent || "";
        // Count leaf "Answered" text nodes (badges on answered question cards)
        const spans = document.querySelectorAll("span");
        let answeredCount = 0;
        spans.forEach((s) => {
          if (s.textContent?.trim() === "Answered") answeredCount++;
        });
        return (
          answeredCount > prevCount ||
          body.includes("Generating your fit report") ||
          body.includes("Fit Report")
        );
      },
      prevAnswered,
      { timeout: 30000 }
    );
  }
}

test.describe("Fit Tool Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the unified Hire Me page
    await page.goto("/hire-me");
  });

  test("should complete full flow: input → follow-ups → results", async ({
    page,
  }) => {
    // Load job posting via paste mode
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    // Click "Analyze My Fit" preset chip to start fit flow
    await page.getByRole("button", { name: /Analyze My Fit/i }).click();

    // Wait for processing — system message should appear
    await expect(page.getByText(/starting fit analysis/i)).toBeVisible({ timeout: 5000 });

    // Wait for either:
    // 1. Follow-up question card to appear
    // 2. Fit report to appear (if no questions needed)
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Question") ||
          body.includes("Generating your fit report") ||
          body.includes("Overall") ||
          body.includes("Recommendation")
        );
      },
      { timeout: 30000 }
    );

    // Handle follow-up questions in a loop
    await answerFitQuestions(page);

    // Wait for the fit report card to appear in the chat stream
    // The FitReportCard heading says "Fit Report" and shows a score badge
    await expect(page.getByRole("heading", { name: "Fit Report" })).toBeVisible({
      timeout: 240000, // 4 minutes for LLM generation
    });

    // Verify key elements of the fit report card
    await expect(page.getByText(/recommendation/i).first()).toBeVisible();

    // Verify download button appears in the actions bar
    await expect(page.getByRole("button", { name: /fit report/i })).toBeVisible();

    // ---- Download verification ----
    const downloadButton = page.getByRole("button", { name: /fit report/i });
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
      filenamePattern: /\.zip/,
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
    // Load job via URL mode
    await loadJobViaUrl(page, "http://localhost:3000/hire-me");

    // Click "Analyze My Fit" preset chip
    await page.getByRole("button", { name: /Analyze My Fit/i }).click();

    // Wait for processing
    await expect(page.getByText(/starting fit analysis/i)).toBeVisible({ timeout: 5000 });

    // Wait for question or report
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Question") ||
          body.includes("Generating your fit report") ||
          body.includes("Overall") ||
          body.includes("Recommendation")
        );
      },
      { timeout: 30000 }
    );

    // Handle follow-up questions
    await answerFitQuestions(page);

    // Wait for fit report card
    await expect(page.getByRole("heading", { name: "Fit Report" })).toBeVisible({
      timeout: 240000,
    });
    await expect(page.getByText(/recommendation/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /fit report/i })).toBeVisible();
  });

  test("should complete full flow via file upload mode: input → follow-ups → results", async ({
    page,
  }) => {
    // Load job via file upload
    const fixtureFilePath = path.join(__dirname, "fixtures", "sample-job.txt");
    await loadJobViaFile(page, fixtureFilePath);

    // Click "Analyze My Fit" preset chip
    await page.getByRole("button", { name: /Analyze My Fit/i }).click();

    // Wait for processing
    await expect(page.getByText(/starting fit analysis/i)).toBeVisible({ timeout: 5000 });

    // Wait for question or report
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Question") ||
          body.includes("Generating your fit report") ||
          body.includes("Overall") ||
          body.includes("Recommendation")
        );
      },
      { timeout: 30000 }
    );

    // Handle follow-up questions
    await answerFitQuestions(page);

    // Wait for fit report card
    await expect(page.getByRole("heading", { name: "Fit Report" })).toBeVisible({
      timeout: 240000,
    });
    await expect(page.getByText(/recommendation/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /fit report/i })).toBeVisible();
  });

  test("should load job posting and show preset chips", async ({ page }) => {
    // Load a job posting
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    // Verify both preset chips are visible
    await expect(page.getByRole("button", { name: /Analyze My Fit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Generate Resume/i })).toBeVisible();
  });

  test("should show all three input modes in job bar", async ({ page }) => {
    // Wait for page
    await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();
    await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
      timeout: 15000,
    });

    // Click "Add Job" to expand
    await page.getByRole("button", { name: "Add Job" }).click();

    // Verify all three mode tabs are visible
    await expect(page.getByRole("button", { name: "Paste Text" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enter URL" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload File" })).toBeVisible();
  });

  test("should show URL input when URL mode selected", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();
    await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
      timeout: 15000,
    });

    // Expand job bar
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

    // Expand job bar
    await page.getByRole("button", { name: "Add Job" }).click();

    // The Load Job button should be disabled when textarea is empty
    const loadButton = page.getByRole("button", { name: "Load Job" });
    await expect(loadButton).toBeDisabled();

    // Enter some text
    const textarea = page.locator('textarea[placeholder*="Paste the full job posting"]');
    await textarea.fill("Some job posting text");

    // Now the button should be enabled
    await expect(loadButton).toBeEnabled();

    // Clear the text
    await textarea.clear();

    // Button should be disabled again
    await expect(loadButton).toBeDisabled();
  });
});

test.describe("Fit Tool Error Handling", () => {
  test("should handle error states gracefully", async ({ page }) => {
    await page.goto("/hire-me");

    // Load a minimal job posting
    await loadJobViaPaste(page, "x");

    // Click "Analyze My Fit" to trigger the flow with minimal input
    await page.getByRole("button", { name: /Analyze My Fit/i }).click();

    // Wait for either an error message or processing to start
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || "";
        return (
          body.includes("Starting fit analysis") ||
          body.includes("error") ||
          body.includes("Error") ||
          body.includes("Question") ||
          body.includes("Overall")
        );
      },
      { timeout: 15000 }
    );
  });
});
