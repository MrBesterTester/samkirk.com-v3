import path from "path";
import fs from "fs";
import os from "os";
import AdmZip from "adm-zip";
import { test, expect, type Page, type Download } from "@playwright/test";
import { verifyZipContents } from "./helpers/zip-verify";

/**
 * E2E tests for the download buttons on the Hire Me page.
 *
 * Verifies that each download button (Fit Report, Custom Resume, Interview
 * Transcript) downloads a DISTINCT artifact bundle with:
 * - A descriptive filename (not generic "submission-{id}.zip")
 * - The correct tool type in metadata.json
 * - Tool-specific output content
 *
 * Prerequisites:
 * - GCP environment must be configured (.env.local with valid credentials)
 * - E2E_TESTING and NEXT_PUBLIC_E2E_TESTING must be "true" (set by playwright.config.ts)
 */

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
async function loadJobViaPaste(page: Page, text: string) {
  await expect(page.getByRole("heading", { name: "Interview me NOW" })).toBeVisible();
  await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
    timeout: 15000,
  });

  await page.getByRole("button", { name: "Add Job" }).click();

  const textarea = page.locator(
    'textarea[placeholder*="Paste the full job posting"]'
  );
  await expect(textarea).toBeVisible({ timeout: 5000 });
  await textarea.fill(text);

  await page.getByRole("button", { name: "Load Job" }).click();

  await expect(
    page.getByRole("button", { name: /Generate Resume/i })
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: Answer follow-up questions in the fit analysis flow.
 * Selects the first option for each question and clicks Submit Answer.
 */
async function answerFitQuestions(page: Page) {
  for (let i = 0; i < 10; i++) {
    if (i > 0) await page.waitForTimeout(500);

    const submitButton = page.getByRole("button", { name: /submit answer/i });
    const submitVisible = await submitButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!submitVisible) break;

    const hasRadios = await page
      .getByRole("radio")
      .count()
      .then((c) => c > 0)
      .catch(() => false);

    if (hasRadios) {
      await page.evaluate(() => {
        const radios = document.querySelectorAll('input[type="radio"]');
        if (radios.length > 0) {
          const label = radios[0].closest("label");
          if (label) label.click();
        }
      });
      await page.waitForTimeout(500);
    } else {
      const answerInput = page.getByPlaceholder(/type your answer/i);
      if (await answerInput.isVisible().catch(() => false)) {
        await answerInput.fill("Senior level position, fully remote");
      } else {
        break;
      }
    }

    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    const prevAnswered = await page
      .getByText("Answered", { exact: true })
      .count();

    await submitButton.evaluate((el) => (el as HTMLButtonElement).click());

    await page.waitForFunction(
      (prevCount) => {
        const body = document.body.textContent || "";
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

/**
 * Helper: Click a download button and save the resulting ZIP to a temp dir.
 * Returns the Download object and the path where the ZIP was saved.
 */
async function clickAndSaveDownload(
  page: Page,
  buttonNamePattern: RegExp
): Promise<{ download: Download; zipPath: string; tmpDir: string }> {
  const button = page.getByRole("button", { name: buttonNamePattern });
  const downloadPromise = page.waitForEvent("download");
  await button.click();
  const download = await downloadPromise;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "download-e2e-"));
  const zipPath = path.join(tmpDir, download.suggestedFilename());
  await download.saveAs(zipPath);

  return { download, zipPath, tmpDir };
}

/**
 * Helper: Extract the `tool` field from metadata.json inside a ZIP.
 */
function extractToolFromZip(zipPath: string): string {
  const zip = new AdmZip(zipPath);
  const metadataEntry = zip.getEntry("metadata.json");
  expect(metadataEntry, "ZIP should contain metadata.json").toBeTruthy();
  const metadata = JSON.parse(metadataEntry!.getData().toString("utf-8"));
  return metadata.tool;
}

/**
 * Helper: Extract the `submissionId` field from metadata.json inside a ZIP.
 */
function extractSubmissionIdFromZip(zipPath: string): string {
  const zip = new AdmZip(zipPath);
  const metadataEntry = zip.getEntry("metadata.json");
  expect(metadataEntry, "ZIP should contain metadata.json").toBeTruthy();
  const metadata = JSON.parse(metadataEntry!.getData().toString("utf-8"));
  return metadata.submissionId;
}

test.describe("Download Buttons - Distinct Reports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hire-me");
  });

  /**
   * Core regression test: Run both Fit and Resume tools, then verify that
   * each download button produces a DISTINCT file with:
   *  1. Different filename (not the same generic name)
   *  2. Different tool type in metadata.json
   *  3. Different submissionId in metadata.json
   *  4. Tool-appropriate content in the outputs
   */
  test("fit and resume downloads should be distinct files", async ({
    page,
  }) => {
    // ---- Phase 1: Load job and run Fit Analysis ----
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    await page.getByRole("button", { name: /Analyze My Fit/i }).click();
    await expect(page.getByText(/starting fit analysis/i)).toBeVisible({
      timeout: 5000,
    });

    // Handle follow-up questions
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
    await answerFitQuestions(page);

    // Wait for fit report
    await expect(
      page.getByRole("heading", { name: "Fit Report" })
    ).toBeVisible({ timeout: 240000 });

    // Verify Fit Report download button appears
    const fitDownloadButton = page.getByRole("button", {
      name: /fit report/i,
    });
    await expect(fitDownloadButton).toBeVisible();

    // ---- Phase 2: Run Resume Generation ----
    await page.getByRole("button", { name: /Generate Resume/i }).click();
    await expect(
      page.getByText(/generating your custom resume/i)
    ).toBeVisible({ timeout: 5000 });

    // Wait for Custom Resume download button (resume generation can take a while)
    const resumeDownloadButton = page.getByRole("button", {
      name: /custom resume/i,
    });
    await expect(resumeDownloadButton).toBeVisible({ timeout: 240000 });

    // ---- Phase 3: Download both and compare ----

    // Download fit report
    const fit = await clickAndSaveDownload(page, /fit report/i);

    // Download resume
    const resume = await clickAndSaveDownload(page, /custom resume/i);

    try {
      // Assertion 1: Filenames should be DIFFERENT
      expect(
        fit.download.suggestedFilename(),
        "Fit and Resume downloads should have different filenames"
      ).not.toEqual(resume.download.suggestedFilename());

      // Assertion 2: Filenames should NOT start with "submission-"
      expect(
        fit.download.suggestedFilename(),
        "Fit download filename should be descriptive, not generic"
      ).not.toMatch(/^submission-/);
      expect(
        resume.download.suggestedFilename(),
        "Resume download filename should be descriptive, not generic"
      ).not.toMatch(/^submission-/);

      // Assertion 3: Filenames should contain tool-specific identifiers
      expect(
        fit.download.suggestedFilename().toLowerCase(),
        "Fit download filename should indicate it's a fit report"
      ).toContain("fit");
      expect(
        resume.download.suggestedFilename().toLowerCase(),
        "Resume download filename should indicate it's a resume"
      ).toContain("resume");

      // Assertion 4: Each ZIP should have correct tool in metadata.json
      const fitTool = extractToolFromZip(fit.zipPath);
      const resumeTool = extractToolFromZip(resume.zipPath);
      expect(fitTool, "Fit report metadata should have tool=fit").toBe("fit");
      expect(resumeTool, "Resume metadata should have tool=resume").toBe(
        "resume"
      );

      // Assertion 5: Each ZIP should have a DIFFERENT submissionId
      const fitSubmissionId = extractSubmissionIdFromZip(fit.zipPath);
      const resumeSubmissionId = extractSubmissionIdFromZip(resume.zipPath);
      expect(
        fitSubmissionId,
        "Fit and Resume should have different submissionIds"
      ).not.toEqual(resumeSubmissionId);

      // Assertion 6: Verify each ZIP has valid structure
      verifyZipContents({
        zipPath: fit.zipPath,
        filenamePattern: /fit.*\.zip/i,
        suggestedFilename: fit.download.suggestedFilename(),
        requiredFiles: ["metadata.json", "outputs/outputs.json"],
        requiredPrefixes: ["outputs/"],
        metadataFields: ["submissionId", "tool", "createdAt", "status"],
        markdownPatterns: [/score|fit|recommendation/i],
      });

      verifyZipContents({
        zipPath: resume.zipPath,
        filenamePattern: /resume.*\.zip/i,
        suggestedFilename: resume.download.suggestedFilename(),
        requiredFiles: ["metadata.json", "outputs/outputs.json"],
        requiredPrefixes: ["outputs/"],
        metadataFields: ["submissionId", "tool", "createdAt", "status"],
        markdownPatterns: [/summary|experience|skill/i],
      });
    } finally {
      // Cleanup temp files
      fs.rmSync(fit.tmpDir, { recursive: true, force: true });
      fs.rmSync(resume.tmpDir, { recursive: true, force: true });
    }
  });

  /**
   * Verify that a single fit download has descriptive filename and correct metadata.
   */
  test("fit download should have descriptive filename", async ({ page }) => {
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    await page.getByRole("button", { name: /Analyze My Fit/i }).click();
    await expect(page.getByText(/starting fit analysis/i)).toBeVisible({
      timeout: 5000,
    });

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
    await answerFitQuestions(page);

    await expect(
      page.getByRole("heading", { name: "Fit Report" })
    ).toBeVisible({ timeout: 240000 });

    const { download, zipPath, tmpDir } = await clickAndSaveDownload(
      page,
      /fit report/i
    );

    try {
      // Filename should NOT be generic "submission-..."
      expect(
        download.suggestedFilename(),
        "Filename should not be generic submission-{id}.zip"
      ).not.toMatch(/^submission-/);

      // Filename should contain "fit"
      expect(download.suggestedFilename().toLowerCase()).toContain("fit");

      // Metadata should say tool=fit
      const tool = extractToolFromZip(zipPath);
      expect(tool).toBe("fit");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  /**
   * Verify that a single resume download has descriptive filename and correct metadata.
   */
  test("resume download should have descriptive filename", async ({ page }) => {
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    await page.getByRole("button", { name: /Generate Resume/i }).click();
    await expect(
      page.getByText(/generating your custom resume/i)
    ).toBeVisible({ timeout: 5000 });

    // Wait for Custom Resume download button (resume generation can take a while)
    await expect(
      page.getByRole("button", { name: /custom resume/i })
    ).toBeVisible({ timeout: 240000 });

    const { download, zipPath, tmpDir } = await clickAndSaveDownload(
      page,
      /custom resume/i
    );

    try {
      // Filename should NOT be generic "submission-..."
      expect(
        download.suggestedFilename(),
        "Filename should not be generic submission-{id}.zip"
      ).not.toMatch(/^submission-/);

      // Filename should contain "resume"
      expect(download.suggestedFilename().toLowerCase()).toContain("resume");

      // Metadata should say tool=resume
      const tool = extractToolFromZip(zipPath);
      expect(tool).toBe("resume");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  /**
   * Verify that an interview download has descriptive filename containing
   * "transcript" and correct metadata.
   */
  test("interview download should have descriptive filename with transcript", async ({
    page,
  }) => {
    // Interview doesn't require a job posting — just send a chat message
    await expect(page.getByText(/I'm here to answer questions/i)).toBeVisible({
      timeout: 15000,
    });

    const input = page.getByPlaceholder(/ask about sam's career/i);
    await input.fill("What programming languages do you know?");
    await input.press("Enter");

    // Wait for assistant response to complete (input re-enables)
    await expect(input).toBeEnabled({ timeout: 60000 });

    // Interview Summary download button should appear
    const downloadButton = page
      .getByRole("button", { name: /interview/i })
      .first();
    await expect(downloadButton).toBeVisible({ timeout: 10000 });

    const { download, zipPath, tmpDir } = await clickAndSaveDownload(
      page,
      /interview/i
    );

    try {
      // Filename should NOT be generic "submission-..."
      expect(
        download.suggestedFilename(),
        "Filename should not be generic submission-{id}.zip"
      ).not.toMatch(/^submission-/);

      // Filename should contain "transcript"
      expect(
        download.suggestedFilename().toLowerCase(),
        "Interview download filename should contain 'transcript'"
      ).toContain("transcript");

      // Metadata should say tool=interview
      const tool = extractToolFromZip(zipPath);
      expect(tool).toBe("interview");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  /**
   * Full regression: Run all three tools and verify all downloads are distinct.
   * This is the most comprehensive test — runs fit, resume, and interview,
   * then downloads all three and compares filenames, submissionIds, and content.
   */
  test("all three downloads should be distinct with correct filenames", async ({
    page,
  }) => {
    // ---- Phase 1: Load job and run Fit Analysis ----
    await loadJobViaPaste(page, SAMPLE_JOB_POSTING);

    await page.getByRole("button", { name: /Analyze My Fit/i }).click();
    await expect(page.getByText(/starting fit analysis/i)).toBeVisible({
      timeout: 5000,
    });

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
    await answerFitQuestions(page);

    await expect(
      page.getByRole("heading", { name: "Fit Report" })
    ).toBeVisible({ timeout: 240000 });
    await expect(
      page.getByRole("button", { name: /fit report/i })
    ).toBeVisible();

    // ---- Phase 2: Run Resume Generation ----
    await page.getByRole("button", { name: /Generate Resume/i }).click();
    await expect(
      page.getByText(/generating your custom resume/i)
    ).toBeVisible({ timeout: 5000 });

    // Wait for Custom Resume download button (resume generation can take a while)
    await expect(
      page.getByRole("button", { name: /custom resume/i })
    ).toBeVisible({ timeout: 240000 });

    // ---- Phase 3: Send a chat message to trigger Interview transcript ----
    const input = page.getByPlaceholder(/ask about sam's career/i);
    await input.fill("Tell me about your experience with TypeScript");
    await input.press("Enter");

    // Wait for assistant response to complete (input re-enables)
    await expect(input).toBeEnabled({ timeout: 60000 });
    await expect(
      page.getByRole("button", { name: /interview/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // ---- Phase 4: Download all three and compare ----
    const fit = await clickAndSaveDownload(page, /fit report/i);
    const resume = await clickAndSaveDownload(page, /custom resume/i);
    const transcript = await clickAndSaveDownload(page, /interview/i);

    try {
      const fitFilename = fit.download.suggestedFilename();
      const resumeFilename = resume.download.suggestedFilename();
      const transcriptFilename = transcript.download.suggestedFilename();

      // All filenames should be different from each other
      expect(fitFilename, "All filenames should differ").not.toEqual(
        resumeFilename
      );
      expect(fitFilename, "All filenames should differ").not.toEqual(
        transcriptFilename
      );
      expect(resumeFilename, "All filenames should differ").not.toEqual(
        transcriptFilename
      );

      // No filename should be generic "submission-..."
      for (const name of [fitFilename, resumeFilename, transcriptFilename]) {
        expect(name, `${name} should not be generic`).not.toMatch(
          /^submission-/
        );
      }

      // Each filename should contain its tool-specific keyword
      expect(fitFilename.toLowerCase()).toContain("fit");
      expect(resumeFilename.toLowerCase()).toContain("resume");
      expect(
        transcriptFilename.toLowerCase(),
        "Interview filename should contain 'transcript'"
      ).toContain("transcript");

      // Each ZIP should have the correct tool in metadata
      expect(extractToolFromZip(fit.zipPath)).toBe("fit");
      expect(extractToolFromZip(resume.zipPath)).toBe("resume");
      expect(extractToolFromZip(transcript.zipPath)).toBe("interview");

      // All three submissionIds should be different
      const ids = [
        extractSubmissionIdFromZip(fit.zipPath),
        extractSubmissionIdFromZip(resume.zipPath),
        extractSubmissionIdFromZip(transcript.zipPath),
      ];
      expect(new Set(ids).size, "All submissionIds should be unique").toBe(3);
    } finally {
      fs.rmSync(fit.tmpDir, { recursive: true, force: true });
      fs.rmSync(resume.tmpDir, { recursive: true, force: true });
      fs.rmSync(transcript.tmpDir, { recursive: true, force: true });
    }
  });
});
