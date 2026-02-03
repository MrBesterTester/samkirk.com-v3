import "server-only";

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

/** Maximum file size for resume uploads (10MB) */
export const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed file extensions for resume uploads */
export const ALLOWED_RESUME_EXTENSIONS = [".md"] as const;

/** Content type for markdown files */
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

// ============================================================================
// Validation schemas
// ============================================================================

/**
 * Schema for validating resume file metadata.
 */
export const ResumeFileMetadataSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .refine(
      (name) => name.toLowerCase().endsWith(".md"),
      "File must be a Markdown (.md) file"
    ),
  size: z
    .number()
    .positive("File size must be positive")
    .max(MAX_RESUME_FILE_SIZE, `File size must be less than 10MB`),
  contentType: z.string().optional(),
});

export type ResumeFileMetadata = z.infer<typeof ResumeFileMetadataSchema>;

// ============================================================================
// Validation functions
// ============================================================================

/**
 * Validate resume file metadata (filename, size).
 * Returns the validated metadata or throws a validation error.
 */
export function validateResumeFileMetadata(metadata: {
  filename: string;
  size: number;
  contentType?: string;
}): ResumeFileMetadata {
  return ResumeFileMetadataSchema.parse(metadata);
}

/**
 * Check if a filename has an allowed extension for resume uploads.
 */
export function isAllowedResumeExtension(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return ALLOWED_RESUME_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
}

/**
 * Check if a file size is within the allowed limit for resume uploads.
 */
export function isAllowedResumeSize(size: number): boolean {
  return size > 0 && size <= MAX_RESUME_FILE_SIZE;
}

/**
 * Validate resume file content.
 * Performs basic validation that the content is valid UTF-8 text.
 * Returns the content as a string.
 */
export function validateResumeContent(buffer: Buffer): string {
  // Convert buffer to string (UTF-8)
  const content = buffer.toString("utf-8");

  // Check for null bytes (binary content)
  if (content.includes("\0")) {
    throw new Error("File contains invalid binary content");
  }

  // Basic validation that content is non-empty
  if (content.trim().length === 0) {
    throw new Error("File is empty");
  }

  return content;
}

// ============================================================================
// Error types
// ============================================================================

export class ResumeUploadError extends Error {
  constructor(
    message: string,
    public readonly code: ResumeUploadErrorCode
  ) {
    super(message);
    this.name = "ResumeUploadError";
  }
}

export type ResumeUploadErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "INVALID_CONTENT"
  | "STORAGE_ERROR"
  | "METADATA_ERROR";

/**
 * Create a typed upload error for client responses.
 */
export function createUploadError(
  code: ResumeUploadErrorCode,
  message: string
): ResumeUploadError {
  return new ResumeUploadError(message, code);
}
