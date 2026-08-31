import { NextRequest, NextResponse } from "next/server";
import {
  getPublicBucket,
  readFile,
  fileExists,
  listFiles,
  PublicPaths,
} from "@/lib/storage";
import {
  parseStaticHtml,
  scopeCss,
  STATIC_SCOPE_CLASS,
} from "@/lib/static-html";

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
  "sams-dance-menu.md": "Markdown",
  "sams-dance-menu.txt": "Plain Text",
  "sams-dance-menu.html": "HTML",
  "sams-dance-menu.pdf": "PDF",
};

/**
 * Confine the uploaded menu's own stylesheet to a wrapper element.
 *
 * The menu is authored as a complete standalone HTML document, so its <head>
 * carries a stylesheet written in bare element selectors (`body`, `nav ul`,
 * `table`, …). Injected into the page as-is, those rules escape the menu and
 * restyle the whole site: `nav ul{display:flex}` overrode the site header's
 * `hidden md:flex`, inflating the header to roughly half a phone screen, and
 * the document's dark `body` palette took over the page.
 *
 * Tailwind v4 puts its utilities in `@layer utilities`, and unlayered rules beat
 * layered ones no matter their specificity — so the menu's plain `nav ul` won
 * over `.hidden` without needing `!important`.
 *
 * This is the same treatment the standalone write-ups get through
 * `StaticHtmlContent`; here the result is recombined into one string so the
 * response shape stays unchanged.
 */
function scopeMenuHtml(raw: string): string {
  const { bodyHtml, css } = parseStaticHtml(raw);
  const scoped = scopeCss(css);
  const style = scoped ? `<style>${scoped}</style>` : "";

  return `${style}<div class="${STATIC_SCOPE_CLASS}">${bodyHtml}</div>`;
}

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
    const htmlPath = PublicPaths.danceMenuFile("sams-dance-menu.html");
    let htmlContent: string | undefined;

    if (await fileExists(bucket, htmlPath)) {
      try {
        htmlContent = scopeMenuHtml(await readFile(bucket, htmlPath));
      } catch (error) {
        console.error("Failed to read HTML content:", error);
        // Continue without HTML content
      }
    }

    // Build public URLs for available formats
    // Use the local proxy route instead of direct GCS URLs to bypass org policies
    const formats = files
      .map((path) => {
        const filename = path.split("/").pop() || "";
        const name = FORMAT_NAMES[filename];
        if (!name) return null;

        return {
          extension: filename.split(".").pop() || "",
          name,
          url: `/api/public/${path}`,
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
