import { describe, it, expect, vi } from "vitest";
import {
  validateResumeFileMetadata,
  validateResumeContent,
  isAllowedResumeExtension,
  isAllowedResumeSize,
  createUploadError,
  MAX_RESUME_FILE_SIZE,
  ALLOWED_RESUME_EXTENSIONS,
  MARKDOWN_CONTENT_TYPE,
} from "./resume-upload";

// Mock the server-only module to allow testing
vi.mock("server-only", () => ({}));

describe("resume-upload", () => {
  describe("constants", () => {
    it("has correct max file size (10MB)", () => {
      expect(MAX_RESUME_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    it("allows .md extension", () => {
      expect(ALLOWED_RESUME_EXTENSIONS).toContain(".md");
    });

    it("has correct markdown content type", () => {
      expect(MARKDOWN_CONTENT_TYPE).toBe("text/markdown; charset=utf-8");
    });
  });

  describe("isAllowedResumeExtension", () => {
    it("accepts .md files", () => {
      expect(isAllowedResumeExtension("resume.md")).toBe(true);
      expect(isAllowedResumeExtension("my-resume.md")).toBe(true);
      expect(isAllowedResumeExtension("RESUME.MD")).toBe(true);
      expect(isAllowedResumeExtension("Resume.Md")).toBe(true);
    });

    it("rejects non-markdown files", () => {
      expect(isAllowedResumeExtension("resume.txt")).toBe(false);
      expect(isAllowedResumeExtension("resume.pdf")).toBe(false);
      expect(isAllowedResumeExtension("resume.docx")).toBe(false);
      expect(isAllowedResumeExtension("resume.html")).toBe(false);
      expect(isAllowedResumeExtension("resume")).toBe(false);
    });

    it("handles edge cases", () => {
      expect(isAllowedResumeExtension(".md")).toBe(true);
      expect(isAllowedResumeExtension("file.md.txt")).toBe(false);
      expect(isAllowedResumeExtension("")).toBe(false);
    });
  });

  describe("isAllowedResumeSize", () => {
    it("accepts files within size limit", () => {
      expect(isAllowedResumeSize(1)).toBe(true);
      expect(isAllowedResumeSize(1024)).toBe(true);
      expect(isAllowedResumeSize(1024 * 1024)).toBe(true);
      expect(isAllowedResumeSize(MAX_RESUME_FILE_SIZE)).toBe(true);
    });

    it("rejects files exceeding size limit", () => {
      expect(isAllowedResumeSize(MAX_RESUME_FILE_SIZE + 1)).toBe(false);
      expect(isAllowedResumeSize(MAX_RESUME_FILE_SIZE * 2)).toBe(false);
    });

    it("rejects zero or negative sizes", () => {
      expect(isAllowedResumeSize(0)).toBe(false);
      expect(isAllowedResumeSize(-1)).toBe(false);
    });
  });

  describe("validateResumeFileMetadata", () => {
    it("validates correct metadata", () => {
      const result = validateResumeFileMetadata({
        filename: "resume.md",
        size: 1024,
      });

      expect(result.filename).toBe("resume.md");
      expect(result.size).toBe(1024);
    });

    it("accepts optional contentType", () => {
      const result = validateResumeFileMetadata({
        filename: "resume.md",
        size: 1024,
        contentType: "text/markdown",
      });

      expect(result.contentType).toBe("text/markdown");
    });

    it("throws for invalid file extension", () => {
      expect(() =>
        validateResumeFileMetadata({
          filename: "resume.txt",
          size: 1024,
        })
      ).toThrow();
    });

    it("throws for empty filename", () => {
      expect(() =>
        validateResumeFileMetadata({
          filename: "",
          size: 1024,
        })
      ).toThrow();
    });

    it("throws for files exceeding size limit", () => {
      expect(() =>
        validateResumeFileMetadata({
          filename: "resume.md",
          size: MAX_RESUME_FILE_SIZE + 1,
        })
      ).toThrow();
    });

    it("throws for zero or negative size", () => {
      expect(() =>
        validateResumeFileMetadata({
          filename: "resume.md",
          size: 0,
        })
      ).toThrow();

      expect(() =>
        validateResumeFileMetadata({
          filename: "resume.md",
          size: -100,
        })
      ).toThrow();
    });
  });

  describe("validateResumeContent", () => {
    it("validates valid markdown content", () => {
      const content = Buffer.from("# My Resume\n\nSome content here.");
      const result = validateResumeContent(content);

      expect(result).toBe("# My Resume\n\nSome content here.");
    });

    it("handles UTF-8 content correctly", () => {
      const content = Buffer.from("# Résumé\n\nCafé ☕ emoji");
      const result = validateResumeContent(content);

      expect(result).toContain("Résumé");
      expect(result).toContain("☕");
    });

    it("throws for empty content", () => {
      const content = Buffer.from("");
      expect(() => validateResumeContent(content)).toThrow("empty");
    });

    it("throws for whitespace-only content", () => {
      const content = Buffer.from("   \n\t\n   ");
      expect(() => validateResumeContent(content)).toThrow("empty");
    });

    it("throws for content with null bytes (binary)", () => {
      const content = Buffer.from("Hello\0World");
      expect(() => validateResumeContent(content)).toThrow("binary");
    });
  });

  describe("createUploadError", () => {
    it("creates error with correct code and message", () => {
      const error = createUploadError(
        "INVALID_FILE_TYPE",
        "File must be markdown"
      );

      expect(error.name).toBe("ResumeUploadError");
      expect(error.code).toBe("INVALID_FILE_TYPE");
      expect(error.message).toBe("File must be markdown");
    });

    it("creates errors for all error codes", () => {
      const codes = [
        "INVALID_FILE_TYPE",
        "FILE_TOO_LARGE",
        "EMPTY_FILE",
        "INVALID_CONTENT",
        "STORAGE_ERROR",
        "METADATA_ERROR",
      ] as const;

      for (const code of codes) {
        const error = createUploadError(code, "Test message");
        expect(error.code).toBe(code);
      }
    });
  });
});
