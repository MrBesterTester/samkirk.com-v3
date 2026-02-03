import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  validateBundle,
  DanceMenuUploadError,
  ValidatedBundle,
} from "@/lib/dance-menu-upload";
import {
  getPublicBucket,
  writeFile,
  writeBuffer,
  deletePrefix,
  PublicPaths,
} from "@/lib/storage";

/**
 * Response type for successful dance menu upload.
 */
interface UploadSuccessResponse {
  success: true;
  message: string;
  uploadedFiles: string[];
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
 * Upload files from a validated bundle to GCS.
 */
async function uploadBundleToGCS(bundle: ValidatedBundle): Promise<string[]> {
  const bucket = getPublicBucket();
  const prefix = PublicPaths.danceMenuCurrent();

  // Delete existing files in the current dance menu folder
  await deletePrefix(bucket, prefix);

  const uploadedFiles: string[] = [];

  for (const file of bundle.files) {
    const path = PublicPaths.danceMenuFile(file.storageFilename);

    if (file.extension === ".pdf") {
      // Binary file - use writeBuffer
      await writeBuffer(bucket, path, file.content, file.mimeType);
    } else {
      // Text file - use writeFile
      await writeFile(bucket, path, file.content.toString("utf-8"), file.mimeType);
    }

    uploadedFiles.push(file.storageFilename);
  }

  return uploadedFiles;
}

/**
 * POST /api/admin/dance-menu
 *
 * Upload or replace the dance menu bundle files.
 *
 * Request: multipart/form-data with multiple files (at least .md, .txt, .html)
 *
 * Response:
 * - 200: Success with list of uploaded files
 * - 400: Validation error (missing required files, invalid extension, etc.)
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
    const files: Array<{
      filename: string;
      size: number;
      content: Buffer;
    }> = [];

    // Extract all files from form data
    for (const [key, value] of formData.entries()) {
      // Check if this entry is a file
      if (value instanceof File && key.startsWith("file")) {
        const arrayBuffer = await value.arrayBuffer();
        files.push({
          filename: value.name,
          size: value.size,
          content: Buffer.from(arrayBuffer),
        });
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FILES",
          message: "No files provided",
        },
        { status: 400 }
      );
    }

    // Validate bundle
    let bundle: ValidatedBundle;
    try {
      bundle = validateBundle(files);
    } catch (error) {
      if (error instanceof DanceMenuUploadError) {
        return NextResponse.json(
          {
            success: false,
            error: error.code,
            message: error.message,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Upload to GCS
    let uploadedFiles: string[];
    try {
      uploadedFiles = await uploadBundleToGCS(bundle);
    } catch (error) {
      console.error("GCS upload error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "STORAGE_ERROR",
          message: "Failed to store dance menu files",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Dance menu uploaded successfully (${uploadedFiles.length} files)`,
      uploadedFiles,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof DanceMenuUploadError) {
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
    console.error("Dance menu upload error:", error);

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
