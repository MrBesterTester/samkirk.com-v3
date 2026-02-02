import "server-only";

import { Storage, Bucket } from "@google-cloud/storage";
import { getEnv } from "./env";

// Singleton Storage client
let storageInstance: Storage | null = null;

/**
 * Get the singleton Cloud Storage instance.
 * Uses Application Default Credentials (ADC) for authentication.
 */
export function getStorage(): Storage {
  if (!storageInstance) {
    const env = getEnv();
    storageInstance = new Storage({
      projectId: env.GCP_PROJECT_ID,
    });
  }
  return storageInstance;
}

// ============================================================================
// Bucket references
// ============================================================================

/**
 * Get the public bucket for Dance Menu assets and public files.
 */
export function getPublicBucket(): Bucket {
  return getStorage().bucket(getEnv().GCS_PUBLIC_BUCKET);
}

/**
 * Get the private bucket for resume, submissions, and artifacts.
 */
export function getPrivateBucket(): Bucket {
  return getStorage().bucket(getEnv().GCS_PRIVATE_BUCKET);
}

// ============================================================================
// Path helpers for GCS objects
// ============================================================================

/**
 * Paths for private bucket objects.
 */
export const PrivatePaths = {
  /**
   * Path to the master resume markdown file.
   */
  masterResume: () => "resume/master.md",

  /**
   * Path to the resume index JSON file.
   */
  resumeIndex: () => "resume/index/current.json",

  /**
   * Prefix for a submission's artifacts.
   */
  submissionPrefix: (submissionId: string) => `submissions/${submissionId}/`,

  /**
   * Path to a submission's input file.
   */
  submissionInput: (submissionId: string, filename: string) =>
    `submissions/${submissionId}/input/${filename}`,

  /**
   * Path to a submission's extracted data JSON.
   */
  submissionExtracted: (submissionId: string) =>
    `submissions/${submissionId}/extracted.json`,

  /**
   * Path to a submission's output file.
   */
  submissionOutput: (submissionId: string, filename: string) =>
    `submissions/${submissionId}/output/${filename}`,

  /**
   * Path to a submission's bundle zip.
   */
  submissionBundle: (submissionId: string) =>
    `submissions/${submissionId}/bundle.zip`,
} as const;

/**
 * Paths for public bucket objects.
 */
export const PublicPaths = {
  /**
   * Prefix for current Dance Menu files.
   */
  danceMenuCurrent: () => "dance-menu/current/",

  /**
   * Path to a specific Dance Menu file.
   */
  danceMenuFile: (filename: string) => `dance-menu/current/${filename}`,

  /**
   * Prefix for versioned Dance Menu files.
   */
  danceMenuVersioned: (version: string) => `dance-menu/${version}/`,
} as const;

// ============================================================================
// Storage helper functions
// ============================================================================

/**
 * Read a file from a bucket as a string.
 * @throws Error if the file doesn't exist or can't be read.
 */
export async function readFile(bucket: Bucket, path: string): Promise<string> {
  const [contents] = await bucket.file(path).download();
  return contents.toString("utf-8");
}

/**
 * Write a string to a file in a bucket.
 * @param contentType - MIME type of the content (defaults to text/plain)
 */
export async function writeFile(
  bucket: Bucket,
  path: string,
  contents: string,
  contentType: string = "text/plain; charset=utf-8"
): Promise<void> {
  await bucket.file(path).save(contents, {
    contentType,
    resumable: false,
  });
}

/**
 * Write binary data to a file in a bucket.
 */
export async function writeBuffer(
  bucket: Bucket,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await bucket.file(path).save(buffer, {
    contentType,
    resumable: false,
  });
}

/**
 * Check if a file exists in a bucket.
 */
export async function fileExists(bucket: Bucket, path: string): Promise<boolean> {
  const [exists] = await bucket.file(path).exists();
  return exists;
}

/**
 * Delete a file from a bucket.
 * @returns true if the file was deleted, false if it didn't exist.
 */
export async function deleteFile(bucket: Bucket, path: string): Promise<boolean> {
  try {
    await bucket.file(path).delete();
    return true;
  } catch (error) {
    // File didn't exist - that's fine
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: number }).code === 404
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Delete all files with a given prefix in a bucket.
 * Useful for cleaning up submission artifacts.
 */
export async function deletePrefix(bucket: Bucket, prefix: string): Promise<number> {
  const [files] = await bucket.getFiles({ prefix });
  let deleted = 0;
  for (const file of files) {
    await file.delete();
    deleted++;
  }
  return deleted;
}

/**
 * List all files with a given prefix in a bucket.
 */
export async function listFiles(
  bucket: Bucket,
  prefix: string
): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix });
  return files.map((f) => f.name);
}

/**
 * Generate a signed URL for temporary read access to a private file.
 * @param expiresInMs - How long the URL should be valid (default: 15 minutes)
 */
export async function getSignedReadUrl(
  bucket: Bucket,
  path: string,
  expiresInMs: number = 15 * 60 * 1000
): Promise<string> {
  const [url] = await bucket.file(path).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMs,
  });
  return url;
}
