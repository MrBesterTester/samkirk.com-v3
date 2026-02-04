import "server-only";

import { randomBytes } from "crypto";
import { Timestamp } from "@google-cloud/firestore";
import {
  getSubmissionRef,
  getSubmissionsCollection,
  type SubmissionDoc,
  type SubmissionTool,
  type SubmissionStatus,
} from "./firestore";

// ============================================================================
// Constants
// ============================================================================

/** Submission ID length in bytes (16 bytes = 128 bits, sufficient for uniqueness) */
export const SUBMISSION_ID_BYTES = 16;

/** Submission retention period in days */
export const SUBMISSION_RETENTION_DAYS = 90;

/** Submission retention period in milliseconds */
export const SUBMISSION_RETENTION_MS =
  SUBMISSION_RETENTION_DAYS * 24 * 60 * 60 * 1000;

// ============================================================================
// Type definitions for submission inputs
// ============================================================================

/** Input data for creating a new submission */
export interface CreateSubmissionInput {
  tool: SubmissionTool;
  sessionId: string;
  inputs?: Record<string, unknown>;
  artifactGcsPrefix?: string;
}

/** Partial update data for a submission */
export interface UpdateSubmissionInput {
  status?: SubmissionStatus;
  inputs?: Record<string, unknown>;
  extracted?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  citations?: Array<{ chunkId: string; title: string; sourceRef: string }>;
  artifactGcsPrefix?: string;
}

// ============================================================================
// Submission ID Generation
// ============================================================================

/**
 * Generate a unique submission ID.
 * Returns a URL-safe base64 string.
 */
export function generateSubmissionId(): string {
  const bytes = randomBytes(SUBMISSION_ID_BYTES);
  return bytes.toString("base64url");
}

/**
 * Validate that a submission ID has the expected format.
 * Must be a base64url string of the expected length.
 */
export function isValidSubmissionId(submissionId: string): boolean {
  // 16 bytes in base64url = 22 characters (no padding)
  if (submissionId.length !== 22) {
    return false;
  }
  // Check for valid base64url characters
  return /^[A-Za-z0-9_-]+$/.test(submissionId);
}

// ============================================================================
// Timestamp Helpers
// ============================================================================

/**
 * Create submission timestamps with 90-day retention.
 * Returns both createdAt and expiresAt as Firestore Timestamps.
 */
export function createSubmissionTimestamps(): {
  createdAt: Timestamp;
  expiresAt: Timestamp;
} {
  const now = Date.now();
  const expiresAtMs = now + SUBMISSION_RETENTION_MS;

  return {
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAtMs),
  };
}

/**
 * Create submission timestamps with a custom date (for testing).
 * @param baseDate - The date to use as "now"
 */
export function createSubmissionTimestampsFromDate(baseDate: Date): {
  createdAt: Timestamp;
  expiresAt: Timestamp;
} {
  const now = baseDate.getTime();
  const expiresAtMs = now + SUBMISSION_RETENTION_MS;

  return {
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAtMs),
  };
}

/**
 * Calculate the expiration date from a creation date.
 * Useful for validation and testing.
 */
export function calculateExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + SUBMISSION_RETENTION_MS);
}

/**
 * Check if a submission has expired based on its expiresAt timestamp.
 */
export function isSubmissionExpired(expiresAt: Timestamp): boolean {
  const now = Date.now();
  return now >= expiresAt.toMillis();
}

// ============================================================================
// GCS Artifact Path Helpers
// ============================================================================

/**
 * Build the GCS prefix path for a submission's artifacts.
 * Format: submissions/{submissionId}/
 */
export function buildArtifactGcsPrefix(submissionId: string): string {
  return `submissions/${submissionId}/`;
}

// ============================================================================
// Submission CRUD Operations
// ============================================================================

/**
 * Create a new submission in Firestore.
 *
 * @param input - The submission creation input
 * @returns The created submission document data and its ID
 */
export async function createSubmission(
  input: CreateSubmissionInput
): Promise<{ id: string; doc: SubmissionDoc }> {
  const submissionId = generateSubmissionId();
  const { createdAt, expiresAt } = createSubmissionTimestamps();

  const submissionData: SubmissionDoc = {
    createdAt,
    expiresAt,
    tool: input.tool,
    status: "in_progress",
    sessionId: input.sessionId,
    inputs: input.inputs ?? {},
    extracted: {},
    outputs: {},
    citations: [],
    artifactGcsPrefix:
      input.artifactGcsPrefix ?? buildArtifactGcsPrefix(submissionId),
  };

  const submissionRef = getSubmissionRef(submissionId);
  await submissionRef.set(submissionData);

  return { id: submissionId, doc: submissionData };
}

/**
 * Get a submission from Firestore by ID.
 *
 * @param submissionId - The submission ID
 * @returns The submission document data, or null if not found
 */
export async function getSubmission(
  submissionId: string
): Promise<SubmissionDoc | null> {
  const submissionRef = getSubmissionRef(submissionId);
  const snapshot = await submissionRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as SubmissionDoc;
}

/**
 * Update an existing submission in Firestore.
 *
 * @param submissionId - The submission ID
 * @param updates - The fields to update
 */
export async function updateSubmission(
  submissionId: string,
  updates: UpdateSubmissionInput
): Promise<void> {
  const submissionRef = getSubmissionRef(submissionId);

  // Filter out undefined values
  const cleanUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  }

  if (Object.keys(cleanUpdates).length > 0) {
    await submissionRef.update(cleanUpdates);
  }
}

/**
 * Mark a submission as complete.
 * This is a convenience method that sets status to "complete"
 * and optionally updates outputs and citations.
 *
 * @param submissionId - The submission ID
 * @param finalData - Optional final outputs and citations
 */
export async function completeSubmission(
  submissionId: string,
  finalData?: {
    outputs?: Record<string, unknown>;
    citations?: Array<{ chunkId: string; title: string; sourceRef: string }>;
    extracted?: Record<string, unknown>;
  }
): Promise<void> {
  const updates: UpdateSubmissionInput = {
    status: "complete",
    ...finalData,
  };

  await updateSubmission(submissionId, updates);
}

/**
 * Mark a submission as having an error.
 *
 * @param submissionId - The submission ID
 * @param errorInfo - Optional error information to store in outputs
 */
export async function errorSubmission(
  submissionId: string,
  errorInfo?: { errorType?: string; errorMessage?: string }
): Promise<void> {
  const updates: UpdateSubmissionInput = {
    status: "error",
  };

  if (errorInfo) {
    updates.outputs = {
      error: errorInfo,
    };
  }

  await updateSubmission(submissionId, updates);
}

/**
 * Mark a submission as blocked (e.g., by rate limit or spend cap).
 *
 * @param submissionId - The submission ID
 * @param reason - The reason for blocking
 */
export async function blockSubmission(
  submissionId: string,
  reason: "rate_limit" | "spend_cap"
): Promise<void> {
  await updateSubmission(submissionId, {
    status: "blocked",
    outputs: { blockedReason: reason },
  });
}

// ============================================================================
// Schema Validation Helpers
// ============================================================================

/** Valid submission tools */
export const VALID_TOOLS: readonly SubmissionTool[] = [
  "fit",
  "resume",
  "interview",
];

/** Valid submission statuses */
export const VALID_STATUSES: readonly SubmissionStatus[] = [
  "in_progress",
  "complete",
  "blocked",
  "error",
];

/**
 * Validate that a tool value is a valid SubmissionTool.
 */
export function isValidTool(tool: string): tool is SubmissionTool {
  return VALID_TOOLS.includes(tool as SubmissionTool);
}

/**
 * Validate that a status value is a valid SubmissionStatus.
 */
export function isValidStatus(status: string): status is SubmissionStatus {
  return VALID_STATUSES.includes(status as SubmissionStatus);
}

/**
 * Validate the structure of a citation object.
 */
export function isValidCitation(
  citation: unknown
): citation is { chunkId: string; title: string; sourceRef: string } {
  if (typeof citation !== "object" || citation === null) {
    return false;
  }

  const c = citation as Record<string, unknown>;
  return (
    typeof c.chunkId === "string" &&
    typeof c.title === "string" &&
    typeof c.sourceRef === "string"
  );
}

/**
 * Validate an array of citations.
 */
export function isValidCitationsArray(
  citations: unknown
): citations is Array<{ chunkId: string; title: string; sourceRef: string }> {
  if (!Array.isArray(citations)) {
    return false;
  }

  return citations.every(isValidCitation);
}

// ============================================================================
// Submission Query Operations
// ============================================================================

/** Options for listing submissions */
export interface ListSubmissionsOptions {
  /** Maximum number of submissions to return (default: 50, max: 100) */
  limit?: number;
  /** Filter by tool type */
  tool?: SubmissionTool;
  /** Filter by status */
  status?: SubmissionStatus;
}

/** A submission with its ID for list views */
export interface SubmissionWithId {
  id: string;
  doc: SubmissionDoc;
}

/**
 * List recent submissions from Firestore.
 * Returns submissions ordered by createdAt descending (newest first).
 *
 * @param options - Query options for filtering and limiting
 * @returns Array of submissions with their IDs
 */
export async function listSubmissions(
  options: ListSubmissionsOptions = {}
): Promise<SubmissionWithId[]> {
  const { limit = 50, tool, status } = options;

  // Cap the limit to prevent excessive reads
  const cappedLimit = Math.min(limit, 100);

  const collection = getSubmissionsCollection();
  let query = collection.orderBy("createdAt", "desc");

  // Apply optional filters
  if (tool) {
    query = query.where("tool", "==", tool);
  }
  if (status) {
    query = query.where("status", "==", status);
  }

  query = query.limit(cappedLimit);

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    doc: doc.data() as SubmissionDoc,
  }));
}

/**
 * Get submission counts by tool type.
 * Useful for dashboard statistics.
 *
 * Note: This performs a full collection scan, so use sparingly.
 */
export async function getSubmissionCountsByTool(): Promise<
  Record<SubmissionTool, number>
> {
  const collection = getSubmissionsCollection();
  const snapshot = await collection.get();

  const counts: Record<SubmissionTool, number> = {
    fit: 0,
    resume: 0,
    interview: 0,
  };

  for (const doc of snapshot.docs) {
    const data = doc.data() as SubmissionDoc;
    if (data.tool in counts) {
      counts[data.tool]++;
    }
  }

  return counts;
}
