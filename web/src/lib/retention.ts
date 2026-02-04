import "server-only";

import { Timestamp } from "@google-cloud/firestore";
import {
  getFirestore,
  getSubmissionsCollection,
  type SubmissionDoc,
} from "./firestore";
import {
  getPrivateBucket,
  deletePrefix,
} from "./storage";

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of submissions to process in a single cleanup run.
 * This prevents timeout issues for Cloud Scheduler invocations.
 */
export const MAX_DELETIONS_PER_RUN = 100;

/**
 * Batch size for Firestore queries.
 */
export const QUERY_BATCH_SIZE = 100;

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a single submission deletion operation.
 */
export interface DeletionResult {
  submissionId: string;
  gcsFilesDeleted: number;
  success: boolean;
  error?: string;
}

/**
 * Summary of a retention cleanup run.
 */
export interface RetentionCleanupResult {
  /** Number of expired submissions found */
  expiredFound: number;
  /** Number of submissions successfully deleted */
  deletedCount: number;
  /** Number of submissions that failed to delete */
  failedCount: number;
  /** Details of each deletion attempt */
  details: DeletionResult[];
  /** ISO timestamp when cleanup started */
  startedAt: string;
  /** ISO timestamp when cleanup completed */
  completedAt: string;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Expired submission info extracted from Firestore query.
 */
export interface ExpiredSubmission {
  id: string;
  artifactGcsPrefix: string;
  tool: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Find all submissions that have expired (expiresAt <= now).
 * Returns submissions ordered by expiresAt (oldest first).
 *
 * @param limit - Maximum number of submissions to return (default: MAX_DELETIONS_PER_RUN)
 * @param now - Optional timestamp to use as "now" (for testing)
 */
export async function findExpiredSubmissions(
  limit: number = MAX_DELETIONS_PER_RUN,
  now?: Timestamp
): Promise<ExpiredSubmission[]> {
  const currentTime = now ?? Timestamp.now();
  const submissionsCollection = getSubmissionsCollection();

  const query = submissionsCollection
    .where("expiresAt", "<=", currentTime)
    .orderBy("expiresAt", "asc")
    .limit(limit);

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as SubmissionDoc;
    return {
      id: doc.id,
      artifactGcsPrefix: data.artifactGcsPrefix,
      tool: data.tool,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  });
}

/**
 * Check if a submission has expired based on its expiresAt timestamp.
 * Useful for validation before deletion.
 *
 * @param expiresAt - The expiration timestamp
 * @param now - Optional timestamp to use as "now" (for testing)
 */
export function isExpired(expiresAt: Timestamp, now?: Timestamp): boolean {
  const currentTime = now ?? Timestamp.now();
  return expiresAt.toMillis() <= currentTime.toMillis();
}

// ============================================================================
// Deletion Functions
// ============================================================================

/**
 * Delete a single submission's GCS artifacts.
 * Idempotent - returns 0 if no files exist.
 *
 * @param artifactGcsPrefix - The GCS prefix for this submission's artifacts
 * @returns Number of files deleted
 */
export async function deleteSubmissionArtifacts(
  artifactGcsPrefix: string
): Promise<number> {
  const bucket = getPrivateBucket();

  // Normalize the prefix to ensure it ends with /
  const normalizedPrefix = artifactGcsPrefix.endsWith("/")
    ? artifactGcsPrefix
    : `${artifactGcsPrefix}/`;

  return await deletePrefix(bucket, normalizedPrefix);
}

/**
 * Delete a single submission's Firestore document.
 * Idempotent - succeeds even if the document doesn't exist.
 *
 * @param submissionId - The submission ID to delete
 */
export async function deleteSubmissionDoc(submissionId: string): Promise<void> {
  const firestore = getFirestore();
  const docRef = firestore.collection("submissions").doc(submissionId);
  await docRef.delete();
}

/**
 * Delete a single submission: first GCS artifacts, then Firestore doc.
 * This order ensures we don't orphan GCS files if Firestore delete succeeds
 * but GCS delete fails.
 *
 * @param submission - The expired submission to delete
 * @returns Result of the deletion operation
 */
export async function deleteSubmission(
  submission: ExpiredSubmission
): Promise<DeletionResult> {
  try {
    // Step 1: Delete GCS artifacts first
    const gcsFilesDeleted = await deleteSubmissionArtifacts(
      submission.artifactGcsPrefix
    );

    // Step 2: Delete Firestore document
    await deleteSubmissionDoc(submission.id);

    return {
      submissionId: submission.id,
      gcsFilesDeleted,
      success: true,
    };
  } catch (error) {
    // Log without exposing sensitive data
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      submissionId: submission.id,
      gcsFilesDeleted: 0,
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// Main Cleanup Function
// ============================================================================

/**
 * Run the retention cleanup process.
 *
 * This function:
 * 1. Queries for expired submissions (expiresAt <= now)
 * 2. Deletes their GCS artifacts
 * 3. Deletes their Firestore documents
 *
 * The function is idempotent and safe to run on retries:
 * - Partial deletions on previous runs won't cause issues
 * - Already-deleted items are simply skipped
 *
 * @param options - Optional configuration
 * @param options.limit - Maximum submissions to process (default: MAX_DELETIONS_PER_RUN)
 * @param options.now - Optional timestamp for "now" (for testing)
 * @returns Summary of the cleanup operation
 */
export async function runRetentionCleanup(options?: {
  limit?: number;
  now?: Timestamp;
}): Promise<RetentionCleanupResult> {
  const startedAt = new Date();
  const limit = options?.limit ?? MAX_DELETIONS_PER_RUN;

  // Find expired submissions
  const expiredSubmissions = await findExpiredSubmissions(limit, options?.now);

  const results: DeletionResult[] = [];

  // Process each expired submission
  for (const submission of expiredSubmissions) {
    const result = await deleteSubmission(submission);
    results.push(result);
  }

  const completedAt = new Date();

  return {
    expiredFound: expiredSubmissions.length,
    deletedCount: results.filter((r) => r.success).length,
    failedCount: results.filter((r) => !r.success).length,
    details: results,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build a summary message for logging (no secrets).
 * Suitable for Cloud Run logs.
 */
export function buildCleanupSummary(result: RetentionCleanupResult): string {
  const parts = [
    `Retention cleanup completed`,
    `found=${result.expiredFound}`,
    `deleted=${result.deletedCount}`,
    `failed=${result.failedCount}`,
    `duration=${result.durationMs}ms`,
  ];

  if (result.failedCount > 0) {
    const failedIds = result.details
      .filter((d) => !d.success)
      .map((d) => d.submissionId)
      .join(", ");
    parts.push(`failed_ids=[${failedIds}]`);
  }

  return parts.join(" | ");
}

/**
 * Validate that a GCS prefix looks like a submission artifact prefix.
 * Used to prevent accidental deletion of non-submission data.
 */
export function isValidSubmissionPrefix(prefix: string): boolean {
  // Must start with "submissions/" and have a submission ID segment
  const pattern = /^submissions\/[A-Za-z0-9_-]+\/?$/;
  return pattern.test(prefix);
}

/**
 * Extract submission ID from a GCS prefix.
 * Returns null if the prefix is not a valid submission prefix.
 */
export function extractSubmissionIdFromPrefix(prefix: string): string | null {
  const match = prefix.match(/^submissions\/([A-Za-z0-9_-]+)\/?$/);
  return match ? match[1] : null;
}
