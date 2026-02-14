import { describe, it, expect, vi } from "vitest";
import {
  createBundle,
  getExpectedBundleFiles,
  validateBundleFiles,
  type BundleFile,
} from "./artifact-bundler";

// Mock server-only to allow testing
vi.mock("server-only", () => ({}));

// Mock the env module
vi.mock("./env", () => ({
  getEnv: () => ({
    GCP_PROJECT_ID: "test-project",
    GCS_PUBLIC_BUCKET: "test-public-bucket",
    GCS_PRIVATE_BUCKET: "test-private-bucket",
    VERTEX_AI_LOCATION: "us-central1",
    VERTEX_AI_MODEL: "gemini-pro",
    RECAPTCHA_SITE_KEY: "test-site-key",
    RECAPTCHA_SECRET_KEY: "test-secret-key",
    GOOGLE_OAUTH_CLIENT_ID: "test-client-id",
    GOOGLE_OAUTH_CLIENT_SECRET: "test-client-secret",
  }),
}));

describe("artifact-bundler", () => {
  describe("createBundle", () => {
    it("creates a valid zip buffer from files", async () => {
      const files: BundleFile[] = [
        {
          path: "test.txt",
          content: "Hello World",
        },
        {
          path: "data.json",
          content: JSON.stringify({ key: "value" }),
        },
      ];

      const result = await createBundle(files);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
      expect(result.fileCount).toBe(2);
      expect(result.filePaths).toEqual(["test.txt", "data.json"]);
    });

    it("creates an empty zip with no files", async () => {
      const files: BundleFile[] = [];

      const result = await createBundle(files);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.fileCount).toBe(0);
      expect(result.filePaths).toEqual([]);
    });

    it("handles string content", async () => {
      const files: BundleFile[] = [
        {
          path: "readme.md",
          content: "# Hello\n\nThis is content.",
        },
      ];

      const result = await createBundle(files);

      // Verify we got a valid zip with expected metadata
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.fileCount).toBe(1);
      expect(result.filePaths).toEqual(["readme.md"]);
      // Zip should have magic bytes (PK)
      expect(result.buffer[0]).toBe(0x50); // 'P'
      expect(result.buffer[1]).toBe(0x4b); // 'K'
    });

    it("handles Buffer content", async () => {
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const files: BundleFile[] = [
        {
          path: "binary.bin",
          content: binaryContent,
        },
      ];

      const result = await createBundle(files);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.fileCount).toBe(1);
      expect(result.filePaths).toEqual(["binary.bin"]);
      // Zip should be larger than the content (due to headers)
      expect(result.size).toBeGreaterThan(binaryContent.length);
    });

    it("handles nested paths in zip", async () => {
      const files: BundleFile[] = [
        { path: "inputs/job.txt", content: "Job description" },
        { path: "outputs/report.md", content: "# Report" },
        { path: "outputs/report.html", content: "<h1>Report</h1>" },
        { path: "citations/citations.json", content: "[]" },
      ];

      const result = await createBundle(files);

      expect(result.fileCount).toBe(4);
      expect(result.filePaths).toContain("inputs/job.txt");
      expect(result.filePaths).toContain("outputs/report.md");
      expect(result.filePaths).toContain("outputs/report.html");
      expect(result.filePaths).toContain("citations/citations.json");
    });

    it("handles UTF-8 content correctly", async () => {
      const unicodeContent = "日本語テキスト 🎉 émojis et accents";
      const files: BundleFile[] = [
        {
          path: "unicode.txt",
          content: unicodeContent,
        },
      ];

      const result = await createBundle(files);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.fileCount).toBe(1);
      expect(result.filePaths).toEqual(["unicode.txt"]);
      // The zip should be larger than the UTF-8 encoded content
      expect(result.size).toBeGreaterThan(Buffer.byteLength(unicodeContent, "utf-8"));
    });

    it("handles large files with compression", async () => {
      const largeContent = "x".repeat(1024 * 1024); // 1MB of repeated 'x'
      const files: BundleFile[] = [
        {
          path: "large.txt",
          content: largeContent,
        },
      ];

      const result = await createBundle(files);

      // Compressed size should be much smaller due to repetitive content
      expect(result.size).toBeLessThan(largeContent.length);
      expect(result.fileCount).toBe(1);
      expect(result.filePaths).toEqual(["large.txt"]);
    });

    it("handles files with special characters in names", async () => {
      const files: BundleFile[] = [
        {
          path: "file with spaces.txt",
          content: "content 1",
        },
        {
          path: "file-with-dashes.txt",
          content: "content 2",
        },
        {
          path: "file_with_underscores.txt",
          content: "content 3",
        },
      ];

      const result = await createBundle(files);

      expect(result.fileCount).toBe(3);
      expect(result.filePaths).toContain("file with spaces.txt");
      expect(result.filePaths).toContain("file-with-dashes.txt");
      expect(result.filePaths).toContain("file_with_underscores.txt");
    });

    it("produces valid zip magic bytes", async () => {
      const files: BundleFile[] = [
        { path: "test.txt", content: "content" },
      ];

      const result = await createBundle(files);

      // ZIP files start with "PK" (0x50 0x4B)
      expect(result.buffer[0]).toBe(0x50);
      expect(result.buffer[1]).toBe(0x4b);
    });
  });

  describe("getExpectedBundleFiles", () => {
    it("always includes metadata.json", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission);

      expect(files).toContain("metadata.json");
    });

    it("includes inputs when present", () => {
      const submission = {
        inputs: { jobUrl: "https://example.com" },
        extracted: {},
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission);

      expect(files).toContain("inputs/inputs.json");
    });

    it("excludes inputs when empty", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission);

      expect(files).not.toContain("inputs/inputs.json");
    });

    it("includes extracted when present", () => {
      const submission = {
        inputs: {},
        extracted: { seniority: "senior", location: "remote" },
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission);

      expect(files).toContain("extracted/extracted.json");
    });

    it("includes outputs when present", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: { reportPath: "outputs/report.md" },
        citations: [],
      };

      const files = getExpectedBundleFiles(submission);

      expect(files).toContain("outputs/outputs.json");
    });

    it("includes citations when present", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: {},
        citations: [
          { chunkId: "c1", title: "Experience", sourceRef: "h2:Experience" },
        ],
      };

      const files = getExpectedBundleFiles(submission);

      expect(files).toContain("citations/citations.json");
      expect(files).toContain("citations/citations.md");
      expect(files).toContain("citations/citations.html");
    });

    it("excludes citations when empty", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission);

      expect(files).not.toContain("citations/citations.json");
      expect(files).not.toContain("citations/citations.md");
      expect(files).not.toContain("citations/citations.html");
    });

    it("respects includeInputs: false option", () => {
      const submission = {
        inputs: { data: "value" },
        extracted: {},
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission, false, false, {
        includeInputs: false,
      });

      expect(files).not.toContain("inputs/inputs.json");
    });

    it("respects includeExtracted: false option", () => {
      const submission = {
        inputs: {},
        extracted: { data: "value" },
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission, false, false, {
        includeExtracted: false,
      });

      expect(files).not.toContain("extracted/extracted.json");
    });

    it("respects includeOutputs: false option", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: { data: "value" },
        citations: [],
      };

      const files = getExpectedBundleFiles(submission, false, false, {
        includeOutputs: false,
      });

      expect(files).not.toContain("outputs/outputs.json");
    });

    it("respects includeCitations: false option", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: {},
        citations: [
          { chunkId: "c1", title: "Title", sourceRef: "ref" },
        ],
      };

      const files = getExpectedBundleFiles(submission, false, false, {
        includeCitations: false,
      });

      expect(files).not.toContain("citations/citations.json");
      expect(files).not.toContain("citations/citations.md");
      expect(files).not.toContain("citations/citations.html");
    });

    it("indicates placeholder for GCS input files", () => {
      const submission = {
        inputs: { data: "value" },
        extracted: {},
        outputs: {},
        citations: [],
      };

      const files = getExpectedBundleFiles(submission, true, false);

      expect(files).toContain("inputs/...");
    });

    it("indicates placeholder for GCS output files", () => {
      const submission = {
        inputs: {},
        extracted: {},
        outputs: { data: "value" },
        citations: [],
      };

      const files = getExpectedBundleFiles(submission, false, true);

      expect(files).toContain("outputs/...");
    });

    it("returns complete file list for full submission", () => {
      const submission = {
        inputs: { jobUrl: "https://example.com", jobText: "Description" },
        extracted: { seniority: "senior", location: "remote" },
        outputs: { reportPath: "report.md", fitScore: "Well" },
        citations: [
          { chunkId: "c1", title: "Experience", sourceRef: "h2:Experience" },
          { chunkId: "c2", title: "Skills", sourceRef: "h2:Skills" },
        ],
      };

      const files = getExpectedBundleFiles(submission, true, true);

      expect(files).toContain("metadata.json");
      expect(files).toContain("inputs/inputs.json");
      expect(files).toContain("inputs/...");
      expect(files).toContain("extracted/extracted.json");
      expect(files).toContain("outputs/outputs.json");
      expect(files).toContain("outputs/...");
      expect(files).toContain("citations/citations.json");
      expect(files).toContain("citations/citations.md");
      expect(files).toContain("citations/citations.html");
    });
  });

  describe("validateBundleFiles", () => {
    it("returns valid for bundle with metadata", () => {
      const result = validateBundleFiles(["metadata.json", "inputs/job.txt"]);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.hasMetadata).toBe(true);
    });

    it("returns invalid when metadata is missing", () => {
      const result = validateBundleFiles(["inputs/job.txt", "outputs/report.md"]);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("metadata.json");
      expect(result.hasMetadata).toBe(false);
    });

    it("handles empty file list", () => {
      const result = validateBundleFiles([]);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain("metadata.json");
      expect(result.hasMetadata).toBe(false);
    });

    it("handles metadata-only bundle", () => {
      const result = validateBundleFiles(["metadata.json"]);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.hasMetadata).toBe(true);
    });
  });

  describe("bundle structure for different tool types", () => {
    it("fit tool submission has expected structure", () => {
      const fitSubmission = {
        inputs: { jobUrl: "https://example.com/job", jobText: "..." },
        extracted: {
          seniority: "senior",
          location: "remote",
          mustHaves: ["TypeScript", "React"],
        },
        outputs: {
          fitScore: "Well",
          rationale: "...",
          reportPath: "report.md",
        },
        citations: [
          { chunkId: "c1", title: "Experience", sourceRef: "h2:Experience" },
        ],
      };

      const files = getExpectedBundleFiles(fitSubmission, true, true);

      // Verify core files present
      expect(files).toContain("metadata.json");
      expect(files).toContain("inputs/inputs.json");
      expect(files).toContain("extracted/extracted.json");
      expect(files).toContain("outputs/outputs.json");
      expect(files).toContain("citations/citations.json");
    });

    it("resume tool submission has expected structure", () => {
      const resumeSubmission = {
        inputs: { jobUrl: "https://example.com/job" },
        extracted: { company: "Tech Corp", role: "Engineer" },
        outputs: {
          resumePath: "resume.md",
          resumeHtmlPath: "resume.html",
        },
        citations: [
          { chunkId: "c1", title: "Skills", sourceRef: "h2:Skills" },
        ],
      };

      const files = getExpectedBundleFiles(resumeSubmission, true, true);

      expect(files).toContain("metadata.json");
      expect(files).toContain("inputs/inputs.json");
      expect(files).toContain("extracted/extracted.json");
      expect(files).toContain("outputs/outputs.json");
      expect(files).toContain("citations/citations.json");
    });

    it("interview tool submission has expected structure", () => {
      const interviewSubmission = {
        inputs: {},
        extracted: {},
        outputs: { transcriptPath: "transcript.md" },
        citations: [
          { chunkId: "c1", title: "Experience", sourceRef: "h2:Experience" },
        ],
      };

      const files = getExpectedBundleFiles(interviewSubmission, false, true);

      expect(files).toContain("metadata.json");
      expect(files).not.toContain("inputs/inputs.json"); // No inputs
      expect(files).not.toContain("extracted/extracted.json"); // No extracted
      expect(files).toContain("outputs/outputs.json");
      expect(files).toContain("citations/citations.json");
    });
  });
});
