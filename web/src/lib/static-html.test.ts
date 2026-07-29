import { describe, it, expect } from "vitest";
import {
  parseStaticHtml,
  scopeCss,
  scopeSelectorList,
  dedupeLeadingHeading,
} from "./static-html";

const SCOPE = ".static-html-content";

describe("static-html", () => {
  describe("scopeSelectorList", () => {
    it("confines a plain element selector to the scope", () => {
      expect(scopeSelectorList("h1", SCOPE)).toBe(".static-html-content h1");
    });

    it("collapses document-root selectors onto the scope element", () => {
      for (const root of ["html", "body", ":root"]) {
        expect(scopeSelectorList(root, SCOPE)).toBe(".static-html-content");
      }
    });

    it("expands the universal selector to the scope and its descendants", () => {
      expect(scopeSelectorList("*", SCOPE)).toBe(
        ".static-html-content, .static-html-content *"
      );
    });

    it("drops a leading html/body from a descendant selector", () => {
      expect(scopeSelectorList("body h1", SCOPE)).toBe(".static-html-content h1");
      expect(scopeSelectorList("html > p", SCOPE)).toBe(".static-html-content p");
    });

    it("scopes every selector in a comma-separated list", () => {
      expect(scopeSelectorList("th, td", SCOPE)).toBe(
        ".static-html-content th, .static-html-content td"
      );
    });

    it("preserves class, pseudo-class, and attribute selectors", () => {
      expect(scopeSelectorList(".note strong", SCOPE)).toBe(
        ".static-html-content .note strong"
      );
      expect(scopeSelectorList("tr:nth-child(even)", SCOPE)).toBe(
        ".static-html-content tr:nth-child(even)"
      );
      expect(scopeSelectorList('a[href^="#"]', SCOPE)).toBe(
        '.static-html-content a[href^="#"]'
      );
    });

    it("ignores empty entries from trailing commas", () => {
      expect(scopeSelectorList("h1, , h2", SCOPE)).toBe(
        ".static-html-content h1, .static-html-content h2"
      );
    });
  });

  describe("scopeCss", () => {
    it("scopes a simple rule", () => {
      expect(scopeCss("h1{color:red}", SCOPE)).toBe(".static-html-content h1{color:red}");
    });

    it("prevents body styles from leaking to the real page body", () => {
      const out = scopeCss("body{background:#f0f2f5;padding:20px}", SCOPE);
      expect(out).toBe(".static-html-content{background:#f0f2f5;padding:20px}");
      expect(out.startsWith("body")).toBe(false);
    });

    it("recurses into @media blocks", () => {
      const out = scopeCss("@media (max-width:600px){h1{font-size:1rem}}", SCOPE);
      expect(out).toBe("@media (max-width:600px){.static-html-content h1{font-size:1rem}}");
    });

    it("recurses into @supports blocks", () => {
      const out = scopeCss("@supports (display:grid){.grid{display:grid}}", SCOPE);
      expect(out).toBe("@supports (display:grid){.static-html-content .grid{display:grid}}");
    });

    it("leaves @keyframes bodies untouched", () => {
      const out = scopeCss("@keyframes spin{from{opacity:0}to{opacity:1}}", SCOPE);
      expect(out).toBe("@keyframes spin{from{opacity:0}to{opacity:1}}");
    });

    it("leaves @font-face untouched", () => {
      const out = scopeCss('@font-face{font-family:"X";src:url(x.woff2)}', SCOPE);
      expect(out).toBe('@font-face{font-family:"X";src:url(x.woff2)}');
    });

    it("strips comments so they are never parsed as selectors", () => {
      expect(scopeCss("/* a comment */ h1{color:red}", SCOPE)).toBe(
        ".static-html-content h1{color:red}"
      );
    });

    it("handles multiple rules in sequence", () => {
      const out = scopeCss("h1{color:red}p{margin:0}", SCOPE);
      expect(out).toBe(".static-html-content h1{color:red}.static-html-content p{margin:0}");
    });

    it("does not emit broken CSS when braces are unbalanced", () => {
      expect(() => scopeCss("h1{color:red", SCOPE)).not.toThrow();
      expect(scopeCss("h1{color:red", SCOPE)).toBe("");
    });

    it("defaults to the exported scope class", () => {
      expect(scopeCss("h1{color:red}")).toBe(".static-html-content h1{color:red}");
    });
  });

  describe("parseStaticHtml", () => {
    const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<title>The Physics of LoRA</title>
<style>body{padding:20px}h1{color:#1a3a5c}</style>
<script src="https://cdn.example/katex.js"></script>
</head>
<body>
<div class="container"><h1>Heading</h1><p>Body text.</p></div>
<script>console.log("inline");</script>
</body>
</html>`;

    it("extracts the document title", () => {
      expect(parseStaticHtml(doc).title).toBe("The Physics of LoRA");
    });

    it("extracts the stylesheet", () => {
      expect(parseStaticHtml(doc).css).toBe("body{padding:20px}h1{color:#1a3a5c}");
    });

    it("extracts the body markup and keeps the real content", () => {
      const { bodyHtml } = parseStaticHtml(doc);
      expect(bodyHtml).toContain("<h1>Heading</h1>");
      expect(bodyHtml).toContain("<p>Body text.</p>");
    });

    it("removes script elements from the body", () => {
      const { bodyHtml } = parseStaticHtml(doc);
      expect(bodyHtml).not.toContain("<script");
      expect(bodyHtml).not.toContain("console.log");
    });

    it("does not leave the head or its markup in the body", () => {
      const { bodyHtml } = parseStaticHtml(doc);
      expect(bodyHtml).not.toContain("<title>");
      expect(bodyHtml).not.toContain("<style");
    });

    it("returns a null title when there is none", () => {
      expect(parseStaticHtml("<body><p>x</p></body>").title).toBeNull();
    });

    it("treats a document without a body wrapper as a fragment", () => {
      const { bodyHtml } = parseStaticHtml("<h1>Fragment</h1><p>text</p>");
      expect(bodyHtml).toContain("<h1>Fragment</h1>");
    });

    it("concatenates multiple style blocks", () => {
      const { css } = parseStaticHtml(
        "<head><style>h1{color:red}</style><style>p{margin:0}</style></head><body><p>x</p></body>"
      );
      expect(css).toContain("h1{color:red}");
      expect(css).toContain("p{margin:0}");
    });
  });


  describe("dedupeLeadingHeading", () => {
    it("drops the leading h1 when it exactly repeats the page heading", () => {
      const out = dedupeLeadingHeading(
        "<h1>The Physics of LoRA</h1><p>body</p>",
        "The Physics of LoRA"
      );
      expect(out).toBe("<p>body</p>");
    });

    it("keeps a leading h1 that adds information", () => {
      const body = "<h1>Leveson's System-Safety Framework Applied to Claude Models</h1><p>x</p>";
      expect(dedupeLeadingHeading(body, "Safer AI")).toBe(body);
    });

    it("ignores punctuation, case, and spacing when comparing", () => {
      const out = dedupeLeadingHeading(
        "<h1>  the   PHYSICS of LoRA!  </h1><p>x</p>",
        "The Physics of LoRA"
      );
      expect(out).toBe("<p>x</p>");
    });

    it("matches through inline markup inside the heading", () => {
      const out = dedupeLeadingHeading(
        "<h1><span>Pocket</span> Flow</h1><p>x</p>",
        "Pocket Flow"
      );
      expect(out).toBe("<p>x</p>");
    });

    it("only ever removes the first heading", () => {
      const out = dedupeLeadingHeading(
        "<h1>Dup</h1><p>a</p><h1>Dup</h1><p>b</p>",
        "Dup"
      );
      expect(out).toBe("<p>a</p><h1>Dup</h1><p>b</p>");
    });

    it("is a no-op without a page heading", () => {
      const body = "<h1>Anything</h1><p>x</p>";
      expect(dedupeLeadingHeading(body, undefined)).toBe(body);
      expect(dedupeLeadingHeading(body, "   ")).toBe(body);
    });

    it("leaves a body with no h1 untouched", () => {
      const body = "<h2>Sub</h2><p>x</p>";
      expect(dedupeLeadingHeading(body, "Sub")).toBe(body);
    });

    it("does not remove a near-match that differs in words", () => {
      const body = "<h1>Hardware Diagnostics LLM Fine-Tuning</h1><p>x</p>";
      expect(
        dedupeLeadingHeading(body, "Computer Diagnostics via LLM Fine-Tuning")
      ).toBe(body);
    });
  });

  describe("end-to-end scoping of a realistic document", () => {
    it("keeps the real page safe from the embedded stylesheet", () => {
      const raw = `<html><head><title>T</title><style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI';background:#f0f2f5;padding:20px}
        h1{color:#1a3a5c}
        th,td{border:1px solid #d0d7de}
        tr:nth-child(even){background:#f6f8fa}
        @media (max-width:700px){.container{padding:16px}}
      </style></head><body><div class="container"><h1>X</h1></div></body></html>`;

      const parsed = parseStaticHtml(raw);
      const scoped = scopeCss(parsed.css, SCOPE);

      // No rule may target the document root or a bare element.
      expect(scoped).not.toMatch(/(^|})\s*body\s*\{/);
      expect(scoped).not.toMatch(/(^|})\s*h1\s*\{/);
      expect(scoped).not.toMatch(/(^|})\s*\*\s*\{/);

      // Every rule sits under the scope.
      expect(scoped).toContain(".static-html-content h1{");
      expect(scoped).toContain(".static-html-content th, .static-html-content td{");
      expect(scoped).toContain("@media (max-width:700px){.static-html-content .container{");

      // Content survives.
      expect(parsed.bodyHtml).toContain('<div class="container"><h1>X</h1></div>');
    });
  });
});
