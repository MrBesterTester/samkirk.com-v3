import { NextRequest, NextResponse } from "next/server";
import {
  getPublicBucket,
  readFile,
  fileExists,
  listFiles,
  PublicPaths,
} from "@/lib/storage";
import { getEnv } from "@/lib/env";

/**
 * Response type for dance menu data.
 */
interface DanceMenuResponse {
  available: boolean;
  htmlContent?: string;
  formats: {
    extension: string;
    name: string;
    url: string;
  }[];
}

const FORMAT_NAMES: Record<string, string> = {
  "menu.md": "Markdown",
  "menu.txt": "Plain Text",
  "menu.html": "HTML",
  "menu.pdf": "PDF",
};

/**
 * GET /api/dance-menu
 *
 * Fetch the current dance menu HTML content and available download links.
 *
 * Response:
 * - 200: Menu data with HTML content and download links
 * - 500: Server error
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<DanceMenuResponse>> {
  // This route doesn't need the request, but Next.js requires the parameter
  void request;

  try {
    const env = getEnv();
    const bucket = getPublicBucket();
    const prefix = PublicPaths.danceMenuCurrent();

    // Check if any menu files exist
    const files = await listFiles(bucket, prefix);

    if (files.length === 0) {
      return NextResponse.json({
        available: false,
        formats: [],
      });
    }

    // Get the HTML content for display
    const htmlPath = PublicPaths.danceMenuFile("menu.html");
    let htmlContent: string | undefined;

    if (await fileExists(bucket, htmlPath)) {
      try {
        htmlContent = await readFile(bucket, htmlPath);
      } catch (error) {
        console.error("Failed to read HTML content:", error);
        // Continue without HTML content
      }
    }

    // Build public URLs for available formats
    // For public buckets, we can construct direct URLs
    const bucketName = env.GCS_PUBLIC_BUCKET;
    const formats = files
      .map((path) => {
        const filename = path.split("/").pop() || "";
        const name = FORMAT_NAMES[filename];
        if (!name) return null;

        return {
          extension: filename.split(".").pop() || "",
          name,
          url: `https://storage.googleapis.com/${bucketName}/${path}`,
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);

    // Sort formats in a sensible order: HTML, Markdown, Text, PDF
    const sortOrder = ["html", "md", "txt", "pdf"];
    formats.sort(
      (a, b) => sortOrder.indexOf(a.extension) - sortOrder.indexOf(b.extension)
    );

    return NextResponse.json({
      available: true,
      htmlContent,
      formats,
    });
  } catch (error) {
    console.error("Dance menu fetch error:", error);

    return NextResponse.json(
      {
        available: false,
        formats: [],
      },
      { status: 500 }
    );
  }
}
