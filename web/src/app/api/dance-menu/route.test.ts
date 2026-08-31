/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Regression cover for the uploaded menu's stylesheet escaping its container.
 *
 * The menu is authored as a complete standalone HTML document. Before this was
 * fixed the route handed that document to the page verbatim, so its bare
 * element selectors applied site-wide: `nav ul{display:flex}` beat the header's
 * `hidden md:flex` (Tailwind v4 layers utilities, and unlayered rules win over
 * layered ones regardless of specificity), inflating the site header to ~384px
 * on a 375x812 phone, and the document's dark `body` palette repainted the page.
 */

const MENU_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Bay Area Dance Events</title>
<style>
:root{--muted:#8a8a8a}
body{background:#12161c;color:#e7e7e7;font-family:system-ui}
nav ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px}
nav a{color:#8fc6f0}
h1{font-size:1.6rem}
@media (max-width:600px){table{font-size:.9rem}}
</style>
</head>
<body>
<nav><ul><li><a href="#fri">Friday</a></li></ul></nav>
<h1>Bay Area Dance Events</h1>
<script>console.log("inert")</script>
</body>
</html>`;

const listFiles = vi.fn();
const fileExists = vi.fn();
const readFile = vi.fn();

vi.mock("@/lib/storage", () => ({
  getPublicBucket: () => ({}),
  listFiles: (...args: unknown[]) => listFiles(...args),
  fileExists: (...args: unknown[]) => fileExists(...args),
  readFile: (...args: unknown[]) => readFile(...args),
  PublicPaths: {
    danceMenuCurrent: () => "dance-menu/current/",
    danceMenuFile: (f: string) => `dance-menu/current/${f}`,
  },
}));

const { GET } = await import("./route");

async function getMenu() {
  const res = await GET(new NextRequest("http://localhost/api/dance-menu"));
  return res.json();
}

describe("GET /api/dance-menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFiles.mockResolvedValue(["dance-menu/current/sams-dance-menu.html"]);
    fileExists.mockResolvedValue(true);
    readFile.mockResolvedValue(MENU_HTML);
  });

  it("confines every menu rule to the wrapper class", async () => {
    const { htmlContent } = await getMenu();

    expect(htmlContent).toContain('<div class="static-html-content">');
    expect(htmlContent).toContain(".static-html-content nav ul{");
    expect(htmlContent).toContain(".static-html-content nav a{");
    expect(htmlContent).toContain(".static-html-content h1{");

    // The rules that used to leak must no longer stand on their own.
    expect(htmlContent).not.toMatch(/(^|[{}])\s*nav ul\s*\{/);
    expect(htmlContent).not.toMatch(/(^|[{}])\s*body\s*\{/);
    expect(htmlContent).not.toMatch(/(^|[{}])\s*:root\s*\{/);
  });

  it("maps the document root onto the wrapper rather than dropping it", async () => {
    const { htmlContent } = await getMenu();

    // `body` and `:root` carry the menu's palette — they must survive, scoped.
    expect(htmlContent).toContain(".static-html-content{background:#12161c");
    expect(htmlContent).toContain("--muted:#8a8a8a");
  });

  it("keeps media queries intact while scoping their contents", async () => {
    const { htmlContent } = await getMenu();

    expect(htmlContent).toContain("@media (max-width:600px)");
    expect(htmlContent).toContain(".static-html-content table{");
  });

  it("emits the body markup without the document scaffolding", async () => {
    const { htmlContent } = await getMenu();

    expect(htmlContent).toContain('<a href="#fri">Friday</a>');
    expect(htmlContent).not.toContain("<title>");
    expect(htmlContent).not.toContain("<meta");
    expect(htmlContent).not.toContain("<script");
  });

  it("still reports availability and download formats", async () => {
    const { available, formats } = await getMenu();

    expect(available).toBe(true);
    expect(formats).toEqual([
      {
        extension: "html",
        name: "HTML",
        url: "/api/public/dance-menu/current/sams-dance-menu.html",
      },
    ]);
  });

  it("reports unavailable when no menu has been published", async () => {
    listFiles.mockResolvedValue([]);

    const { available, htmlContent } = await getMenu();

    expect(available).toBe(false);
    expect(htmlContent).toBeUndefined();
  });
});
