import "server-only";

import { z } from "zod";

// Note: pdf-parse and mammoth are imported dynamically to avoid ESM/CJS interop issues
// with Next.js turbopack. See extractTextFromPdf and extractTextFromDocx.

// ============================================================================
// Constants
// ============================================================================

/** Maximum file size for job uploads (10MB) */
export const MAX_JOB_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed file extensions for job uploads */
export const ALLOWED_JOB_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".md",
] as const;
export type AllowedJobExtension = (typeof ALLOWED_JOB_EXTENSIONS)[number];

/** MIME types for each extension */
export const JOB_MIME_TYPES: Record<AllowedJobExtension, string[]> = {
  ".pdf": ["application/pdf"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".txt": ["text/plain"],
  ".md": ["text/markdown", "text/plain"],
};

/** URL fetch timeout in milliseconds */
export const URL_FETCH_TIMEOUT = 15000;

/** Maximum URL content length (5MB for fetched content) */
export const MAX_URL_CONTENT_LENGTH = 5 * 1024 * 1024;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for job ingestion operations.
 */
export type JobIngestionErrorCode =
  | "INVALID_INPUT"
  | "EMPTY_INPUT"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "EXTRACTION_FAILED"
  | "URL_FETCH_FAILED"
  | "URL_BLOCKED"
  | "URL_TIMEOUT"
  | "URL_CONTENT_TOO_LARGE"
  | "INVALID_URL";

/**
 * Custom error class for job ingestion errors.
 */
export class JobIngestionError extends Error {
  constructor(
    public readonly code: JobIngestionErrorCode,
    message: string,
    public readonly shouldPromptPaste: boolean = false
  ) {
    super(message);
    this.name = "JobIngestionError";
  }

  /**
   * Convert to a plain object for API responses.
   */
  toJSON(): {
    name: string;
    code: JobIngestionErrorCode;
    message: string;
    shouldPromptPaste: boolean;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      shouldPromptPaste: this.shouldPromptPaste,
    };
  }
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input mode for job ingestion.
 */
export type JobInputMode = "paste" | "url" | "file";

/**
 * Result of successful job ingestion.
 */
export interface JobIngestionResult {
  /** Normalized job text */
  text: string;
  /** Source of the input */
  source: JobInputMode;
  /** Original source identifier (URL, filename, or "pasted text") */
  sourceIdentifier: string;
  /** Length of extracted text */
  characterCount: number;
  /** Word count estimate */
  wordCount: number;
}

/**
 * File metadata for validation.
 */
export interface JobFileMetadata {
  filename: string;
  size: number;
  contentType?: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Schema for validating pasted text input.
 */
export const PastedTextSchema = z
  .string()
  .min(1, "Job text cannot be empty")
  .max(500000, "Job text is too long (max 500,000 characters)")
  .transform((text) => normalizeText(text));

/**
 * Schema for validating URL input.
 */
export const JobUrlSchema = z
  .string()
  .url("Please provide a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "URL must use http or https protocol" }
  );

/**
 * Schema for validating file metadata.
 */
export const JobFileMetadataSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .refine(
      (name) => {
        const ext = getFileExtension(name);
        return isAllowedExtension(ext);
      },
      {
        message: `File must be one of: ${ALLOWED_JOB_EXTENSIONS.join(", ")}`,
      }
    ),
  size: z
    .number()
    .positive("File size must be positive")
    .max(MAX_JOB_FILE_SIZE, "File size must be less than 10MB"),
  contentType: z.string().optional(),
});

// ============================================================================
// Utility Functions
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
export function isAllowedExtension(ext: string): ext is AllowedJobExtension {
  return (ALLOWED_JOB_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Normalize text content.
 * - Trims whitespace
 * - Normalizes line endings to \n
 * - Collapses multiple spaces to single space
 * - Collapses multiple blank lines to double newlines
 * - Removes null bytes and other control characters
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  return (
    text
      // Remove null bytes and problematic control characters (keep tabs and newlines)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize line endings to \n
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Collapse multiple spaces (not newlines or tabs) to single space
      .replace(/ {2,}/g, " ")
      // Trim leading/trailing spaces from each line
      .replace(/^ +/gm, "")
      .replace(/ +$/gm, "")
      // Collapse multiple blank lines to double newlines
      .replace(/\n{3,}/g, "\n\n")
      // Trim
      .trim()
  );
}

/**
 * Count words in text.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  // Split on whitespace and filter out empty strings
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Create a JobIngestionResult from extracted text.
 */
export function createIngestionResult(
  text: string,
  source: JobInputMode,
  sourceIdentifier: string
): JobIngestionResult {
  const normalizedText = normalizeText(text);
  return {
    text: normalizedText,
    source,
    sourceIdentifier,
    characterCount: normalizedText.length,
    wordCount: countWords(normalizedText),
  };
}

// ============================================================================
// Text Ingestion (Paste)
// ============================================================================

/**
 * Ingest job text from pasted content.
 *
 * @param text - Raw pasted text
 * @returns Normalized job ingestion result
 * @throws JobIngestionError if validation fails
 */
export function ingestFromPaste(text: string): JobIngestionResult {
  if (!text || text.trim().length === 0) {
    throw new JobIngestionError("EMPTY_INPUT", "Please paste job text");
  }

  const parseResult = PastedTextSchema.safeParse(text);
  if (!parseResult.success) {
    throw new JobIngestionError(
      "INVALID_INPUT",
      parseResult.error.issues[0]?.message || "Invalid input"
    );
  }

  return createIngestionResult(parseResult.data, "paste", "pasted text");
}

// ============================================================================
// URL Ingestion
// ============================================================================

/**
 * Fetch and extract job text from a URL.
 *
 * @param url - URL to fetch
 * @returns Job ingestion result or throws with shouldPromptPaste=true on failure
 * @throws JobIngestionError on any fetch/extraction failure
 */
export async function ingestFromUrl(url: string): Promise<JobIngestionResult> {
  // Validate URL format
  const urlParseResult = JobUrlSchema.safeParse(url);
  if (!urlParseResult.success) {
    throw new JobIngestionError(
      "INVALID_URL",
      urlParseResult.error.issues[0]?.message || "Invalid URL",
      true
    );
  }

  const validatedUrl = urlParseResult.data;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT);

    let response: Response;
    try {
      response = await fetch(validatedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SamKirkBot/1.0; +https://samkirk.com)",
          Accept: "text/html,application/xhtml+xml,text/plain,*/*",
        },
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Check response status
    if (!response.ok) {
      throw new JobIngestionError(
        "URL_FETCH_FAILED",
        `Failed to fetch URL (status ${response.status}). Please paste the job text instead.`,
        true
      );
    }

    // Check content length if header is present
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_URL_CONTENT_LENGTH) {
      throw new JobIngestionError(
        "URL_CONTENT_TOO_LARGE",
        "The page content is too large. Please paste the job text instead.",
        true
      );
    }

    // Read response text
    const htmlContent = await response.text();

    // Check actual content length
    if (htmlContent.length > MAX_URL_CONTENT_LENGTH) {
      throw new JobIngestionError(
        "URL_CONTENT_TOO_LARGE",
        "The page content is too large. Please paste the job text instead.",
        true
      );
    }

    // Extract text from HTML
    const extractedText = extractTextFromHtml(htmlContent);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new JobIngestionError(
        "EXTRACTION_FAILED",
        "Could not extract job text from the page. Please paste the job text instead.",
        true
      );
    }

    return createIngestionResult(extractedText, "url", validatedUrl);
  } catch (error) {
    // Handle abort (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      throw new JobIngestionError(
        "URL_TIMEOUT",
        "Request timed out. Please paste the job text instead.",
        true
      );
    }

    // Re-throw JobIngestionError
    if (error instanceof JobIngestionError) {
      throw error;
    }

    // Generic fetch error
    throw new JobIngestionError(
      "URL_FETCH_FAILED",
      "Failed to fetch the URL. Please paste the job text instead.",
      true
    );
  }
}

/**
 * Extract readable text from HTML content.
 * Removes scripts, styles, and HTML tags, then normalizes whitespace.
 */
export function extractTextFromHtml(html: string): string {
  if (!html) return "";

  let text = html;

  // Remove script and style elements completely
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Replace block-level tags with newlines
  text = text.replace(
    /<\/?(?:p|div|br|hr|h[1-6]|li|tr|td|th|article|section|header|footer|nav|aside|main|blockquote|pre|ul|ol)[^>]*>/gi,
    "\n"
  );

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = decodeHtmlEntities(text);

  // Normalize whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n[ \t]+/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Decode common HTML entities.
 */
export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&nbsp;": " ",
    "&ndash;": "–",
    "&mdash;": "—",
    "&bull;": "•",
    "&hellip;": "…",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, "gi"), char);
  }

  // Decode numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code))
  );
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  return result;
}

// ============================================================================
// File Ingestion
// ============================================================================

/**
 * Validate file metadata for job uploads.
 *
 * @param metadata - File metadata to validate
 * @returns Validated extension
 * @throws JobIngestionError if validation fails
 */
export function validateJobFileMetadata(
  metadata: JobFileMetadata
): AllowedJobExtension {
  const parseResult = JobFileMetadataSchema.safeParse(metadata);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.issues[0]?.message || "Invalid file";

    // Determine error code
    let code: JobIngestionErrorCode = "INVALID_INPUT";
    if (errorMessage.includes("10MB")) {
      code = "FILE_TOO_LARGE";
    } else if (errorMessage.includes("must be one of")) {
      code = "INVALID_FILE_TYPE";
    }

    throw new JobIngestionError(code, errorMessage);
  }

  const ext = getFileExtension(metadata.filename);
  if (!isAllowedExtension(ext)) {
    throw new JobIngestionError(
      "INVALID_FILE_TYPE",
      `File must be one of: ${ALLOWED_JOB_EXTENSIONS.join(", ")}`
    );
  }

  return ext;
}

/**
 * Extract text from a file buffer based on its extension.
 *
 * @param buffer - File content as Buffer
 * @param extension - File extension
 * @param filename - Original filename (for error messages)
 * @returns Extracted text
 * @throws JobIngestionError if extraction fails
 */
export async function extractTextFromFile(
  buffer: Buffer,
  extension: AllowedJobExtension,
  filename: string
): Promise<string> {
  try {
    switch (extension) {
      case ".txt":
      case ".md":
        return extractTextFromTextFile(buffer, filename);
      case ".pdf":
        return await extractTextFromPdf(buffer, filename);
      case ".docx":
        return await extractTextFromDocx(buffer, filename);
      default:
        throw new JobIngestionError(
          "INVALID_FILE_TYPE",
          `Unsupported file type: ${extension}`
        );
    }
  } catch (error) {
    if (error instanceof JobIngestionError) {
      throw error;
    }
    throw new JobIngestionError(
      "EXTRACTION_FAILED",
      `Failed to extract text from "${filename}": ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from a plain text or markdown file.
 */
export function extractTextFromTextFile(buffer: Buffer, filename: string): string {
  // Check for null bytes (binary content)
  const hasNullBytes = buffer.includes(0);
  if (hasNullBytes) {
    throw new JobIngestionError(
      "INVALID_INPUT",
      `File "${filename}" appears to be a binary file, not text`
    );
  }

  const text = buffer.toString("utf-8");

  if (!text || text.trim().length === 0) {
    throw new JobIngestionError("EMPTY_INPUT", `File "${filename}" is empty`);
  }

  return text;
}

/**
 * Extract text from a PDF file.
 */
export async function extractTextFromPdf(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // Validate PDF header
  const header = buffer.slice(0, 5).toString("ascii");
  if (!header.startsWith("%PDF")) {
    throw new JobIngestionError(
      "INVALID_INPUT",
      `File "${filename}" does not appear to be a valid PDF`
    );
  }

  try {
    // Dynamic import to avoid ESM/CJS interop issues with Next.js turbopack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfModule = (await import("pdf-parse")) as any;
    const pdfParse = pdfModule.default || pdfModule;
    const data = await pdfParse(buffer) as { text: string };
    const text = data.text;

    if (!text || text.trim().length === 0) {
      throw new JobIngestionError(
        "EXTRACTION_FAILED",
        `Could not extract text from PDF "${filename}". The PDF may be scanned or image-based.`
      );
    }

    return text;
  } catch (error) {
    if (error instanceof JobIngestionError) {
      throw error;
    }
    throw new JobIngestionError(
      "EXTRACTION_FAILED",
      `Failed to parse PDF "${filename}": ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract text from a DOCX file.
 */
export async function extractTextFromDocx(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // DOCX files are ZIP archives starting with "PK"
  const header = buffer.slice(0, 2).toString("ascii");
  if (header !== "PK") {
    throw new JobIngestionError(
      "INVALID_INPUT",
      `File "${filename}" does not appear to be a valid DOCX file`
    );
  }

  try {
    // Dynamic import to avoid ESM/CJS interop issues with Next.js turbopack
    const mammoth = await import("mammoth").then((m) => m.default || m);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    if (!text || text.trim().length === 0) {
      throw new JobIngestionError(
        "EXTRACTION_FAILED",
        `Could not extract text from DOCX "${filename}". The document may be empty or corrupted.`
      );
    }

    return text;
  } catch (error) {
    if (error instanceof JobIngestionError) {
      throw error;
    }
    throw new JobIngestionError(
      "EXTRACTION_FAILED",
      `Failed to parse DOCX "${filename}": ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Ingest job text from an uploaded file.
 *
 * @param buffer - File content as Buffer
 * @param metadata - File metadata
 * @returns Job ingestion result
 * @throws JobIngestionError if validation or extraction fails
 */
export async function ingestFromFile(
  buffer: Buffer,
  metadata: JobFileMetadata
): Promise<JobIngestionResult> {
  // Validate metadata
  const extension = validateJobFileMetadata(metadata);

  // Extract text
  const text = await extractTextFromFile(buffer, extension, metadata.filename);

  return createIngestionResult(text, "file", metadata.filename);
}

// ============================================================================
// Unified Ingestion Interface
// ============================================================================

/**
 * Input for unified job ingestion.
 */
export type JobInput =
  | { mode: "paste"; text: string }
  | { mode: "url"; url: string }
  | { mode: "file"; buffer: Buffer; metadata: JobFileMetadata };

/**
 * Ingest job text from any supported input mode.
 *
 * @param input - Input configuration
 * @returns Job ingestion result
 * @throws JobIngestionError on any failure
 */
export async function ingestJob(input: JobInput): Promise<JobIngestionResult> {
  switch (input.mode) {
    case "paste":
      return ingestFromPaste(input.text);
    case "url":
      return await ingestFromUrl(input.url);
    case "file":
      return await ingestFromFile(input.buffer, input.metadata);
    default:
      throw new JobIngestionError("INVALID_INPUT", "Unknown input mode");
  }
}
