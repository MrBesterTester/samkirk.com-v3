import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Server-side loader for the standalone HTML write-ups in `web/public/static`.
 *
 * These files were previously shown through an iframe (`StaticHtmlViewer`).
 * Search engines do not credit iframe content to the embedding page, so pages
 * carrying 30–100 KB of genuine technical writing were being indexed as
 * ~200-word stubs. Rendering the markup into the page server-side makes it real
 * content for both crawlers and readers.
 *
 * The catch is that each file is a complete HTML document whose stylesheet uses
 * bare element selectors (`*`, `body`, `h1`, `table`, …). Injected as-is those
 * rules would leak out and restyle the whole site, so every selector is rewritten
 * to sit under a scope class before the CSS is emitted.
 */

/** Directory holding the standalone documents. */
const STATIC_DIR = path.join(process.cwd(), "public", "static");

/** The class applied to the wrapper element that all extracted CSS is scoped to. */
export const STATIC_SCOPE_CLASS = "static-html-content";

export type ParsedStaticHtml = {
  /** Contents of <title>, when present. */
  title: string | null;
  /** Inner HTML of <body>, with <script> elements removed. */
  bodyHtml: string;
  /** Concatenated <style> contents, not yet scoped. */
  css: string;
};

/** At-rules whose bodies contain nested style rules and must be recursed into. */
const NESTED_AT_RULES = /^@(media|supports|layer|container|scope)\b/i;

/**
 * Find the index of the `}` matching the `{` at `openIdx`, or -1 if unbalanced.
 */
function matchBrace(css: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Rewrite one comma-separated selector list so every selector applies only
 * inside `scope`.
 *
 * Document-level selectors (`html`, `body`, `:root`, `*`) collapse onto the
 * scope element itself, since the wrapper div stands in for the old document
 * root. Everything else becomes a descendant selector.
 */
export function scopeSelectorList(selectorList: string, scope: string): string {
  return selectorList
    .split(",")
    .map((raw) => {
      const sel = raw.trim();
      if (!sel) return "";

      // `*` should reach the wrapper and everything inside it.
      if (sel === "*") return `${scope}, ${scope} *`;

      // The wrapper replaces the document root.
      if (/^(html|body|:root)$/i.test(sel)) return scope;

      // `body h1` / `html > p` → drop the root, keep the rest under the scope.
      const rooted = sel.match(/^(?:html|body)\s*(?:>\s*)?(.+)$/i);
      if (rooted) return `${scope} ${rooted[1].trim()}`;

      return `${scope} ${sel}`;
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * Rewrite a stylesheet so every rule is confined to `scope`.
 *
 * Handles nested at-rules (`@media`, `@supports`, …) by recursing into their
 * bodies. Standalone at-rules such as `@keyframes` and `@font-face` are emitted
 * unchanged — scoping their contents would break them.
 */
export function scopeCss(css: string, scope: string = `.${STATIC_SCOPE_CLASS}`): string {
  // Strip comments first so they cannot be mistaken for selectors.
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "";
  let i = 0;

  while (i < cleaned.length) {
    const openIdx = cleaned.indexOf("{", i);
    if (openIdx === -1) break;

    const prelude = cleaned.slice(i, openIdx).trim();
    const closeIdx = matchBrace(cleaned, openIdx);
    if (closeIdx === -1) break; // unbalanced — drop the remainder rather than emit broken CSS

    const inner = cleaned.slice(openIdx + 1, closeIdx);

    if (prelude.startsWith("@")) {
      out += NESTED_AT_RULES.test(prelude)
        ? `${prelude}{${scopeCss(inner, scope)}}`
        : `${prelude}{${inner}}`;
    } else if (prelude) {
      out += `${scopeSelectorList(prelude, scope)}{${inner}}`;
    }

    i = closeIdx + 1;
  }

  return out;
}

/**
 * Pull the title, body markup, and stylesheet out of a complete HTML document.
 *
 * `<script>` elements are removed: `dangerouslySetInnerHTML` never executes them,
 * so they would be inert weight at best and confusing at worst.
 */
export function parseStaticHtml(raw: string): ParsedStaticHtml {
  const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  let css = "";
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch: RegExpExecArray | null;
  while ((styleMatch = styleRe.exec(raw)) !== null) css += `\n${styleMatch[1]}`;

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  // Files without a <body> wrapper are treated as fragments.
  const body = bodyMatch ? bodyMatch[1] : raw;

  const bodyHtml = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .trim();

  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    bodyHtml,
    css: css.trim(),
  };
}

/**
 * Reject anything that is not a plain filename, so a caller cannot walk out of
 * the static directory.
 */
function assertSafeName(fileName: string): void {
  if (!/^[A-Za-z0-9._-]+\.html$/.test(fileName) || fileName.includes("..")) {
    throw new Error(`Unsafe static HTML filename: ${fileName}`);
  }
}

export type LoadedStaticHtml = ParsedStaticHtml & {
  /** Stylesheet with every selector confined to the scope class. */
  scopedCss: string;
};

/**
 * Read and prepare one document from `public/static` for inline rendering.
 *
 * Called from server components, so the file is read at build time for static
 * routes — no runtime cost and no client-side fetch.
 */
export async function loadStaticHtml(fileName: string): Promise<LoadedStaticHtml> {
  assertSafeName(fileName);
  const raw = await readFile(path.join(STATIC_DIR, fileName), "utf8");
  const parsed = parseStaticHtml(raw);
  return { ...parsed, scopedCss: scopeCss(parsed.css) };
}
