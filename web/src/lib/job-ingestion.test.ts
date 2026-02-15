import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  // Constants
  MAX_JOB_FILE_SIZE,
  ALLOWED_JOB_EXTENSIONS,
  URL_FETCH_TIMEOUT,
  MAX_URL_CONTENT_LENGTH,
  // Error class
  JobIngestionError,
  // Utility functions
  getFileExtension,
  isAllowedExtension,
  normalizeText,
  countWords,
  createIngestionResult,
  // Text/paste ingestion
  ingestFromPaste,
  // URL ingestion
  ingestFromUrl,
  extractTextFromHtml,
  decodeHtmlEntities,
  // File ingestion
  validateJobFileMetadata,
  extractTextFromTextFile,
  ingestFromFile,
  // Unified interface
  ingestJob,
} from "./job-ingestion";

// ============================================================================
// Test: Constants
// ============================================================================

describe("job-ingestion constants", () => {
  it("should have MAX_JOB_FILE_SIZE set to 10MB", () => {
    expect(MAX_JOB_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  it("should have correct allowed extensions", () => {
    expect(ALLOWED_JOB_EXTENSIONS).toEqual([".docx", ".html", ".htm", ".txt", ".md"]);
  });

  it("should have URL_FETCH_TIMEOUT set to 15 seconds", () => {
    expect(URL_FETCH_TIMEOUT).toBe(15000);
  });

  it("should have MAX_URL_CONTENT_LENGTH set to 5MB", () => {
    expect(MAX_URL_CONTENT_LENGTH).toBe(5 * 1024 * 1024);
  });
});

// ============================================================================
// Test: JobIngestionError
// ============================================================================

describe("JobIngestionError", () => {
  it("should create error with code and message", () => {
    const error = new JobIngestionError("INVALID_INPUT", "Test message");
    expect(error.code).toBe("INVALID_INPUT");
    expect(error.message).toBe("Test message");
    expect(error.name).toBe("JobIngestionError");
    expect(error.shouldPromptPaste).toBe(false);
  });

  it("should create error with shouldPromptPaste flag", () => {
    const error = new JobIngestionError("URL_FETCH_FAILED", "Fetch failed", true);
    expect(error.shouldPromptPaste).toBe(true);
  });

  it("should serialize to JSON correctly", () => {
    const error = new JobIngestionError("URL_BLOCKED", "Site blocked", true);
    const json = error.toJSON();
    expect(json).toEqual({
      name: "JobIngestionError",
      code: "URL_BLOCKED",
      message: "Site blocked",
      shouldPromptPaste: true,
    });
  });

  it("should be instanceof Error", () => {
    const error = new JobIngestionError("EMPTY_INPUT", "Empty");
    expect(error).toBeInstanceOf(Error);
  });
});

// ============================================================================
// Test: Utility Functions
// ============================================================================

describe("getFileExtension", () => {
  it("should extract extension from filename", () => {
    expect(getFileExtension("document.pdf")).toBe(".pdf");
    expect(getFileExtension("resume.docx")).toBe(".docx");
    expect(getFileExtension("notes.txt")).toBe(".txt");
    expect(getFileExtension("readme.md")).toBe(".md");
  });

  it("should return lowercase extension", () => {
    expect(getFileExtension("DOCUMENT.PDF")).toBe(".pdf");
    expect(getFileExtension("Resume.DOCX")).toBe(".docx");
  });

  it("should handle multiple dots in filename", () => {
    expect(getFileExtension("my.document.pdf")).toBe(".pdf");
    expect(getFileExtension("file.name.with.dots.txt")).toBe(".txt");
  });

  it("should return empty string for no extension", () => {
    expect(getFileExtension("noextension")).toBe("");
    expect(getFileExtension("")).toBe("");
  });

  it("should return empty string for trailing dot", () => {
    expect(getFileExtension("file.")).toBe("");
  });
});

describe("isAllowedExtension", () => {
  it("should return true for allowed extensions", () => {
    expect(isAllowedExtension(".docx")).toBe(true);
    expect(isAllowedExtension(".html")).toBe(true);
    expect(isAllowedExtension(".htm")).toBe(true);
    expect(isAllowedExtension(".txt")).toBe(true);
    expect(isAllowedExtension(".md")).toBe(true);
  });

  it("should return false for disallowed extensions", () => {
    expect(isAllowedExtension(".exe")).toBe(false);
    expect(isAllowedExtension(".doc")).toBe(false);
    expect(isAllowedExtension(".pdf")).toBe(false);
    expect(isAllowedExtension(".rtf")).toBe(false);
    expect(isAllowedExtension("")).toBe(false);
  });
});

describe("normalizeText", () => {
  it("should trim whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
    expect(normalizeText("\n\nhello\n\n")).toBe("hello");
  });

  it("should normalize line endings", () => {
    expect(normalizeText("line1\r\nline2")).toBe("line1\nline2");
    expect(normalizeText("line1\rline2")).toBe("line1\nline2");
  });

  it("should collapse multiple blank lines", () => {
    expect(normalizeText("line1\n\n\n\nline2")).toBe("line1\n\nline2");
    expect(normalizeText("a\n\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("should remove null bytes and control characters", () => {
    expect(normalizeText("hello\x00world")).toBe("helloworld");
    expect(normalizeText("test\x07text")).toBe("testtext");
  });

  it("should preserve tabs", () => {
    expect(normalizeText("hello\tworld")).toBe("hello\tworld");
  });

  it("should handle empty input", () => {
    expect(normalizeText("")).toBe("");
    expect(normalizeText("   ")).toBe("");
  });
});

describe("countWords", () => {
  it("should count words correctly", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("one two three four")).toBe(4);
  });

  it("should handle multiple spaces", () => {
    expect(countWords("hello    world")).toBe(2);
  });

  it("should handle newlines and tabs", () => {
    expect(countWords("hello\nworld")).toBe(2);
    expect(countWords("hello\tworld")).toBe(2);
  });

  it("should return 0 for empty input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });
});

describe("createIngestionResult", () => {
  it("should create result with normalized text", () => {
    const result = createIngestionResult(
      "  Job Title  \n\n\n\n  Description  ",
      "paste",
      "pasted text"
    );
    expect(result.text).toBe("Job Title\n\nDescription");
    expect(result.source).toBe("paste");
    expect(result.sourceIdentifier).toBe("pasted text");
    expect(result.characterCount).toBe(22);
    expect(result.wordCount).toBe(3);
  });
});

// ============================================================================
// Test: Text/Paste Ingestion
// ============================================================================

describe("ingestFromPaste", () => {
  it("should ingest valid pasted text", () => {
    const result = ingestFromPaste("Software Engineer position at Acme Corp");
    expect(result.source).toBe("paste");
    expect(result.sourceIdentifier).toBe("pasted text");
    expect(result.text).toBe("Software Engineer position at Acme Corp");
    expect(result.wordCount).toBe(6);
  });

  it("should normalize pasted text", () => {
    const result = ingestFromPaste("  Hello\r\n\r\nWorld  ");
    expect(result.text).toBe("Hello\n\nWorld");
  });

  it("should throw for empty input", () => {
    expect(() => ingestFromPaste("")).toThrow(JobIngestionError);
    expect(() => ingestFromPaste("   ")).toThrow(JobIngestionError);
    expect(() => ingestFromPaste("\n\n")).toThrow(JobIngestionError);
  });

  it("should throw with EMPTY_INPUT code", () => {
    try {
      ingestFromPaste("");
    } catch (error) {
      expect(error).toBeInstanceOf(JobIngestionError);
      expect((error as JobIngestionError).code).toBe("EMPTY_INPUT");
    }
  });
});

// ============================================================================
// Test: HTML Extraction
// ============================================================================

describe("decodeHtmlEntities", () => {
  it("should decode common HTML entities", () => {
    expect(decodeHtmlEntities("&amp;")).toBe("&");
    expect(decodeHtmlEntities("&lt;")).toBe("<");
    expect(decodeHtmlEntities("&gt;")).toBe(">");
    expect(decodeHtmlEntities("&quot;")).toBe('"');
    expect(decodeHtmlEntities("&apos;")).toBe("'");
    expect(decodeHtmlEntities("&nbsp;")).toBe(" ");
  });

  it("should decode numeric entities", () => {
    expect(decodeHtmlEntities("&#65;")).toBe("A");
    expect(decodeHtmlEntities("&#x41;")).toBe("A");
  });

  it("should handle mixed content", () => {
    expect(decodeHtmlEntities("Hello &amp; World")).toBe("Hello & World");
    expect(decodeHtmlEntities("5 &gt; 3 &amp;&amp; 2 &lt; 4")).toBe(
      "5 > 3 && 2 < 4"
    );
  });
});

describe("extractTextFromHtml", () => {
  it("should extract text from simple HTML", () => {
    const html = "<p>Hello World</p>";
    expect(extractTextFromHtml(html)).toBe("Hello World");
  });

  it("should remove script tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    expect(extractTextFromHtml(html)).toBe("Hello\n\nWorld");
  });

  it("should remove style tags", () => {
    const html = "<style>body { color: red; }</style><p>Content</p>";
    expect(extractTextFromHtml(html)).toBe("Content");
  });

  it("should remove HTML comments", () => {
    const html = "<!-- comment --><p>Visible</p>";
    expect(extractTextFromHtml(html)).toBe("Visible");
  });

  it("should convert block elements to newlines", () => {
    const html = "<h1>Title</h1><p>Paragraph</p><div>Content</div>";
    const result = extractTextFromHtml(html);
    expect(result).toContain("Title");
    expect(result).toContain("Paragraph");
    expect(result).toContain("Content");
  });

  it("should decode HTML entities", () => {
    const html = "<p>Tom &amp; Jerry</p>";
    expect(extractTextFromHtml(html)).toBe("Tom & Jerry");
  });

  it("should handle empty input", () => {
    expect(extractTextFromHtml("")).toBe("");
  });
});

// ============================================================================
// Test: URL Ingestion
// ============================================================================

describe("ingestFromUrl", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it("should throw for invalid URL format", async () => {
    await expect(ingestFromUrl("not-a-url")).rejects.toThrow(JobIngestionError);
    await expect(ingestFromUrl("ftp://example.com")).rejects.toThrow(
      JobIngestionError
    );
  });

  it("should set shouldPromptPaste for URL errors", async () => {
    try {
      await ingestFromUrl("not-a-url");
    } catch (error) {
      expect(error).toBeInstanceOf(JobIngestionError);
      expect((error as JobIngestionError).shouldPromptPaste).toBe(true);
    }
  });

  it("should extract text from successful fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: () => Promise.resolve("<html><body><p>Job Description</p></body></html>"),
    });

    const result = await ingestFromUrl("https://example.com/job");
    expect(result.source).toBe("url");
    expect(result.text).toBe("Job Description");
    expect(result.sourceIdentifier).toBe("https://example.com/job");
  });

  it("should throw for non-OK response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    });

    await expect(ingestFromUrl("https://example.com/job")).rejects.toThrow(
      /status 404/
    );
  });

  it("should throw for content too large", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-length": String(MAX_URL_CONTENT_LENGTH + 1) }),
      text: () => Promise.resolve(""),
    });

    await expect(ingestFromUrl("https://example.com/job")).rejects.toThrow(
      /too large/
    );
  });

  it("should throw for empty extracted content", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: () => Promise.resolve("<html><head><script>only scripts</script></head></html>"),
    });

    await expect(ingestFromUrl("https://example.com/job")).rejects.toThrow(
      /Could not extract/
    );
  });
});

// ============================================================================
// Test: File Metadata Validation
// ============================================================================

describe("validateJobFileMetadata", () => {
  it("should validate correct HTML metadata", () => {
    const ext = validateJobFileMetadata({
      filename: "job.html",
      size: 1024,
    });
    expect(ext).toBe(".html");
  });

  it("should validate correct HTM metadata", () => {
    const ext = validateJobFileMetadata({
      filename: "job.htm",
      size: 1024,
    });
    expect(ext).toBe(".htm");
  });

  it("should validate correct DOCX metadata", () => {
    const ext = validateJobFileMetadata({
      filename: "description.docx",
      size: 2048,
    });
    expect(ext).toBe(".docx");
  });

  it("should validate correct TXT metadata", () => {
    const ext = validateJobFileMetadata({
      filename: "job.txt",
      size: 512,
    });
    expect(ext).toBe(".txt");
  });

  it("should validate correct MD metadata", () => {
    const ext = validateJobFileMetadata({
      filename: "position.md",
      size: 1000,
    });
    expect(ext).toBe(".md");
  });

  it("should throw for invalid extension", () => {
    expect(() =>
      validateJobFileMetadata({
        filename: "job.exe",
        size: 1024,
      })
    ).toThrow(JobIngestionError);
  });

  it("should throw INVALID_FILE_TYPE for wrong extension", () => {
    try {
      validateJobFileMetadata({ filename: "job.doc", size: 100 });
    } catch (error) {
      expect(error).toBeInstanceOf(JobIngestionError);
      expect((error as JobIngestionError).code).toBe("INVALID_FILE_TYPE");
    }
  });

  it("should throw for file too large", () => {
    expect(() =>
      validateJobFileMetadata({
        filename: "job.docx",
        size: MAX_JOB_FILE_SIZE + 1,
      })
    ).toThrow(/10MB/);
  });

  it("should throw FILE_TOO_LARGE code for oversized file", () => {
    try {
      validateJobFileMetadata({
        filename: "job.docx",
        size: MAX_JOB_FILE_SIZE + 1,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(JobIngestionError);
      expect((error as JobIngestionError).code).toBe("FILE_TOO_LARGE");
    }
  });

  it("should throw for empty filename", () => {
    expect(() =>
      validateJobFileMetadata({
        filename: "",
        size: 1024,
      })
    ).toThrow();
  });

  it("should throw for zero size", () => {
    expect(() =>
      validateJobFileMetadata({
        filename: "job.docx",
        size: 0,
      })
    ).toThrow();
  });

  it("should throw for negative size", () => {
    expect(() =>
      validateJobFileMetadata({
        filename: "job.docx",
        size: -100,
      })
    ).toThrow();
  });
});

// ============================================================================
// Test: Text File Extraction
// ============================================================================

describe("extractTextFromTextFile", () => {
  it("should extract text from valid buffer", () => {
    const buffer = Buffer.from("Job Description: Software Engineer");
    const text = extractTextFromTextFile(buffer, "job.txt");
    expect(text).toBe("Job Description: Software Engineer");
  });

  it("should handle UTF-8 content", () => {
    const buffer = Buffer.from("Position: Développeur • Senior – Full-time");
    const text = extractTextFromTextFile(buffer, "job.txt");
    expect(text).toBe("Position: Développeur • Senior – Full-time");
  });

  it("should throw for binary content", () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(() => extractTextFromTextFile(buffer, "job.txt")).toThrow(
      /binary file/
    );
  });

  it("should throw for empty content", () => {
    const buffer = Buffer.from("");
    expect(() => extractTextFromTextFile(buffer, "job.txt")).toThrow(/empty/);
  });

  it("should throw for whitespace-only content", () => {
    const buffer = Buffer.from("   \n\n   ");
    expect(() => extractTextFromTextFile(buffer, "job.txt")).toThrow(/empty/);
  });
});

// ============================================================================
// Test: File Ingestion
// ============================================================================

describe("ingestFromFile", () => {
  it("should ingest text file", async () => {
    const buffer = Buffer.from("Software Engineer Job Posting");
    const result = await ingestFromFile(buffer, {
      filename: "job.txt",
      size: buffer.length,
    });
    expect(result.source).toBe("file");
    expect(result.sourceIdentifier).toBe("job.txt");
    expect(result.text).toBe("Software Engineer Job Posting");
  });

  it("should ingest markdown file", async () => {
    const buffer = Buffer.from("# Senior Developer\n\nWe are hiring!");
    const result = await ingestFromFile(buffer, {
      filename: "position.md",
      size: buffer.length,
    });
    expect(result.text).toBe("# Senior Developer\n\nWe are hiring!");
  });

  it("should throw for invalid file type", async () => {
    const buffer = Buffer.from("content");
    await expect(
      ingestFromFile(buffer, {
        filename: "job.exe",
        size: buffer.length,
      })
    ).rejects.toThrow(JobIngestionError);
  });

  it("should throw for oversized file", async () => {
    const buffer = Buffer.from("content");
    await expect(
      ingestFromFile(buffer, {
        filename: "job.txt",
        size: MAX_JOB_FILE_SIZE + 1,
      })
    ).rejects.toThrow(/10MB/);
  });
});

// ============================================================================
// Test: Unified Ingestion Interface
// ============================================================================

describe("ingestJob", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should handle paste mode", async () => {
    const result = await ingestJob({
      mode: "paste",
      text: "Job posting content",
    });
    expect(result.source).toBe("paste");
    expect(result.text).toBe("Job posting content");
  });

  it("should handle file mode", async () => {
    const buffer = Buffer.from("File job content");
    const result = await ingestJob({
      mode: "file",
      buffer,
      metadata: { filename: "job.txt", size: buffer.length },
    });
    expect(result.source).toBe("file");
    expect(result.text).toBe("File job content");
  });

  it("should handle url mode", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: () => Promise.resolve("<p>URL Job Content</p>"),
    });

    const result = await ingestJob({
      mode: "url",
      url: "https://example.com/job",
    });
    expect(result.source).toBe("url");
    expect(result.text).toBe("URL Job Content");
  });
});

// ============================================================================
// Test: Edge Cases and Integration
// ============================================================================

describe("edge cases", () => {
  it("should handle very long text within limits", () => {
    const longText = "word ".repeat(10000);
    const result = ingestFromPaste(longText);
    expect(result.wordCount).toBe(10000);
  });

  it("should handle special characters in text", () => {
    const specialText = "Position: C++ Developer • $150k – Remote™";
    const result = ingestFromPaste(specialText);
    expect(result.text).toBe(specialText);
  });

  it("should handle unicode in filenames", async () => {
    const buffer = Buffer.from("Content");
    const result = await ingestFromFile(buffer, {
      filename: "Stellenangebot.txt",
      size: buffer.length,
    });
    expect(result.sourceIdentifier).toBe("Stellenangebot.txt");
  });

  it("should preserve case sensitivity in file extensions validation", () => {
    const upperExt = validateJobFileMetadata({
      filename: "JOB.HTML",
      size: 100,
    });
    expect(upperExt).toBe(".html");

    const mixedExt = validateJobFileMetadata({
      filename: "Document.DOCX",
      size: 100,
    });
    expect(mixedExt).toBe(".docx");
  });
});

describe("real-world HTML examples", () => {
  it("should extract job posting from typical HTML structure", () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Software Engineer - Company X</title>
        <script>var analytics = {};</script>
        <style>.header { color: blue; }</style>
      </head>
      <body>
        <nav>Menu items</nav>
        <main>
          <h1>Software Engineer</h1>
          <p>Location: San Francisco, CA</p>
          <h2>Requirements</h2>
          <ul>
            <li>5+ years experience</li>
            <li>Python &amp; JavaScript</li>
          </ul>
        </main>
        <footer>Copyright 2026</footer>
      </body>
      </html>
    `;
    const text = extractTextFromHtml(html);
    expect(text).toContain("Software Engineer");
    expect(text).toContain("San Francisco, CA");
    expect(text).toContain("5+ years experience");
    expect(text).toContain("Python & JavaScript");
    expect(text).not.toContain("var analytics");
    expect(text).not.toContain("color: blue");
  });
});
