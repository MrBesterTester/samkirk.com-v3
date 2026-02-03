import { describe, it, expect, vi } from "vitest";
import {
  renderMarkdown,
  renderMarkdownSync,
  renderCitationsHtml,
  renderCitationsMarkdown,
  appendCitationsToMarkdown,
  renderMarkdownWithCitations,
  sanitizeHtml,
  escapeHtml,
  wrapInDocument,
  DEFAULT_MARKDOWN_CSS,
  type Citation,
} from "./markdown-renderer";

// Mock server-only to allow testing
vi.mock("server-only", () => ({}));

describe("markdown-renderer", () => {
  describe("renderMarkdown", () => {
    it("renders basic markdown to HTML", () => {
      const markdown = "# Hello World\n\nThis is a paragraph.";
      const html = renderMarkdown(markdown);

      expect(html).toContain("<h1>");
      expect(html).toContain("Hello World");
      expect(html).toContain("<p>");
      expect(html).toContain("This is a paragraph.");
    });

    it("renders headings correctly", () => {
      const markdown = `# H1
## H2
### H3
#### H4
##### H5
###### H6`;
      const html = renderMarkdown(markdown);

      expect(html).toContain("<h1>");
      expect(html).toContain("<h2>");
      expect(html).toContain("<h3>");
      expect(html).toContain("<h4>");
      expect(html).toContain("<h5>");
      expect(html).toContain("<h6>");
    });

    it("renders lists correctly", () => {
      const markdown = `- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third`;
      const html = renderMarkdown(markdown);

      expect(html).toContain("<ul>");
      expect(html).toContain("<li>");
      expect(html).toContain("Item 1");
      expect(html).toContain("<ol>");
      expect(html).toContain("First");
    });

    it("renders bold and italic text", () => {
      const markdown =
        "This is **bold** and this is *italic* and this is ***both***.";
      const html = renderMarkdown(markdown);

      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
    });

    it("renders links correctly", () => {
      const markdown = "[Google](https://google.com)";
      const html = renderMarkdown(markdown);

      expect(html).toContain('<a href="https://google.com"');
      expect(html).toContain("Google</a>");
    });

    it("renders code blocks correctly", () => {
      const markdown = "```javascript\nconst x = 1;\n```";
      const html = renderMarkdown(markdown);

      expect(html).toContain("<pre>");
      expect(html).toContain("<code");
      expect(html).toContain("const x = 1;");
    });

    it("renders inline code correctly", () => {
      const markdown = "Use the `console.log()` function.";
      const html = renderMarkdown(markdown);

      expect(html).toContain("<code>console.log()</code>");
    });

    it("renders blockquotes correctly", () => {
      const markdown = "> This is a quote";
      const html = renderMarkdown(markdown);

      expect(html).toContain("<blockquote>");
      expect(html).toContain("This is a quote");
    });

    it("renders horizontal rules correctly", () => {
      const markdown = "Above\n\n---\n\nBelow";
      const html = renderMarkdown(markdown);

      expect(html).toContain("<hr");
    });

    it("renders tables correctly (GFM)", () => {
      const markdown = `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`;
      const html = renderMarkdown(markdown);

      expect(html).toContain("<table>");
      expect(html).toContain("<th>");
      expect(html).toContain("Header 1");
      expect(html).toContain("<td>");
      expect(html).toContain("Cell 1");
    });

    it("sanitizes output by default", () => {
      const markdown = '<script>alert("xss")</script>\n\nSafe content';
      const html = renderMarkdown(markdown);

      expect(html).not.toContain("<script>");
      expect(html).toContain("Safe content");
    });

    it("respects sanitize: false option", () => {
      const markdown = '<div onclick="evil()">Click</div>';
      const html = renderMarkdown(markdown, { sanitize: false });

      // When sanitize is false, we get raw output from marked
      expect(html).toContain("onclick");
    });
  });

  describe("renderMarkdown with fullDocument option", () => {
    it("returns fragment without fullDocument", () => {
      const markdown = "# Hello";
      const html = renderMarkdown(markdown, { fullDocument: false });

      expect(html).not.toContain("<!DOCTYPE");
      expect(html).not.toContain("<html");
      expect(html).not.toContain("<head>");
    });

    it("returns full document with fullDocument: true", () => {
      const markdown = "# Hello";
      const html = renderMarkdown(markdown, { fullDocument: true });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</html>");
    });

    it("includes title in document", () => {
      const markdown = "# Content";
      const html = renderMarkdown(markdown, {
        fullDocument: true,
        title: "My Document",
      });

      expect(html).toContain("<title>My Document</title>");
    });

    it("escapes title to prevent XSS", () => {
      const markdown = "# Content";
      const html = renderMarkdown(markdown, {
        fullDocument: true,
        title: '<script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain("&lt;script&gt;");
    });

    it("includes default CSS", () => {
      const markdown = "# Content";
      const html = renderMarkdown(markdown, { fullDocument: true });

      expect(html).toContain("<style>");
      expect(html).toContain("font-family");
    });

    it("allows custom CSS", () => {
      const markdown = "# Content";
      const customCss = "body { background: red; }";
      const html = renderMarkdown(markdown, {
        fullDocument: true,
        customCss,
      });

      expect(html).toContain(customCss);
    });
  });

  describe("renderMarkdownSync", () => {
    it("is an alias for renderMarkdown", () => {
      const markdown = "# Test";
      const sync = renderMarkdownSync(markdown);
      const regular = renderMarkdown(markdown);

      expect(sync).toBe(regular);
    });
  });

  describe("sanitizeHtml", () => {
    it("removes script tags", () => {
      const html = '<script>alert("xss")</script><p>Safe</p>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("removes style tags", () => {
      const html = "<style>body{display:none}</style><p>Safe</p>";
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain("<style>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("removes event handlers", () => {
      const html = '<div onclick="alert(1)">Click</div>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain("onclick");
    });

    it("removes javascript: URLs from href", () => {
      const html = '<a href="javascript:alert(1)">Link</a>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain("javascript:");
    });

    it("allows http and https URLs", () => {
      const html = '<a href="https://example.com">Link</a>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).toContain('href="https://example.com"');
    });

    it("allows mailto URLs", () => {
      const html = '<a href="mailto:test@example.com">Email</a>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).toContain("mailto:test@example.com");
    });

    it("allows relative URLs", () => {
      const html = '<a href="/page">Link</a>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).toContain('href="/page"');
    });

    it("strips disallowed tags but preserves content", () => {
      const html = "<iframe>Content</iframe>";
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain("<iframe>");
      expect(sanitized).not.toContain("</iframe>");
    });

    it("allows standard HTML tags", () => {
      const html =
        "<h1>Title</h1><p>Para</p><ul><li>Item</li></ul><strong>Bold</strong>";
      const sanitized = sanitizeHtml(html);

      expect(sanitized).toContain("<h1>");
      expect(sanitized).toContain("<p>");
      expect(sanitized).toContain("<ul>");
      expect(sanitized).toContain("<li>");
      expect(sanitized).toContain("<strong>");
    });

    it("handles nested script tags", () => {
      const html =
        '<script><script>nested</script></script><p>Safe</p>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("handles multiple event handlers", () => {
      const html =
        '<div onclick="a()" onmouseover="b()" onfocus="c()">Test</div>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain("onclick");
      expect(sanitized).not.toContain("onmouseover");
      expect(sanitized).not.toContain("onfocus");
    });
  });

  describe("escapeHtml", () => {
    it("escapes ampersands", () => {
      expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    it("escapes less than", () => {
      expect(escapeHtml("a < b")).toBe("a &lt; b");
    });

    it("escapes greater than", () => {
      expect(escapeHtml("a > b")).toBe("a &gt; b");
    });

    it("escapes double quotes", () => {
      expect(escapeHtml('He said "hello"')).toBe(
        "He said &quot;hello&quot;"
      );
    });

    it("escapes single quotes", () => {
      expect(escapeHtml("It's fine")).toBe("It&#039;s fine");
    });

    it("handles all special chars together", () => {
      const input = '<script>"alert(\'xss\');"</script>';
      const expected =
        "&lt;script&gt;&quot;alert(&#039;xss&#039;);&quot;&lt;/script&gt;";
      expect(escapeHtml(input)).toBe(expected);
    });

    it("handles empty string", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("wrapInDocument", () => {
    it("wraps content in full HTML document", () => {
      const html = wrapInDocument("<h1>Hello</h1>", "Test Title");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html lang=\"en\">");
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain("<title>Test Title</title>");
      expect(html).toContain("<style>");
      expect(html).toContain("<body>");
      expect(html).toContain("<h1>Hello</h1>");
      expect(html).toContain("</html>");
    });

    it("uses default CSS when not provided", () => {
      const html = wrapInDocument("<p>Content</p>", "Title");

      expect(html).toContain("font-family");
    });

    it("uses custom CSS when provided", () => {
      const customCss = "body { color: blue; }";
      const html = wrapInDocument("<p>Content</p>", "Title", customCss);

      expect(html).toContain(customCss);
      expect(html).not.toContain(DEFAULT_MARKDOWN_CSS);
    });
  });

  describe("renderCitationsHtml", () => {
    const citations: Citation[] = [
      { chunkId: "c1", title: "Experience", sourceRef: "h2:Experience" },
      { chunkId: "c2", title: "Skills", sourceRef: "h2:Skills" },
    ];

    it("renders empty string for no citations", () => {
      expect(renderCitationsHtml([])).toBe("");
    });

    it("renders citation section with heading", () => {
      const html = renderCitationsHtml(citations);

      expect(html).toContain("citation-section");
      expect(html).toContain("<h2>Citations</h2>");
    });

    it("renders all citations", () => {
      const html = renderCitationsHtml(citations);

      expect(html).toContain("Experience");
      expect(html).toContain("Skills");
      expect(html).toContain("h2:Experience");
      expect(html).toContain("h2:Skills");
    });

    it("numbers citations sequentially", () => {
      const html = renderCitationsHtml(citations);

      expect(html).toContain("[1]");
      expect(html).toContain("[2]");
    });

    it("escapes HTML in citation content", () => {
      const maliciousCitations: Citation[] = [
        {
          chunkId: "c1",
          title: '<script>alert("xss")</script>',
          sourceRef: "<img onerror=alert(1)>",
        },
      ];
      const html = renderCitationsHtml(maliciousCitations);

      // Should escape the < and > characters
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&lt;img");
    });
  });

  describe("renderCitationsMarkdown", () => {
    const citations: Citation[] = [
      { chunkId: "c1", title: "Experience", sourceRef: "h2:Experience" },
      { chunkId: "c2", title: "Skills", sourceRef: "h2:Skills" },
    ];

    it("returns empty string for no citations", () => {
      expect(renderCitationsMarkdown([])).toBe("");
    });

    it("includes Citations heading", () => {
      const md = renderCitationsMarkdown(citations);

      expect(md).toContain("## Citations");
    });

    it("includes horizontal rule separator", () => {
      const md = renderCitationsMarkdown(citations);

      expect(md).toContain("---");
    });

    it("renders all citations with numbers", () => {
      const md = renderCitationsMarkdown(citations);

      expect(md).toContain("[1]");
      expect(md).toContain("[2]");
      expect(md).toContain("**Experience**");
      expect(md).toContain("**Skills**");
      expect(md).toContain("(h2:Experience)");
      expect(md).toContain("(h2:Skills)");
    });
  });

  describe("appendCitationsToMarkdown", () => {
    it("returns original markdown when no citations", () => {
      const markdown = "# Title\n\nContent";
      const result = appendCitationsToMarkdown(markdown, []);

      expect(result).toBe(markdown);
    });

    it("appends citations section", () => {
      const markdown = "# Title\n\nContent";
      const citations: Citation[] = [
        { chunkId: "c1", title: "Source", sourceRef: "ref" },
      ];
      const result = appendCitationsToMarkdown(markdown, citations);

      expect(result).toContain("# Title");
      expect(result).toContain("## Citations");
      expect(result).toContain("**Source**");
    });
  });

  describe("renderMarkdownWithCitations", () => {
    it("renders markdown with citations as full document", () => {
      const markdown = "# Report\n\nThis is the report content.";
      const citations: Citation[] = [
        { chunkId: "c1", title: "Experience", sourceRef: "h2:Experience" },
      ];

      const html = renderMarkdownWithCitations(markdown, citations, "Report");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>Report</title>");
      expect(html).toContain("<h1>");
      expect(html).toContain("Report");
      expect(html).toContain("citation-section");
      expect(html).toContain("Experience");
    });

    it("works without citations", () => {
      const markdown = "# Title";
      const html = renderMarkdownWithCitations(markdown, [], "Title");

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<h1>");
      // The CSS will include .citation-section, but the actual div should not be present
      expect(html).not.toContain('<div class="citation-section">');
    });

    it("uses default title", () => {
      const markdown = "# Content";
      const html = renderMarkdownWithCitations(markdown, []);

      expect(html).toContain("<title>Document</title>");
    });
  });

  describe("DEFAULT_MARKDOWN_CSS", () => {
    it("contains essential styling", () => {
      expect(DEFAULT_MARKDOWN_CSS).toContain("font-family");
      expect(DEFAULT_MARKDOWN_CSS).toContain("body");
      expect(DEFAULT_MARKDOWN_CSS).toContain("h1");
      expect(DEFAULT_MARKDOWN_CSS).toContain("p");
      expect(DEFAULT_MARKDOWN_CSS).toContain("code");
      expect(DEFAULT_MARKDOWN_CSS).toContain("blockquote");
    });

    it("contains citation-specific styling", () => {
      expect(DEFAULT_MARKDOWN_CSS).toContain(".citation-section");
      expect(DEFAULT_MARKDOWN_CSS).toContain(".citation-item");
    });
  });
});
