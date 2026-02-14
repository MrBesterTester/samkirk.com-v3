import "server-only";

import archiver from "archiver";
import { PassThrough, Readable } from "stream";
import type { Bucket } from "@google-cloud/storage";
import { getPrivateBucket, PrivatePaths, writeBuffer } from "./storage";
import { getSubmission } from "./submission";
import type { SubmissionDoc } from "./firestore";
import { renderMarkdown, renderCitationsMarkdown, renderCitationsHtml, wrapInDocument, type Citation } from "./markdown-renderer";

// ============================================================================
// Types
// ============================================================================

/**
 * A file to include in the artifact bundle.
 */
export interface BundleFile {
  /** Path within the zip (e.g., "inputs/job.txt") */
  path: string;
  /** File content as string or buffer */
  content: string | Buffer;
  /** Optional content type (for metadata) */
  contentType?: string;
}

/**
 * Result of building a bundle.
 */
export interface BundleResult {
  /** The generated zip buffer */
  buffer: Buffer;
  /** Total size in bytes */
  size: number;
  /** Number of files in the bundle */
  fileCount: number;
  /** List of file paths in the bundle */
  filePaths: string[];
}

/**
 * Options for building a submission bundle.
 */
export interface BuildSubmissionBundleOptions {
  /** Whether to include inputs in the bundle. Defaults to true. */
  includeInputs?: boolean;
  /** Whether to include extracted data in the bundle. Defaults to true. */
  includeExtracted?: boolean;
  /** Whether to include outputs in the bundle. Defaults to true. */
  includeOutputs?: boolean;
  /** Whether to include citations in the bundle. Defaults to true. */
  includeCitations?: boolean;
  /** Whether to render markdown outputs to HTML. Defaults to true. */
  renderHtml?: boolean;
}

// ============================================================================
// Core Bundler Functions
// ============================================================================

/**
 * Create a zip bundle from an array of files.
 *
 * @param files - Array of files to include in the bundle
 * @returns Promise resolving to the bundle result
 */
export async function createBundle(files: BundleFile[]): Promise<BundleResult> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const filePaths: string[] = [];

    // Create archiver instance
    const archive = archiver("zip", {
      zlib: { level: 6 }, // Balanced compression
    });

    // Create a passthrough stream to collect the output
    const output = new PassThrough();

    // Collect output chunks from the passthrough
    output.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    output.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve({
        buffer,
        size: buffer.length,
        fileCount: filePaths.length,
        filePaths,
      });
    });

    archive.on("error", (err) => {
      reject(new Error(`Archive error: ${err.message}`));
    });

    archive.on("warning", (err) => {
      // Log warnings but don't fail
      console.warn("Archive warning:", err.message);
    });

    // Pipe archive to the output stream
    archive.pipe(output);

    // Add files to archive
    for (const file of files) {
      const content =
        typeof file.content === "string"
          ? Buffer.from(file.content, "utf-8")
          : file.content;
      archive.append(content, { name: file.path });
      filePaths.push(file.path);
    }

    // Finalize the archive - this triggers the end event after all data is written
    archive.finalize();
  });
}

/**
 * Stream a zip bundle directly (for large bundles).
 *
 * @param files - Array of files to include in the bundle
 * @returns Readable stream of the zip content
 */
export function createBundleStream(files: BundleFile[]): Readable {
  const passThrough = new PassThrough();

  const archive = archiver("zip", {
    zlib: { level: 6 },
  });

  archive.on("error", (err) => {
    passThrough.destroy(new Error(`Archive error: ${err.message}`));
  });

  // Pipe archive to passthrough
  archive.pipe(passThrough);

  // Add files to archive
  for (const file of files) {
    const content =
      typeof file.content === "string"
        ? Buffer.from(file.content, "utf-8")
        : file.content;
    archive.append(content, { name: file.path });
  }

  // Finalize the archive (async operation)
  archive.finalize();

  return passThrough;
}

// ============================================================================
// Submission Bundle Building
// ============================================================================

/**
 * Build a list of files for a submission bundle.
 * This function determines what files should be included based on the submission data.
 *
 * @param submission - The submission document
 * @param submissionId - The submission ID
 * @param options - Bundle options
 * @returns Array of bundle files
 */
export async function buildSubmissionFileList(
  submission: SubmissionDoc,
  submissionId: string,
  options: BuildSubmissionBundleOptions = {}
): Promise<BundleFile[]> {
  const {
    includeInputs = true,
    includeExtracted = true,
    includeOutputs = true,
    includeCitations = true,
    renderHtml = true,
  } = options;

  const files: BundleFile[] = [];
  const bucket = getPrivateBucket();

  // Add metadata file
  const metadata = {
    submissionId,
    tool: submission.tool,
    createdAt: submission.createdAt.toDate().toISOString(),
    expiresAt: submission.expiresAt.toDate().toISOString(),
    status: submission.status,
  };
  files.push({
    path: "metadata.json",
    content: JSON.stringify(metadata, null, 2),
    contentType: "application/json",
  });

  // Add inputs
  if (includeInputs && Object.keys(submission.inputs).length > 0) {
    files.push({
      path: "inputs/inputs.json",
      content: JSON.stringify(submission.inputs, null, 2),
      contentType: "application/json",
    });

    // Try to load input files from GCS
    const inputFiles = await loadInputFilesFromGcs(bucket, submissionId);
    for (const inputFile of inputFiles) {
      files.push(inputFile);
    }
  }

  // Add extracted data
  if (includeExtracted && Object.keys(submission.extracted).length > 0) {
    files.push({
      path: "extracted/extracted.json",
      content: JSON.stringify(submission.extracted, null, 2),
      contentType: "application/json",
    });
  }

  // Add outputs
  if (includeOutputs && Object.keys(submission.outputs).length > 0) {
    files.push({
      path: "outputs/outputs.json",
      content: JSON.stringify(submission.outputs, null, 2),
      contentType: "application/json",
    });

    // Try to load output files from GCS
    const outputFiles = await loadOutputFilesFromGcs(
      bucket,
      submissionId,
      renderHtml
    );
    for (const outputFile of outputFiles) {
      files.push(outputFile);
    }
  }

  // Add citations
  if (includeCitations && submission.citations.length > 0) {
    const citationsJson = JSON.stringify(submission.citations, null, 2);
    files.push({
      path: "citations/citations.json",
      content: citationsJson,
      contentType: "application/json",
    });

    // Also add a human-readable markdown version
    const citationsMd = renderCitationsMarkdown(
      submission.citations as Citation[]
    );
    if (citationsMd) {
      files.push({
        path: "citations/citations.md",
        content: citationsMd.trim(),
        contentType: "text/markdown",
      });
    }

    // Also add an HTML version
    const citationsHtmlContent = renderCitationsHtml(
      submission.citations as Citation[]
    );
    if (citationsHtmlContent) {
      files.push({
        path: "citations/citations.html",
        content: wrapInDocument(citationsHtmlContent, "Citations"),
        contentType: "text/html",
      });
    }
  }

  return files;
}

/**
 * Load input files from GCS for a submission.
 */
async function loadInputFilesFromGcs(
  bucket: Bucket,
  submissionId: string
): Promise<BundleFile[]> {
  const files: BundleFile[] = [];

  try {
    const prefix = PrivatePaths.submissionPrefix(submissionId) + "input/";
    const [gcsFiles] = await bucket.getFiles({ prefix });

    for (const gcsFile of gcsFiles) {
      const [content] = await gcsFile.download();
      const filename = gcsFile.name.replace(prefix, "");
      files.push({
        path: `inputs/${filename}`,
        content,
        contentType: gcsFile.metadata.contentType as string | undefined,
      });
    }
  } catch {
    // Input files may not exist, which is fine
  }

  return files;
}

/**
 * Load output files from GCS for a submission.
 * Optionally renders markdown files to HTML.
 */
async function loadOutputFilesFromGcs(
  bucket: Bucket,
  submissionId: string,
  renderHtmlOutputs: boolean
): Promise<BundleFile[]> {
  const files: BundleFile[] = [];

  try {
    const prefix = PrivatePaths.submissionPrefix(submissionId) + "output/";
    const [gcsFiles] = await bucket.getFiles({ prefix });

    for (const gcsFile of gcsFiles) {
      const [content] = await gcsFile.download();
      const filename = gcsFile.name.replace(prefix, "");

      files.push({
        path: `outputs/${filename}`,
        content,
        contentType: gcsFile.metadata.contentType as string | undefined,
      });

      // If it's a markdown file and we should render HTML
      if (
        renderHtmlOutputs &&
        filename.endsWith(".md") &&
        !gcsFiles.some((f) => f.name.endsWith(filename.replace(".md", ".html")))
      ) {
        const markdownContent = content.toString("utf-8");
        const htmlContent = renderMarkdown(markdownContent, {
          fullDocument: true,
          title: filename.replace(".md", ""),
        });
        files.push({
          path: `outputs/${filename.replace(".md", ".html")}`,
          content: htmlContent,
          contentType: "text/html",
        });
      }
    }
  } catch {
    // Output files may not exist, which is fine
  }

  return files;
}

/**
 * Build and return a complete submission bundle.
 *
 * @param submissionId - The submission ID
 * @param options - Bundle options
 * @returns Promise resolving to the bundle result
 * @throws Error if submission not found
 */
export async function buildSubmissionBundle(
  submissionId: string,
  options: BuildSubmissionBundleOptions = {}
): Promise<BundleResult> {
  const submission = await getSubmission(submissionId);

  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  const files = await buildSubmissionFileList(submission, submissionId, options);
  return createBundle(files);
}

/**
 * Build a submission bundle and save it to GCS.
 *
 * @param submissionId - The submission ID
 * @param options - Bundle options
 * @returns Promise resolving to the GCS path of the saved bundle
 * @throws Error if submission not found
 */
export async function buildAndSaveSubmissionBundle(
  submissionId: string,
  options: BuildSubmissionBundleOptions = {}
): Promise<{ gcsPath: string; bundleResult: BundleResult }> {
  const bundle = await buildSubmissionBundle(submissionId, options);
  const bucket = getPrivateBucket();
  const gcsPath = PrivatePaths.submissionBundle(submissionId);

  await writeBuffer(bucket, gcsPath, bundle.buffer, "application/zip");

  return { gcsPath, bundleResult: bundle };
}

// ============================================================================
// File List Utilities (for testing/inspection)
// ============================================================================

/**
 * Generate the expected file list for a submission bundle without creating it.
 * Useful for testing and validation.
 *
 * @param submission - The submission document
 * @param hasInputFiles - Whether there are input files in GCS
 * @param hasOutputFiles - Whether there are output files in GCS
 * @param options - Bundle options
 * @returns Array of expected file paths
 */
export function getExpectedBundleFiles(
  submission: {
    inputs: Record<string, unknown>;
    extracted: Record<string, unknown>;
    outputs: Record<string, unknown>;
    citations: unknown[];
  },
  hasInputFiles: boolean = false,
  hasOutputFiles: boolean = false,
  options: BuildSubmissionBundleOptions = {}
): string[] {
  const {
    includeInputs = true,
    includeExtracted = true,
    includeOutputs = true,
    includeCitations = true,
  } = options;

  const files: string[] = ["metadata.json"];

  if (includeInputs && Object.keys(submission.inputs).length > 0) {
    files.push("inputs/inputs.json");
    if (hasInputFiles) {
      files.push("inputs/..."); // Placeholder for GCS files
    }
  }

  if (includeExtracted && Object.keys(submission.extracted).length > 0) {
    files.push("extracted/extracted.json");
  }

  if (includeOutputs && Object.keys(submission.outputs).length > 0) {
    files.push("outputs/outputs.json");
    if (hasOutputFiles) {
      files.push("outputs/..."); // Placeholder for GCS files
    }
  }

  if (includeCitations && submission.citations.length > 0) {
    files.push("citations/citations.json");
    files.push("citations/citations.md");
    files.push("citations/citations.html");
  }

  return files;
}

/**
 * Validate that a bundle contains the minimum required files.
 *
 * @param filePaths - Array of file paths in the bundle
 * @returns Validation result with any missing files
 */
export function validateBundleFiles(filePaths: string[]): {
  valid: boolean;
  missing: string[];
  hasMetadata: boolean;
} {
  const required = ["metadata.json"];
  const missing = required.filter((r) => !filePaths.includes(r));

  return {
    valid: missing.length === 0,
    missing,
    hasMetadata: filePaths.includes("metadata.json"),
  };
}
