import { NextRequest, NextResponse } from "next/server";
import { getSessionIdFromCookies, isSessionValid } from "@/lib/session";
import { isValidSubmissionId, getSubmission } from "@/lib/submission";
import { buildSubmissionBundle, type BuildSubmissionBundleOptions } from "@/lib/artifact-bundler";
import { getPrivateBucket, PrivatePaths, fileExists } from "@/lib/storage";

/**
 * Response type for download errors.
 */
interface DownloadErrorResponse {
  error: string;
  message: string;
}

/**
 * GET /api/submissions/[id]/download
 *
 * Download the artifact bundle for a submission.
 *
 * Query parameters:
 * - cached: If "true", try to return a pre-built bundle from GCS (default: false)
 * - format: "zip" (only zip is supported in V1)
 *
 * Response:
 * - 200: Success with application/zip content
 * - 400: Invalid submission ID
 * - 401: Unauthorized (no valid session)
 * - 404: Submission not found
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DownloadErrorResponse> | NextResponse> {
  // Check session authentication (captcha-verified user)
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return NextResponse.json(
      { error: "Unauthorized", message: "No session found. Please refresh the page." },
      { status: 401 }
    );
  }
  const sessionValid = await isSessionValid(sessionId);
  if (!sessionValid) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Session expired. Please refresh the page." },
      { status: 401 }
    );
  }

  // Get the submission ID from the route params
  const { id: submissionId } = await params;

  // Validate submission ID format
  if (!submissionId || !isValidSubmissionId(submissionId)) {
    return NextResponse.json(
      {
        error: "INVALID_ID",
        message: "Invalid submission ID format",
      },
      { status: 400 }
    );
  }

  try {
    // Check if submission exists
    const submission = await getSubmission(submissionId);

    if (!submission) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Submission not found",
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const useCached = searchParams.get("cached") === "true";

    // Try to return cached bundle if requested
    if (useCached) {
      const bucket = getPrivateBucket();
      const bundlePath = PrivatePaths.submissionBundle(submissionId);

      const exists = await fileExists(bucket, bundlePath);
      if (exists) {
        const [content] = await bucket.file(bundlePath).download();

        // Convert Buffer to Uint8Array for compatibility with Response body
        return new NextResponse(new Uint8Array(content), {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="submission-${submissionId}.zip"`,
            "Content-Length": String(content.length),
            "Cache-Control": "private, max-age=300", // 5 minute cache
          },
        });
      }
    }

    // Build the bundle on-demand
    const bundleOptions: BuildSubmissionBundleOptions = {
      includeInputs: true,
      includeExtracted: true,
      includeOutputs: true,
      includeCitations: true,
      renderHtml: true,
    };

    const bundle = await buildSubmissionBundle(submissionId, bundleOptions);

    // Return the zip file
    // Convert Buffer to Uint8Array for compatibility with Response body
    return new NextResponse(new Uint8Array(bundle.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="submission-${submissionId}.zip"`,
        "Content-Length": String(bundle.size),
        "Cache-Control": "private, no-cache",
        "X-File-Count": String(bundle.fileCount),
      },
    });
  } catch (error) {
    // Log unexpected errors without exposing details
    console.error("Submission download error:", error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to generate download bundle",
      },
      { status: 500 }
    );
  }
}
