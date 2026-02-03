import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "@google-cloud/firestore";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  validateResumeFileMetadata,
  validateResumeContent,
  MARKDOWN_CONTENT_TYPE,
  ResumeUploadError,
} from "@/lib/resume-upload";
import {
  getPrivateBucket,
  writeFile,
  PrivatePaths,
} from "@/lib/storage";
import { getResumeIndexRef, ResumeIndexDoc } from "@/lib/firestore";

/**
 * Response type for successful resume upload.
 */
interface UploadSuccessResponse {
  success: true;
  message: string;
  version: number;
  uploadedAt: string;
}

/**
 * Response type for upload errors.
 */
interface UploadErrorResponse {
  success: false;
  error: string;
  message: string;
}

type UploadResponse = UploadSuccessResponse | UploadErrorResponse;

/**
 * POST /api/admin/resume
 *
 * Upload or replace the master resume markdown file.
 *
 * Request: multipart/form-data with a single "file" field containing a .md file.
 *
 * Response:
 * - 200: Success with version info
 * - 400: Validation error (bad file type, size, content)
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not an admin)
 * - 500: Server error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadResponse>> {
  // Check admin authentication
  const authResult = await requireAdminAuth();
  if (!authResult.authenticated) {
    return authResult.error as NextResponse<UploadResponse>;
  }

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FILE",
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file metadata (type and size)
    try {
      validateResumeFileMetadata({
        filename: file.name,
        size: file.size,
        contentType: file.type,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid file metadata";
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_FILE",
          message,
        },
        { status: 400 }
      );
    }

    // Read and validate file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let content: string;
    try {
      content = validateResumeContent(buffer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid file content";
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CONTENT",
          message,
        },
        { status: 400 }
      );
    }

    // Store file to GCS
    const bucket = getPrivateBucket();
    const gcsPath = PrivatePaths.masterResume();

    try {
      await writeFile(bucket, gcsPath, content, MARKDOWN_CONTENT_TYPE);
    } catch (error) {
      console.error("GCS upload error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "STORAGE_ERROR",
          message: "Failed to store resume file",
        },
        { status: 500 }
      );
    }

    // Update Firestore metadata
    const now = Timestamp.now();
    let newVersion: number;

    try {
      const resumeIndexRef = getResumeIndexRef();
      const existingDoc = await resumeIndexRef.get();

      if (existingDoc.exists) {
        const existingData = existingDoc.data() as ResumeIndexDoc;
        newVersion = (existingData.version || 0) + 1;
      } else {
        newVersion = 1;
      }

      const indexData: ResumeIndexDoc = {
        resumeGcsPath: gcsPath,
        indexedAt: now,
        chunkCount: 0, // Will be updated when chunking is implemented
        version: newVersion,
      };

      await resumeIndexRef.set(indexData);
    } catch (error) {
      console.error("Firestore metadata error:", error);
      // Note: File is already uploaded to GCS at this point
      // In a production system, you might want to handle this with a transaction
      return NextResponse.json(
        {
          success: false,
          error: "METADATA_ERROR",
          message: "File uploaded but failed to update metadata",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Resume uploaded successfully (version ${newVersion})`,
      version: newVersion,
      uploadedAt: now.toDate().toISOString(),
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof ResumeUploadError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }

    // Log unexpected errors without exposing details
    console.error("Resume upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
