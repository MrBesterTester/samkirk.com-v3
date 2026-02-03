import "server-only";

import { Firestore, Timestamp } from "@google-cloud/firestore";
import { getEnv } from "./env";

// Singleton Firestore client
let firestoreInstance: Firestore | null = null;

/**
 * Get the singleton Firestore instance.
 * Uses Application Default Credentials (ADC) for authentication.
 */
export function getFirestore(): Firestore {
  if (!firestoreInstance) {
    const env = getEnv();
    firestoreInstance = new Firestore({
      projectId: env.GCP_PROJECT_ID,
    });
  }
  return firestoreInstance;
}

// ============================================================================
// Collection names (centralized for consistency)
// ============================================================================

export const Collections = {
  SESSIONS: "sessions",
  RATE_LIMITS: "rateLimits",
  SPEND_MONTHLY: "spendMonthly",
  RESUME_INDEX: "resumeIndex",
  RESUME_CHUNKS: "resumeChunks",
  SUBMISSIONS: "submissions",
} as const;

// ============================================================================
// Type definitions for Firestore documents
// ============================================================================

export interface SessionDoc {
  createdAt: Timestamp;
  expiresAt: Timestamp;
  captchaPassedAt?: Timestamp;
  ipHash?: string;
}

export interface RateLimitDoc {
  windowStart: Timestamp;
  count: number;
  expiresAt: Timestamp;
}

export interface SpendMonthlyDoc {
  usdBudget: number;
  usdUsedEstimated: number;
  updatedAt: Timestamp;
}

export interface ResumeIndexDoc {
  resumeGcsPath: string;
  indexedAt: Timestamp;
  chunkCount: number;
  version: number;
}

export interface ResumeChunkDoc {
  version: number;
  title: string;
  content: string;
  sourceRef: string;
}

export type SubmissionStatus = "in_progress" | "complete" | "blocked" | "error";
export type SubmissionTool = "fit" | "resume" | "interview";

export interface SubmissionDoc {
  createdAt: Timestamp;
  expiresAt: Timestamp;
  tool: SubmissionTool;
  status: SubmissionStatus;
  sessionId: string;
  inputs: Record<string, unknown>;
  extracted: Record<string, unknown>;
  outputs: Record<string, unknown>;
  citations: Array<{ chunkId: string; title: string; sourceRef: string }>;
  artifactGcsPrefix: string;
}

// ============================================================================
// Collection path helpers
// ============================================================================

/**
 * Build a Firestore document path for a session.
 */
export function sessionDocPath(sessionId: string): string {
  return `${Collections.SESSIONS}/${sessionId}`;
}

/**
 * Build a Firestore document path for a rate limit key.
 */
export function rateLimitDocPath(key: string): string {
  return `${Collections.RATE_LIMITS}/${key}`;
}

/**
 * Build a Firestore document path for a monthly spend tracker.
 * @param yearMonth - e.g., "2026-02"
 */
export function spendMonthlyDocPath(yearMonth: string): string {
  return `${Collections.SPEND_MONTHLY}/${yearMonth}`;
}

/**
 * Get the current month key in YYYY-MM format.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Build a Firestore document path for the current resume index.
 */
export function resumeIndexDocPath(): string {
  return `${Collections.RESUME_INDEX}/current`;
}

/**
 * Build a Firestore document path for a resume chunk.
 */
export function resumeChunkDocPath(chunkId: string): string {
  return `${Collections.RESUME_CHUNKS}/${chunkId}`;
}

/**
 * Build a Firestore document path for a submission.
 */
export function submissionDocPath(submissionId: string): string {
  return `${Collections.SUBMISSIONS}/${submissionId}`;
}

// ============================================================================
// Typed collection helpers
// ============================================================================

/**
 * Get a typed document reference for a session.
 */
export function getSessionRef(sessionId: string) {
  return getFirestore().doc(sessionDocPath(sessionId));
}

/**
 * Get a typed document reference for a rate limit.
 */
export function getRateLimitRef(key: string) {
  return getFirestore().doc(rateLimitDocPath(key));
}

/**
 * Get a typed document reference for monthly spend.
 */
export function getSpendMonthlyRef(yearMonth: string) {
  return getFirestore().doc(spendMonthlyDocPath(yearMonth));
}

/**
 * Get the current resume index document reference.
 */
export function getResumeIndexRef() {
  return getFirestore().doc(resumeIndexDocPath());
}

/**
 * Get a typed document reference for a resume chunk.
 */
export function getResumeChunkRef(chunkId: string) {
  return getFirestore().doc(resumeChunkDocPath(chunkId));
}

/**
 * Get a typed document reference for a submission.
 */
export function getSubmissionRef(submissionId: string) {
  return getFirestore().doc(submissionDocPath(submissionId));
}

/**
 * Get the submissions collection reference.
 */
export function getSubmissionsCollection() {
  return getFirestore().collection(Collections.SUBMISSIONS);
}

/**
 * Get the resume chunks collection reference.
 */
export function getResumeChunksCollection() {
  return getFirestore().collection(Collections.RESUME_CHUNKS);
}
