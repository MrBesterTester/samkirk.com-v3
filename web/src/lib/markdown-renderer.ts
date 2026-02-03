import "server-only";

import { marked, type MarkedOptions } from "marked";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Options for markdown rendering.
 */
export interface RenderMarkdownOptions {
  /**
   * Whether to include a full HTML document wrapper with <html>, <head>, <body>.
   * Defaults to false (returns just the rendered content).
   */
  fullDocument?: boolean;

  /**
   * Document title (only used when fullDocument is true).
   */
  title?: string;

  /**
   * Additional CSS to include in the document head (only used when fullDocument is true).
   */
  customCss?: string;

  /**
   * Whether to sanitize the HTML output.
   * Defaults to true for security.
   */
  sanitize?: boolean;
}

// ============================================================================
// Default Styles
// ============================================================================

/**
 * Default CSS styles for rendered markdown documents.
 * Clean, professional styling suitable for reports and resumes.
 */
export const DEFAULT_MARKDOWN_CSS = `
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  color: #333;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }

p { margin: 1em 0; }

ul, ol {
  padding-left: 2em;
  margin: 1em 0;
}

li { margin: 0.25em 0; }

code {
  background-color: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
}

pre {
  background-color: #f6f8fa;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
}

blockquote {
  margin: 1em 0;
  padding: 0 1em;
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

th, td {
  border: 1px solid #dfe2e5;
  padding: 0.5em 1em;
  text-align: left;
}

th {
  background-color: #f6f8fa;
  font-weight: 600;
}

hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 2em 0;
}

a {
  color: #0366d6;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

strong { font-weight: 600; }

em { font-style: italic; }

img {
  max-width: 100%;
  height: auto;
}

.citation-section {
  margin-top: 2em;
  padding-top: 1em;
  border-top: 2px solid #eee;
}

.citation-section h2 {
  font-size: 1.25em;
  border-bottom: none;
}

.citation-item {
  margin: 0.5em 0;
  padding: 0.5em;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 0.9em;
}

.citation-title { font-weight: 600; }
.citation-ref { color: #666; font-style: italic; }
`.trim();

// ============================================================================
// HTML Sanitization
// ============================================================================

/**
 * List of allowed HTML tags in sanitized output.
 * This is a conservative allowlist suitable for markdown content.
 */
const ALLOWED_TAGS = new Set([
  // Block elements
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "div", "span",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td",
  "pre", "code", "blockquote",
  "hr", "br",
  // Inline elements
  "a", "strong", "b", "em", "i", "u", "s", "del",
  "sub", "sup", "mark",
  // Images (for potential future use)
  "img",
]);

/**
 * Allowed attributes by tag name.
 */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  th: new Set(["align"]),
  td: new Set(["align"]),
  code: new Set(["class"]),
  pre: new Set(["class"]),
  div: new Set(["class"]),
  span: new Set(["class"]),
};

/**
 * Simple HTML sanitizer that strips disallowed tags and attributes.
 * This is not a full-featured sanitizer but is sufficient for markdown output.
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and their contents
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove style tags and their contents
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove event handlers (on* attributes)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');

  // Remove data: URLs from src attributes (except for base64 images which we might allow later)
  sanitized = sanitized.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, 'src=""');

  // Strip disallowed tags (preserve content for non-void elements)
  // This regex matches opening and closing tags
  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9]+)[^>]*>/g, (match, tagName) => {
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      // For closing tags, just remove
      if (match.startsWith("</")) {
        return "";
      }
      // For opening tags, keep content but remove the tag
      return "";
    }
    return match;
  });

  // Filter attributes on allowed tags
  sanitized = sanitized.replace(/<([a-zA-Z0-9]+)\s+([^>]*)>/g, (match, tagName, attributes) => {
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return match; // Should have been handled above
    }

    const allowedAttrs = ALLOWED_ATTRIBUTES[lowerTag] || new Set();
    if (allowedAttrs.size === 0 && attributes.trim() === "") {
      return `<${tagName}>`;
    }

    // Parse and filter attributes
    const attrRegex = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    const filteredAttrs: string[] = [];
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attributes)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      if (allowedAttrs.has(attrName)) {
        // Additional validation for specific attributes
        if (attrName === "href") {
          // Only allow http, https, mailto, and relative URLs
          if (
            attrValue.startsWith("http://") ||
            attrValue.startsWith("https://") ||
            attrValue.startsWith("mailto:") ||
            attrValue.startsWith("#") ||
            attrValue.startsWith("/") ||
            !attrValue.includes(":")
          ) {
            filteredAttrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
          }
        } else if (attrName === "src") {
          // Only allow http, https, and data:image URLs
          if (
            attrValue.startsWith("http://") ||
            attrValue.startsWith("https://") ||
            attrValue.startsWith("data:image/") ||
            attrValue.startsWith("/") ||
            !attrValue.includes(":")
          ) {
            filteredAttrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
          }
        } else if (attrName === "target") {
          // Only allow _blank
          if (attrValue === "_blank") {
            filteredAttrs.push(`${attrName}="${attrValue}"`);
            // Add rel="noopener noreferrer" for security
            filteredAttrs.push('rel="noopener noreferrer"');
          }
        } else {
          filteredAttrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
        }
      }
    }

    if (filteredAttrs.length > 0) {
      return `<${tagName} ${filteredAttrs.join(" ")}>`;
    }
    return `<${tagName}>`;
  });

  return sanitized;
}

/**
 * Escape HTML special characters in a string.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================================
// Markdown Rendering
// ============================================================================

/**
 * Configure marked with secure defaults.
 */
function getMarkedOptions(): MarkedOptions {
  return {
    gfm: true, // GitHub Flavored Markdown
    breaks: false, // Don't convert \n to <br>
    async: false, // Synchronous rendering
  };
}

/**
 * Render markdown content to HTML.
 *
 * @param markdown - The markdown content to render
 * @param options - Rendering options
 * @returns The rendered HTML string
 */
export function renderMarkdown(
  markdown: string,
  options: RenderMarkdownOptions = {}
): string {
  const {
    fullDocument = false,
    title = "Document",
    customCss,
    sanitize = true,
  } = options;

  // Configure marked
  marked.setOptions(getMarkedOptions());

  // Render markdown to HTML
  let html = marked.parse(markdown) as string;

  // Sanitize if requested (default is true)
  if (sanitize) {
    html = sanitizeHtml(html);
  }

  // Wrap in full document if requested
  if (fullDocument) {
    const css = customCss ?? DEFAULT_MARKDOWN_CSS;
    html = wrapInDocument(html, title, css);
  }

  return html;
}

/**
 * Render markdown to HTML synchronously (alias for renderMarkdown with async: false).
 */
export function renderMarkdownSync(
  markdown: string,
  options: RenderMarkdownOptions = {}
): string {
  return renderMarkdown(markdown, options);
}

/**
 * Wrap HTML content in a full HTML document.
 */
export function wrapInDocument(
  content: string,
  title: string,
  css: string = DEFAULT_MARKDOWN_CSS
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

// ============================================================================
// Citation Formatting
// ============================================================================

/**
 * Citation structure for inclusion in rendered output.
 */
export interface Citation {
  chunkId: string;
  title: string;
  sourceRef: string;
}

/**
 * Render citations as an HTML section.
 *
 * @param citations - Array of citation objects
 * @returns HTML string for the citations section
 */
export function renderCitationsHtml(citations: Citation[]): string {
  if (citations.length === 0) {
    return "";
  }

  const items = citations
    .map(
      (c, i) => `
    <div class="citation-item">
      <span class="citation-number">[${i + 1}]</span>
      <span class="citation-title">${escapeHtml(c.title)}</span>
      <span class="citation-ref">(${escapeHtml(c.sourceRef)})</span>
    </div>`
    )
    .join("\n");

  return `
<div class="citation-section">
  <h2>Citations</h2>
  ${items}
</div>`;
}

/**
 * Render citations as a markdown section.
 *
 * @param citations - Array of citation objects
 * @returns Markdown string for the citations section
 */
export function renderCitationsMarkdown(citations: Citation[]): string {
  if (citations.length === 0) {
    return "";
  }

  const items = citations
    .map((c, i) => `[${i + 1}] **${c.title}** (${c.sourceRef})`)
    .join("\n");

  return `

---

## Citations

${items}
`;
}

/**
 * Append citations to markdown content.
 *
 * @param markdown - The original markdown content
 * @param citations - Citations to append
 * @returns Markdown with citations section appended
 */
export function appendCitationsToMarkdown(
  markdown: string,
  citations: Citation[]
): string {
  if (citations.length === 0) {
    return markdown;
  }
  return markdown + renderCitationsMarkdown(citations);
}

/**
 * Render markdown with citations to a full HTML document.
 *
 * @param markdown - The markdown content
 * @param citations - Citations to include
 * @param title - Document title
 * @returns Full HTML document with content and citations
 */
export function renderMarkdownWithCitations(
  markdown: string,
  citations: Citation[],
  title: string = "Document"
): string {
  // First render the main content
  let html = renderMarkdown(markdown, { sanitize: true });

  // Add citations section
  if (citations.length > 0) {
    html += renderCitationsHtml(citations);
  }

  // Wrap in document
  return wrapInDocument(html, title);
}
