/**
 * A short, human-readable preview of a text file's content.
 *
 * The dance-menu upload renames every file to a standard name by extension, so
 * the stored `sams-dance-menu.txt` is whatever `.txt` happened to be in the
 * bundle. Nothing downstream can tell a menu from a notes file — extension is
 * treated as identity. A preview shown before publishing is what makes the
 * wrong file visible while it can still be swapped.
 *
 * Deliberately advisory: it describes the content rather than judging it. A
 * hard rule about what a menu "looks like" would eventually reject a real menu.
 */

/** Extensions whose bytes are text we can meaningfully preview. */
const TEXT_EXTENSIONS = new Set([".txt", ".md", ".html"]);

const ELLIPSIS = "…";

/** Collapse whitespace runs and trim, so the preview stays a single tidy line. */
function tidy(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/**
 * Pull something meaningful out of an HTML document.
 *
 * The first non-blank line of a standalone HTML file is almost always
 * `<!DOCTYPE html>`, which identifies nothing. The `<title>` is what the author
 * named the document, so prefer it and fall back to the first visible text.
 */
function previewHtml(content: string): string {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(content);
  if (title) {
    const text = tidy(title[1]);
    if (text) return text;
  }

  const withoutHead = content
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");

  return tidy(withoutHead.replace(/<[^>]*>/g, " "));
}

/**
 * Return the first meaningful line of `content`, truncated to `maxChars`.
 *
 * Returns an empty string for content that cannot be previewed — a binary
 * format, or a file that is empty or all whitespace. Callers should treat an
 * empty result as "no preview available", not as an error.
 */
export function previewOf(
  content: string,
  extension: string,
  maxChars = 120,
): string {
  if (!TEXT_EXTENSIONS.has(extension.toLowerCase())) return "";

  const text =
    extension.toLowerCase() === ".html"
      ? previewHtml(content)
      : (content.split("\n").map(tidy).find((line) => line.length > 0) ?? "");

  if (!text) return "";

  return text.length > maxChars ? text.slice(0, maxChars) + ELLIPSIS : text;
}
