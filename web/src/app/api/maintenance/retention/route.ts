import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  runRetentionCleanup,
  buildCleanupSummary,
  type RetentionCleanupResult,
  MAX_DELETIONS_PER_RUN,
} from "@/lib/retention";

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Optional request body schema for retention cleanup.
 * All fields are optional - the endpoint works with no body.
 */
const RequestSchema = z
  .object({
    /** Maximum number of submissions to process (default: MAX_DELETIONS_PER_RUN) */
    limit: z.number().int().min(1).max(1000).optional(),
    /** Secret key for authentication (compared against env var) */
    secret: z.string().optional(),
  })
  .optional();

/**
 * Success response type.
 */
interface RetentionSuccessResponse {
  success: true;
  result: RetentionCleanupResult;
}

/**
 * Error response type.
 */
interface RetentionErrorResponse {
  success: false;
  error: string;
  message: string;
}

type RetentionResponse = RetentionSuccessResponse | RetentionErrorResponse;

// ============================================================================
// Authentication Helper
// ============================================================================

/**
 * Verify the request is authorized to run retention cleanup.
 *
 * This endpoint can be called by:
 * 1. Cloud Scheduler with an OIDC token (verified by Cloud Run)
 * 2. Admin with a shared secret (for manual runs)
 *
 * The authentication approach:
 * - If MAINTENANCE_SECRET env var is set, require it in request body
 * - If running on Cloud Run with IAM, the scheduler's identity is verified by Cloud Run
 * - For local development, skip auth if MAINTENANCE_SECRET is not set
 */
function isAuthorized(requestSecret?: string): boolean {
  const envSecret = process.env.MAINTENANCE_SECRET;

  // If no secret is configured, allow the request
  // (Cloud Run IAM will handle auth, or it's local dev)
  if (!envSecret) {
    return true;
  }

  // If secret is configured, it must match
  return requestSecret === envSecret;
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/maintenance/retention
 *
 * Run retention cleanup to delete expired submissions.
 *
 * This endpoint is designed to be called by:
 * - Cloud Scheduler (daily cron job)
 * - Manual admin invocation (for testing/maintenance)
 *
 * Request body (optional):
 * - limit: Maximum number of submissions to process
 * - secret: Authentication secret (if MAINTENANCE_SECRET env var is set)
 *
 * Response:
 * - 200: Success with cleanup results
 * - 400: Invalid request body
 * - 401: Unauthorized (secret mismatch)
 * - 500: Server error
 *
 * Security notes:
 * - In production, this should be protected by Cloud Run IAM (scheduler service account)
 * - Optional MAINTENANCE_SECRET provides additional protection for manual runs
 * - No PII or secrets are logged - only submission IDs and counts
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<RetentionResponse>> {
  // Parse and validate request body
  let body: z.infer<typeof RequestSchema>;
  try {
    const rawBody = await request.json().catch(() => ({}));
    body = RequestSchema.parse(rawBody);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_REQUEST",
        message: "Invalid request body",
      },
      { status: 400 }
    );
  }

  // Check authorization
  if (!isAuthorized(body?.secret)) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid or missing secret",
      },
      { status: 401 }
    );
  }

  try {
    // Run the retention cleanup
    const result = await runRetentionCleanup({
      limit: body?.limit,
    });

    // Log a summary (safe, no secrets)
    console.log(buildCleanupSummary(result));

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err) {
    // Log error without exposing details
    console.error(
      "Retention cleanup failed:",
      err instanceof Error ? err.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error: "CLEANUP_FAILED",
        message: "Retention cleanup failed. Check server logs for details.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/maintenance/retention
 *
 * Health check endpoint that returns basic info about the retention service.
 * Does NOT trigger cleanup - use POST for that.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: "retention-cleanup",
    description: "Deletes submissions older than 90 days",
    maxDeletionsPerRun: MAX_DELETIONS_PER_RUN,
    usage: "POST to trigger cleanup",
  });
}
