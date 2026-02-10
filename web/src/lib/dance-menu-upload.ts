import "server-only";

/**
 * Dance Menu bundle upload validation and utilities.
 *
 * A valid bundle must contain:
 * - At least one .txt file
 * - At least one .html file
 * - Optionally, a .md file
 * - Optionally, a .pdf file
 *
 * All files are stored under dance-menu/current/ in the public bucket.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Allowed file extensions for dance menu bundles.
 */
export const ALLOWED_EXTENSIONS = [".md", ".txt", ".html", ".pdf"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

/**
 * Required file extensions that must be present in a valid bundle.
 */
export const REQUIRED_EXTENSIONS: AllowedExtension[] = [".txt", ".html"];

/**
 * Maximum file size per file (10MB).
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum total bundle size (50MB).
 */
export const MAX_BUNDLE_SIZE = 50 * 1024 * 1024;

/**
 * MIME types for each extension.
 */
export const MIME_TYPES: Record<AllowedExtension, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".pdf": "application/pdf",
};

/**
 * Standardized file names for the dance menu files.
 */
export const STANDARD_FILENAMES: Record<AllowedExtension, string> = {
  ".md": "sams-dance-menu.md",
  ".txt": "sams-dance-menu.txt",
  ".html": "sams-dance-menu.html",
  ".pdf": "sams-dance-menu.pdf",
};

/**
 * Represents a file in the dance menu bundle.
 */
export interface DanceMenuFile {
  /** Original file name */
  originalName: string;
  /** File extension (lowercase, including dot) */
  extension: AllowedExtension;
  /** File size in bytes */
  size: number;
  /** File content as Buffer */
  content: Buffer;
  /** MIME type */
  mimeType: string;
  /** Standardized filename for storage */
  storageFilename: string;
}

/**
 * Validated dance menu bundle ready for upload.
 */
export interface ValidatedBundle {
  files: DanceMenuFile[];
  totalSize: number;
  hasMarkdown: boolean;
  hasText: boolean;
  hasHtml: boolean;
  hasPdf: boolean;
}

// ============================================================================
// Error handling
// ============================================================================

/**
 * Error codes for dance menu upload validation.
 */
export type DanceMenuUploadErrorCode =
  | "MISSING_FILES"
  | "MISSING_REQUIRED_EXTENSION"
  | "INVALID_EXTENSION"
  | "FILE_TOO_LARGE"
  | "BUNDLE_TOO_LARGE"
  | "DUPLICATE_EXTENSION"
  | "EMPTY_FILE"
  | "INVALID_CONTENT";

/**
 * Custom error class for dance menu upload validation errors.
 */
export class DanceMenuUploadError extends Error {
  constructor(
    public readonly code: DanceMenuUploadErrorCode,
    message: string
  ) {
    super(message);
    this.name = "DanceMenuUploadError";
  }
}

// ============================================================================
// Validation functions
// ============================================================================

/**
 * Get the lowercase extension from a filename.
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return "";
  }
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Check if an extension is allowed.
 */
export function isAllowedExtension(ext: string): ext is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Validate a single file's metadata.
 */
export function validateFileMetadata(file: {
  filename: string;
  size: number;
}): AllowedExtension {
  const ext = getFileExtension(file.filename);

  if (!ext) {
    throw new DanceMenuUploadError(
      "INVALID_EXTENSION",
      `File "${file.filename}" has no extension`
    );
  }

  if (!isAllowedExtension(ext)) {
    throw new DanceMenuUploadError(
      "INVALID_EXTENSION",
      `File "${file.filename}" has invalid extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  if (file.size === 0) {
    throw new DanceMenuUploadError(
      "EMPTY_FILE",
      `File "${file.filename}" is empty`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new DanceMenuUploadError(
      "FILE_TOO_LARGE",
      `File "${file.filename}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  return ext;
}

/**
 * Validate file content (basic checks).
 * For text files, ensures content is valid UTF-8.
 * For PDF files, checks for PDF header.
 */
export function validateFileContent(
  content: Buffer,
  extension: AllowedExtension,
  filename: string
): void {
  if (extension === ".pdf") {
    // PDF files should start with %PDF
    const header = content.slice(0, 4).toString("ascii");
    if (!header.startsWith("%PDF")) {
      throw new DanceMenuUploadError(
        "INVALID_CONTENT",
        `File "${filename}" does not appear to be a valid PDF file`
      );
    }
  } else {
    // Text files should be valid UTF-8
    try {
      content.toString("utf-8");
    } catch {
      throw new DanceMenuUploadError(
        "INVALID_CONTENT",
        `File "${filename}" is not valid UTF-8 text`
      );
    }
  }
}

/**
 * Validate and process a bundle of files.
 *
 * @param files - Array of files with filename, size, and content
 * @returns Validated bundle ready for upload
 * @throws DanceMenuUploadError if validation fails
 */
export function validateBundle(
  files: Array<{
    filename: string;
    size: number;
    content: Buffer;
  }>
): ValidatedBundle {
  if (!files || files.length === 0) {
    throw new DanceMenuUploadError("MISSING_FILES", "No files provided");
  }

  // Track which extensions we've seen
  const seenExtensions = new Set<AllowedExtension>();
  const processedFiles: DanceMenuFile[] = [];
  let totalSize = 0;

  for (const file of files) {
    // Validate metadata
    const ext = validateFileMetadata(file);

    // Check for duplicates
    if (seenExtensions.has(ext)) {
      throw new DanceMenuUploadError(
        "DUPLICATE_EXTENSION",
        `Multiple files with extension "${ext}" provided. Only one file per extension is allowed.`
      );
    }
    seenExtensions.add(ext);

    // Validate content
    validateFileContent(file.content, ext, file.filename);

    // Track total size
    totalSize += file.size;
    if (totalSize > MAX_BUNDLE_SIZE) {
      throw new DanceMenuUploadError(
        "BUNDLE_TOO_LARGE",
        `Total bundle size exceeds maximum of ${MAX_BUNDLE_SIZE / 1024 / 1024}MB`
      );
    }

    // Add to processed files
    processedFiles.push({
      originalName: file.filename,
      extension: ext,
      size: file.size,
      content: file.content,
      mimeType: MIME_TYPES[ext],
      storageFilename: STANDARD_FILENAMES[ext],
    });
  }

  // Check required extensions are present
  for (const required of REQUIRED_EXTENSIONS) {
    if (!seenExtensions.has(required)) {
      throw new DanceMenuUploadError(
        "MISSING_REQUIRED_EXTENSION",
        `Missing required file with extension "${required}". Required: ${REQUIRED_EXTENSIONS.join(", ")}`
      );
    }
  }

  return {
    files: processedFiles,
    totalSize,
    hasMarkdown: seenExtensions.has(".md"),
    hasText: seenExtensions.has(".txt"),
    hasHtml: seenExtensions.has(".html"),
    hasPdf: seenExtensions.has(".pdf"),
  };
}

/**
 * Get the display name for a dance menu format.
 */
export function getFormatDisplayName(ext: AllowedExtension): string {
  switch (ext) {
    case ".md":
      return "Markdown";
    case ".txt":
      return "Plain Text";
    case ".html":
      return "HTML";
    case ".pdf":
      return "PDF";
  }
}
