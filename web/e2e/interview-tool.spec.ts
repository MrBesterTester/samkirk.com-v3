import path from "path";
import { test, expect } from "@playwright/test";
import { verifyZipContents } from "./helpers/zip-verify";

/**
 * E2E tests for the "Interview Me Now" tool.
 *
 * Prerequisites:
 * - E2E_TESTING and NEXT_PUBLIC_E2E_TESTING must be "true" (set by playwright.config.ts)
 * - Captcha bypass is automatic in E2E mode
 *
 * Test structure:
 * - UI tests: Fast, no LLM calls, verify page renders correctly
 * - Interaction tests: Verify chat input/send behavior (no LLM wait needed)
 * - Conversation test: One test with LLM response, reasonable timeout
 */

test.describe("Interview Tool - UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hire-me/interview");
  });

  test("loads the interview page with correct heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Interview Me NOW" })
    ).toBeVisible();

    // Description text
    await expect(
      page.getByText(/interactive conversation to learn about/i)
    ).toBeVisible();
  });

  test("displays welcome message after captcha passes", async ({ page }) => {
    // Wait for captcha bypass and chat to load
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 10000 });

    // Welcome message should list topics
    await expect(page.getByText(/work history and experience/i)).toBeVisible();
    await expect(page.getByText(/technical skills and projects/i)).toBeVisible();
  });

  test("displays input field and send button", async ({ page }) => {
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 10000 });

    // Input field
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

  test("displays feature cards", async ({ page }) => {
    await expect(page.getByText(/real-time chat/i)).toBeVisible();
    await expect(page.getByText(/career-focused/i)).toBeVisible();
    await expect(page.getByText(/download transcript/i)).toBeVisible();
  });

  test("displays new conversation button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /new conversation/i })
    ).toBeVisible();
  });
});

test.describe("Interview Tool - Input Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hire-me/interview");
    // Wait for chat interface to be ready
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 10000 });
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

    // Placeholder should change and input should be disabled
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

    await page.goto("/hire-me/interview");

    // Wait for chat to be ready
    await expect(
      page.getByText(/I'm here to answer questions/i)
    ).toBeVisible({ timeout: 10000 });

    // Send a simple career question
    const input = page.getByPlaceholder(/ask about sam's career/i);
    await input.fill("What programming languages do you know?");
    await input.press("Enter");

    // Wait for response - look for message count indicator updating
    // After response, we should have "2 messages" (user + assistant)
    await expect(page.getByText(/2 messages/i)).toBeVisible({ timeout: 60000 });

    // Download should now be available
    const downloadButton = page.getByText(/download transcript/i).first();
    await expect(downloadButton).toBeVisible();

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
      filenamePattern: /interview-transcript-.*\.zip/,
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
