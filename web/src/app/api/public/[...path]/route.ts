import { NextRequest, NextResponse } from "next/server";
import { getPublicBucket, fileExists } from "@/lib/storage";

/**
 * GET /api/public/[...path]
 *
 * Proxy static files from the public GCS bucket.
 * This is required because organization policies may block direct public access.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const { path: pathSegments } = await params;
    const path = pathSegments.join("/");
    const bucket = getPublicBucket();

    // Security check: Prevent directory traversal
    if (path.includes("..")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    // Check if file exists
    if (!(await fileExists(bucket, path))) {
      return new NextResponse("File not found", { status: 404 });
    }

    const file = bucket.file(path);
    const [metadata] = await file.getMetadata();
    
    // Get content type
    const contentType = metadata.contentType || "application/octet-stream";
    const size = metadata.size ? metadata.size.toString() : undefined;

    // Download file content
    // Note: For larger files, we should use streaming, but for dance menu items
    // (text, small PDFs), loading into memory is acceptable and simpler for Next.js
    const [content] = await file.download();

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    if (size) {
      headers.set("Content-Length", size);
    }
    
    // Set caching headers (public, 1 hour)
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
