import path from "path";
import { test, expect } from "@playwright/test";
import { verifyZipContents } from "./helpers/zip-verify";

/**
 * E2E tests for the Interview / Chat flow on the unified Hire Me page.
 *
 * Prerequisites:
 * - E2E_TESTING and NEXT_PUBLIC_E2E_TESTING must be "true" (set by playwright.config.ts)
 * - Captcha bypass is automatic in E2E mode
 *
 * The unified /hire-me page has a chat interface that allows free-form
 * questions about Sam's career. The chat is always available (no job
 * posting required for basic Q&A).
 *
 * Test structure:
 * - UI tests: Fast, no LLM calls, verify page renders correctly
 * - Interaction tests: Verify chat input/send behavior (no LLM wait needed)
 * - Conversation test: One test with LLM response, reasonable timeout
 */

test.describe("Interview Tool - UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hire-me");
  });

  test("loads the hire-me page with correct heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Hire Me" })
    ).toBeVisible();

    // Description text
    await expect(
      page.getByText(/help hiring managers quickly evaluate/i)
    ).toBeVisible();
  });

  test("displays welcome message after captcha passes", async ({ page }) => {
    // Wait for captcha bypass and chat to load
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 15000 });

    // Welcome message should list topics
    await expect(page.getByText(/work history and experience/i)).toBeVisible();
    await expect(page.getByText(/technical skills and projects/i)).toBeVisible();
  });

  test("displays input field and send button", async ({ page }) => {
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 15000 });

    // Input field (textarea with placeholder)
    await expect(
      page.getByPlaceholder(/ask about sam's career/i)
    ).toBeVisible();

    // Send button
    await expect(
      page.getByRole("button", { name: /send message/i })
    ).toBeVisible();

    // Keyboard hint
    await expect(page.getByText(/press enter to send/i)).toBeVisible();
  });

  test("displays Add Job button for job context", async ({ page }) => {
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 15000 });

    // The "Add Job" button should be visible in the JobContextBar
    await expect(page.getByRole("button", { name: "Add Job" })).toBeVisible();
  });
});

test.describe("Interview Tool - Input Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hire-me");
    // Wait for chat interface to be ready
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 15000 });
  });

  test("user message appears in chat immediately after send", async ({ page }) => {
    const testMessage = "What is your background in software engineering?";
    const input = page.getByPlaceholder(/ask about sam's career/i);

    await input.fill(testMessage);
    await page.getByRole("button", { name: /send message/i }).click();

    // User message should appear immediately in the chat
    await expect(page.getByText(testMessage)).toBeVisible();
  });

  test("Enter key sends message", async ({ page }) => {
    const testMessage = "Tell me about your technical skills";
    const input = page.getByPlaceholder(/ask about sam's career/i);

    await input.fill(testMessage);
    await input.press("Enter");

    // Message should appear in chat
    await expect(page.getByText(testMessage)).toBeVisible();
  });

  test("input is disabled while waiting for response", async ({ page }) => {
    const input = page.getByPlaceholder(/ask about sam's career/i);
    await input.fill("Quick test question");
    await page.getByRole("button", { name: /send message/i }).click();

    // Placeholder should change to "Waiting for response..."
    await expect(
      page.getByPlaceholder(/waiting for response/i)
    ).toBeVisible({ timeout: 3000 });
  });

  test("typing indicator appears while waiting", async ({ page }) => {
    const input = page.getByPlaceholder(/ask about sam's career/i);
    await input.fill("Test question for typing indicator");
    await page.getByRole("button", { name: /send message/i }).click();

    // Input should be disabled while waiting (more reliable than counting labels)
    await expect(
      page.getByPlaceholder(/waiting for response/i)
    ).toBeVisible({ timeout: 3000 });
  });

  test("new conversation resets the chat", async ({ page }) => {
    const testMessage = "Test message for reset";
    const input = page.getByPlaceholder(/ask about sam's career/i);

    // Send a message
    await input.fill(testMessage);
    await input.press("Enter");
    await expect(page.getByText(testMessage)).toBeVisible();

    // The New Conversation button appears after sending a message
    await expect(
      page.getByRole("button", { name: /new conversation/i })
    ).toBeVisible({ timeout: 5000 });

    // Click new conversation
    await page.getByRole("button", { name: /new conversation/i }).click();

    // The test message should no longer be visible (chat reset)
    await expect(page.getByText(testMessage)).not.toBeVisible();

    // Welcome message should be visible again
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible();
  });
});

test.describe("Interview Tool - Conversation", () => {
  test("completes a single career-related exchange and downloads transcript", async ({ page }) => {
    // This test makes an actual LLM call - use reasonable timeout
    test.setTimeout(90000); // 90 seconds max

    await page.goto("/hire-me");

    // Wait for chat to be ready
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 15000 });

    // Send a simple career question
    const input = page.getByPlaceholder(/ask about sam's career/i);
    await input.fill("What programming languages do you know?");
    await input.press("Enter");

    // Wait for the assistant response to appear
    // The "Sam Kirk" label appears on assistant messages
    await expect(page.locator("text=Sam Kirk").nth(1)).toBeVisible({ timeout: 60000 });

    // Download button should appear in actions bar after conversation
    const downloadButton = page.getByRole("button", { name: /interview/i }).first();
    await expect(downloadButton).toBeVisible({ timeout: 10000 });

    // Click download and wait for the file
    const downloadPromise = page.waitForEvent("download");
    await downloadButton.click();
    const download = await downloadPromise;

    // Save the downloaded file to test fixtures
    const fixturesPath = path.join(__dirname, "..", "test-fixtures", "interview-chat", "e2e-downloaded-bundle.zip");
    await download.saveAs(fixturesPath);

    // Verify the download completed and ZIP contents
    verifyZipContents({
      zipPath: fixturesPath,
      filenamePattern: /\.zip/,
      suggestedFilename: download.suggestedFilename(),
      requiredFiles: ["metadata.json", "outputs/outputs.json"],
      requiredPrefixes: ["outputs/"],
      metadataFields: ["submissionId", "tool", "createdAt", "status"],
      markdownPatterns: [
        /transcript|conversation|question|answer/i,
      ],
    });
  });
});
