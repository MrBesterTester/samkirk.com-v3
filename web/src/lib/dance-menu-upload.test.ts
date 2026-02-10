import { describe, it, expect } from "vitest";
import {
  getFileExtension,
  isAllowedExtension,
  validateFileMetadata,
  validateFileContent,
  validateBundle,
  DanceMenuUploadError,
  MAX_FILE_SIZE,
  MAX_BUNDLE_SIZE,
  REQUIRED_EXTENSIONS,
  ALLOWED_EXTENSIONS,
  getFormatDisplayName,
} from "./dance-menu-upload";

describe("dance-menu-upload", () => {
  describe("getFileExtension", () => {
    it("extracts extension from filename", () => {
      expect(getFileExtension("menu.md")).toBe(".md");
      expect(getFileExtension("menu.txt")).toBe(".txt");
      expect(getFileExtension("menu.html")).toBe(".html");
      expect(getFileExtension("menu.pdf")).toBe(".pdf");
    });

    it("returns lowercase extension", () => {
      expect(getFileExtension("Menu.MD")).toBe(".md");
      expect(getFileExtension("Menu.TXT")).toBe(".txt");
      expect(getFileExtension("Menu.HTML")).toBe(".html");
    });

    it("handles files with multiple dots", () => {
      expect(getFileExtension("dance.menu.2026.md")).toBe(".md");
      expect(getFileExtension("my.dance.menu.txt")).toBe(".txt");
    });

    it("returns empty string for files without extension", () => {
      expect(getFileExtension("menu")).toBe("");
      expect(getFileExtension("noext")).toBe("");
    });

    it("returns empty string for files ending with dot", () => {
      expect(getFileExtension("menu.")).toBe("");
    });
  });

  describe("isAllowedExtension", () => {
    it("returns true for allowed extensions", () => {
      expect(isAllowedExtension(".md")).toBe(true);
      expect(isAllowedExtension(".txt")).toBe(true);
      expect(isAllowedExtension(".html")).toBe(true);
      expect(isAllowedExtension(".pdf")).toBe(true);
    });

    it("returns false for disallowed extensions", () => {
      expect(isAllowedExtension(".doc")).toBe(false);
      expect(isAllowedExtension(".docx")).toBe(false);
      expect(isAllowedExtension(".js")).toBe(false);
      expect(isAllowedExtension(".exe")).toBe(false);
      expect(isAllowedExtension("")).toBe(false);
    });
  });

  describe("validateFileMetadata", () => {
    it("returns extension for valid file", () => {
      const ext = validateFileMetadata({ filename: "menu.md", size: 1000 });
      expect(ext).toBe(".md");
    });

    it("throws for missing extension", () => {
      expect(() =>
        validateFileMetadata({ filename: "menu", size: 1000 })
      ).toThrow(DanceMenuUploadError);

      try {
        validateFileMetadata({ filename: "menu", size: 1000 });
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe("INVALID_EXTENSION");
      }
    });

    it("throws for invalid extension", () => {
      expect(() =>
        validateFileMetadata({ filename: "menu.doc", size: 1000 })
      ).toThrow(DanceMenuUploadError);

      try {
        validateFileMetadata({ filename: "menu.doc", size: 1000 });
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe("INVALID_EXTENSION");
      }
    });

    it("throws for empty file", () => {
      expect(() =>
        validateFileMetadata({ filename: "menu.md", size: 0 })
      ).toThrow(DanceMenuUploadError);

      try {
        validateFileMetadata({ filename: "menu.md", size: 0 });
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe("EMPTY_FILE");
      }
    });

    it("throws for file too large", () => {
      expect(() =>
        validateFileMetadata({ filename: "menu.md", size: MAX_FILE_SIZE + 1 })
      ).toThrow(DanceMenuUploadError);

      try {
        validateFileMetadata({ filename: "menu.md", size: MAX_FILE_SIZE + 1 });
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe("FILE_TOO_LARGE");
      }
    });

    it("accepts file at exactly max size", () => {
      const ext = validateFileMetadata({
        filename: "menu.md",
        size: MAX_FILE_SIZE,
      });
      expect(ext).toBe(".md");
    });
  });

  describe("validateFileContent", () => {
    it("accepts valid text content", () => {
      const content = Buffer.from("# Dance Menu\n\nSome content here.");
      expect(() =>
        validateFileContent(content, ".md", "menu.md")
      ).not.toThrow();
    });

    it("accepts valid HTML content", () => {
      const content = Buffer.from(
        "<html><body><h1>Menu</h1></body></html>"
      );
      expect(() =>
        validateFileContent(content, ".html", "menu.html")
      ).not.toThrow();
    });

    it("accepts valid PDF content", () => {
      const content = Buffer.from("%PDF-1.4\n%some content");
      expect(() =>
        validateFileContent(content, ".pdf", "menu.pdf")
      ).not.toThrow();
    });

    it("throws for invalid PDF header", () => {
      const content = Buffer.from("Not a PDF file");
      expect(() =>
        validateFileContent(content, ".pdf", "menu.pdf")
      ).toThrow(DanceMenuUploadError);

      try {
        validateFileContent(content, ".pdf", "menu.pdf");
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe("INVALID_CONTENT");
      }
    });
  });

  describe("validateBundle", () => {
    const createValidFile = (ext: string, content: string = "test content") => ({
      filename: `menu${ext}`,
      size: Buffer.byteLength(content),
      content: Buffer.from(content),
    });

    const createValidPdf = () => ({
      filename: "menu.pdf",
      size: 20,
      content: Buffer.from("%PDF-1.4\n%test content"),
    });

    it("validates a complete bundle with all required files", () => {
      const bundle = validateBundle([
        createValidFile(".txt", "Menu text"),
        createValidFile(".html", "<html><body>Menu</body></html>"),
      ]);

      expect(bundle.files).toHaveLength(2);
      expect(bundle.hasMarkdown).toBe(false);
      expect(bundle.hasText).toBe(true);
      expect(bundle.hasHtml).toBe(true);
      expect(bundle.hasPdf).toBe(false);
    });

    it("validates bundle with optional markdown and PDF", () => {
      const bundle = validateBundle([
        createValidFile(".txt", "Menu text"),
        createValidFile(".html", "<html><body>Menu</body></html>"),
        createValidFile(".md", "# Menu"),
        createValidPdf(),
      ]);

      expect(bundle.files).toHaveLength(4);
      expect(bundle.hasMarkdown).toBe(true);
      expect(bundle.hasPdf).toBe(true);
    });

    it("throws for empty files array", () => {
      expect(() => validateBundle([])).toThrow(DanceMenuUploadError);

      try {
        validateBundle([]);
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe("MISSING_FILES");
      }
    });

    it("throws for missing required extension", () => {
      // Missing .html
      expect(() =>
        validateBundle([
          createValidFile(".txt", "Menu text"),
        ])
      ).toThrow(DanceMenuUploadError);

      try {
        validateBundle([
          createValidFile(".txt", "Menu text"),
        ]);
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe(
          "MISSING_REQUIRED_EXTENSION"
        );
        expect((e as DanceMenuUploadError).message).toContain(".html");
      }
    });

    it("throws for duplicate extensions", () => {
      expect(() =>
        validateBundle([
          createValidFile(".txt", "Menu text 1"),
          createValidFile(".txt", "Menu text 2"),
          createValidFile(".html", "<html>Menu</html>"),
        ])
      ).toThrow(DanceMenuUploadError);

      try {
        validateBundle([
          createValidFile(".txt", "Menu text 1"),
          createValidFile(".txt", "Menu text 2"),
          createValidFile(".html", "<html>Menu</html>"),
        ]);
      } catch (e) {
        expect(e).toBeInstanceOf(DanceMenuUploadError);
        expect((e as DanceMenuUploadError).code).toBe("DUPLICATE_EXTENSION");
      }
    });

    it("calculates total size correctly", () => {
      const txtContent = "Menu text";
      const htmlContent = "<html><body>Menu</body></html>";

      const bundle = validateBundle([
        createValidFile(".txt", txtContent),
        createValidFile(".html", htmlContent),
      ]);

      const expectedSize =
        Buffer.byteLength(txtContent) +
        Buffer.byteLength(htmlContent);

      expect(bundle.totalSize).toBe(expectedSize);
    });

    it("sets correct storage filenames", () => {
      const bundle = validateBundle([
        { filename: "dance-menu-v2.txt", size: 5, content: Buffer.from("test1") },
        { filename: "week-2-menu.html", size: 5, content: Buffer.from("test2") },
      ]);

      const filenames = bundle.files.map((f) => f.storageFilename);
      expect(filenames).toContain("sams-dance-menu.txt");
      expect(filenames).toContain("sams-dance-menu.html");
    });

    it("throws for bundle exceeding max size", () => {
      // Create files that together exceed max bundle size
      // This is a bit tricky in a unit test since we need to create large buffers
      // We'll use a mock-like approach by testing the error logic

      const largeContent = "x".repeat(MAX_BUNDLE_SIZE / 2 + 1);

      expect(() =>
        validateBundle([
          { filename: "menu.txt", size: largeContent.length, content: Buffer.from(largeContent) },
          { filename: "menu.html", size: largeContent.length, content: Buffer.from(largeContent) },
        ])
      ).toThrow(DanceMenuUploadError);
    });
  });

  describe("getFormatDisplayName", () => {
    it("returns correct display names", () => {
      expect(getFormatDisplayName(".md")).toBe("Markdown");
      expect(getFormatDisplayName(".txt")).toBe("Plain Text");
      expect(getFormatDisplayName(".html")).toBe("HTML");
      expect(getFormatDisplayName(".pdf")).toBe("PDF");
    });
  });

  describe("constants", () => {
    it("has correct required extensions", () => {
      expect(REQUIRED_EXTENSIONS).toContain(".txt");
      expect(REQUIRED_EXTENSIONS).toContain(".html");
      expect(REQUIRED_EXTENSIONS).not.toContain(".md");
      expect(REQUIRED_EXTENSIONS).not.toContain(".pdf");
    });

    it("has correct allowed extensions", () => {
      expect(ALLOWED_EXTENSIONS).toContain(".md");
      expect(ALLOWED_EXTENSIONS).toContain(".txt");
      expect(ALLOWED_EXTENSIONS).toContain(".html");
      expect(ALLOWED_EXTENSIONS).toContain(".pdf");
      expect(ALLOWED_EXTENSIONS).toHaveLength(4);
    });

    it("has sensible size limits", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
      expect(MAX_BUNDLE_SIZE).toBe(50 * 1024 * 1024); // 50MB
    });
  });
});
