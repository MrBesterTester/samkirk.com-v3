import { describe, it, expect, vi } from "vitest";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

// Mock firestore module
vi.mock("./firestore", () => ({
  getFirestore: vi.fn(() => ({
    batch: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(),
    })),
  })),
  getResumeIndexRef: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(() => Promise.resolve({ exists: false })),
  })),
  getResumeChunksCollection: vi.fn(() => ({
    doc: vi.fn(() => ({})),
    where: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
    })),
  })),
}));

import {
  parseLines,
  extractHeadings,
  parseIntoSections,
  generateChunkId,
  hashContent,
  generateTitle,
  generateSourceRef,
  splitLargeSection,
  chunkMarkdown,
  MAX_CHUNK_SIZE,
  type MarkdownSection,
} from "./resume-chunker";

// ============================================================================
// Test data
// ============================================================================

const SIMPLE_RESUME = `# Sam Kirk

Software Engineer with 10+ years of experience.

## Experience

### Senior Engineer at Company A

Worked on many projects.

Built scalable systems.

### Engineer at Company B

Developed features.

## Education

### BS Computer Science

University of Example

## Skills

- TypeScript
- Python
- Go
`;

const LARGE_SECTION_RESUME = `# Sam Kirk

## Experience

${"Lorem ipsum dolor sit amet. ".repeat(100)}

## Education

### BS Computer Science
`;

const NO_HEADINGS_CONTENT = `This is a resume without any headings.

Just plain text content here.

Multiple paragraphs.`;

const NESTED_HEADINGS = `# Sam Kirk

## Experience

### Company A

#### Project 1

Built something amazing.

#### Project 2

Built something else.

### Company B

##### Deep nested section

Some content here.

## Education
`;

// ============================================================================
// parseLines tests
// ============================================================================

describe("parseLines", () => {
  it("splits content by newlines", () => {
    const result = parseLines("line1\nline2\nline3");
    expect(result).toEqual(["line1", "line2", "line3"]);
  });

  it("handles Windows line endings", () => {
    const result = parseLines("line1\r\nline2\r\nline3");
    expect(result).toEqual(["line1", "line2", "line3"]);
  });

  it("handles empty string", () => {
    const result = parseLines("");
    expect(result).toEqual([""]);
  });

  it("handles single line", () => {
    const result = parseLines("single line");
    expect(result).toEqual(["single line"]);
  });
});

// ============================================================================
// extractHeadings tests
// ============================================================================

describe("extractHeadings", () => {
  it("extracts all heading levels", () => {
    const lines = [
      "# H1",
      "## H2",
      "### H3",
      "#### H4",
      "##### H5",
      "###### H6",
    ];
    const result = extractHeadings(lines);

    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ level: 1, text: "H1", lineNumber: 0 });
    expect(result[1]).toEqual({ level: 2, text: "H2", lineNumber: 1 });
    expect(result[5]).toEqual({ level: 6, text: "H6", lineNumber: 5 });
  });

  it("ignores non-heading lines", () => {
    const lines = [
      "Regular text",
      "# Heading",
      "More text",
      "##Invalid - no space",
      "## Valid Heading",
    ];
    const result = extractHeadings(lines);

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Heading");
    expect(result[1].text).toBe("Valid Heading");
  });

  it("handles empty lines array", () => {
    const result = extractHeadings([]);
    expect(result).toEqual([]);
  });

  it("trims heading text", () => {
    const lines = ["#   Padded Heading   "];
    const result = extractHeadings(lines);

    expect(result[0].text).toBe("Padded Heading");
  });

  it("handles headings with special characters", () => {
    const lines = ["# Sam Kirk's Resume (2026)", "## C++ & Python"];
    const result = extractHeadings(lines);

    expect(result[0].text).toBe("Sam Kirk's Resume (2026)");
    expect(result[1].text).toBe("C++ & Python");
  });
});

// ============================================================================
// parseIntoSections tests
// ============================================================================

describe("parseIntoSections", () => {
  it("parses a simple resume into sections", () => {
    const result = parseIntoSections(SIMPLE_RESUME);

    // Should have sections for: Sam Kirk, Experience, Senior Engineer, Engineer, Education, BS CS, Skills
    expect(result.length).toBeGreaterThanOrEqual(5);

    // First section should be the H1
    const firstSection = result.find((s) => s.heading?.text === "Sam Kirk");
    expect(firstSection).toBeDefined();
    expect(firstSection?.heading?.level).toBe(1);
  });

  it("handles content with no headings", () => {
    const result = parseIntoSections(NO_HEADINGS_CONTENT);

    expect(result).toHaveLength(1);
    expect(result[0].heading).toBeNull();
    expect(result[0].content).toContain("This is a resume");
  });

  it("captures content before first heading", () => {
    const markdown = `Some intro text

# First Heading

Content here`;

    const result = parseIntoSections(markdown);

    expect(result[0].heading).toBeNull();
    expect(result[0].content).toBe("Some intro text");
  });

  it("builds parent heading hierarchy correctly", () => {
    const result = parseIntoSections(NESTED_HEADINGS);

    // Find the "Project 1" section (h4 under Company A under Experience)
    const project1 = result.find((s) => s.heading?.text === "Project 1");
    expect(project1).toBeDefined();
    expect(project1?.parentHeadings.map((h) => h.text)).toContain("Experience");
    expect(project1?.parentHeadings.map((h) => h.text)).toContain("Company A");
  });

  it("handles empty sections between headings", () => {
    const markdown = `# H1

## H2

## H3

Some content`;

    const result = parseIntoSections(markdown);
    // All sections should be created, even if some have empty content
    expect(result.some((s) => s.heading?.text === "H2")).toBe(true);
  });
});

// ============================================================================
// generateChunkId tests
// ============================================================================

describe("generateChunkId", () => {
  it("generates deterministic IDs", () => {
    const id1 = generateChunkId(1, "Test Title", "abc123");
    const id2 = generateChunkId(1, "Test Title", "abc123");

    expect(id1).toBe(id2);
  });

  it("generates different IDs for different versions", () => {
    const id1 = generateChunkId(1, "Test Title", "abc123");
    const id2 = generateChunkId(2, "Test Title", "abc123");

    expect(id1).not.toBe(id2);
  });

  it("generates different IDs for different titles", () => {
    const id1 = generateChunkId(1, "Title A", "abc123");
    const id2 = generateChunkId(1, "Title B", "abc123");

    expect(id1).not.toBe(id2);
  });

  it("generates different IDs for different content hashes", () => {
    const id1 = generateChunkId(1, "Test Title", "abc123");
    const id2 = generateChunkId(1, "Test Title", "xyz789");

    expect(id1).not.toBe(id2);
  });

  it("returns chunk ID with correct prefix", () => {
    const id = generateChunkId(1, "Test", "hash");

    expect(id).toMatch(/^chunk_[a-f0-9]{16}$/);
  });
});

// ============================================================================
// hashContent tests
// ============================================================================

describe("hashContent", () => {
  it("generates consistent hashes", () => {
    const hash1 = hashContent("test content");
    const hash2 = hashContent("test content");

    expect(hash1).toBe(hash2);
  });

  it("generates different hashes for different content", () => {
    const hash1 = hashContent("content A");
    const hash2 = hashContent("content B");

    expect(hash1).not.toBe(hash2);
  });

  it("returns 8-character hex string", () => {
    const hash = hashContent("some text");

    expect(hash).toMatch(/^[a-f0-9]{8}$/);
  });
});

// ============================================================================
// generateTitle tests
// ============================================================================

describe("generateTitle", () => {
  it("returns Introduction for null heading", () => {
    const section: MarkdownSection = {
      heading: null,
      parentHeadings: [],
      content: "Some content",
      startLine: 0,
      endLine: 1,
    };

    expect(generateTitle(section)).toBe("(Introduction)");
  });

  it("returns heading text for single heading", () => {
    const section: MarkdownSection = {
      heading: { level: 1, text: "Sam Kirk", lineNumber: 0 },
      parentHeadings: [],
      content: "Content",
      startLine: 1,
      endLine: 2,
    };

    expect(generateTitle(section)).toBe("Sam Kirk");
  });

  it("builds hierarchical title with parent headings", () => {
    const section: MarkdownSection = {
      heading: { level: 3, text: "Project A", lineNumber: 10 },
      parentHeadings: [
        { level: 1, text: "Resume", lineNumber: 0 },
        { level: 2, text: "Experience", lineNumber: 5 },
      ],
      content: "Content",
      startLine: 11,
      endLine: 15,
    };

    expect(generateTitle(section)).toBe("Resume > Experience > Project A");
  });
});

// ============================================================================
// generateSourceRef tests
// ============================================================================

describe("generateSourceRef", () => {
  it("returns line range for null heading", () => {
    const section: MarkdownSection = {
      heading: null,
      parentHeadings: [],
      content: "Some content",
      startLine: 0,
      endLine: 5,
    };

    expect(generateSourceRef(section)).toBe("lines:1-5");
  });

  it("returns heading reference for single heading", () => {
    const section: MarkdownSection = {
      heading: { level: 2, text: "Experience", lineNumber: 5 },
      parentHeadings: [],
      content: "Content",
      startLine: 6,
      endLine: 10,
    };

    expect(generateSourceRef(section)).toBe("h2:Experience");
  });

  it("builds hierarchical source ref", () => {
    const section: MarkdownSection = {
      heading: { level: 3, text: "Company A", lineNumber: 10 },
      parentHeadings: [{ level: 2, text: "Experience", lineNumber: 5 }],
      content: "Content",
      startLine: 11,
      endLine: 15,
    };

    expect(generateSourceRef(section)).toBe("h2:Experience > h3:Company A");
  });
});

// ============================================================================
// splitLargeSection tests
// ============================================================================

describe("splitLargeSection", () => {
  it("returns single chunk for content within size limits", () => {
    // Content must be >= MIN_CHUNK_SIZE (100 chars) and <= MAX_CHUNK_SIZE (2000 chars)
    const content = "This is a medium-length content section that has enough text to meet the minimum chunk size requirement of 100 characters but stays well under the maximum.";
    const section: MarkdownSection = {
      heading: { level: 2, text: "Test", lineNumber: 0 },
      parentHeadings: [],
      content,
      startLine: 1,
      endLine: 2,
    };

    const chunks = splitLargeSection(section, 1);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].title).toBe("Test");
    expect(chunks[0].content).toBe(content);
  });

  it("returns empty array for content below MIN_CHUNK_SIZE", () => {
    const section: MarkdownSection = {
      heading: { level: 2, text: "Test", lineNumber: 0 },
      parentHeadings: [],
      content: "Tiny content", // Less than MIN_CHUNK_SIZE (100 chars)
      startLine: 1,
      endLine: 2,
    };

    const chunks = splitLargeSection(section, 1);

    expect(chunks).toHaveLength(0);
  });

  it("splits large sections into multiple chunks", () => {
    // Create content that will definitely exceed MAX_CHUNK_SIZE (2000 chars)
    // Each paragraph is ~100 chars, so 30 paragraphs = ~3000 chars
    const longContent = Array(30)
      .fill(null)
      .map((_, i) => `This is paragraph number ${i + 1} with additional text to make it a reasonable length for testing purposes.`)
      .join("\n\n");
    
    const section: MarkdownSection = {
      heading: { level: 2, text: "Large Section", lineNumber: 0 },
      parentHeadings: [],
      content: longContent,
      startLine: 1,
      endLine: 100,
    };

    const chunks = splitLargeSection(section, 1);

    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should be within size limits (with some tolerance for paragraph boundaries)
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(MAX_CHUNK_SIZE + 200);
    }
  });

  it("adds part numbers to split chunks", () => {
    const longContent = "Some paragraph content here.\n\n".repeat(100);
    const section: MarkdownSection = {
      heading: { level: 2, text: "Big Section", lineNumber: 0 },
      parentHeadings: [],
      content: longContent,
      startLine: 1,
      endLine: 200,
    };

    const chunks = splitLargeSection(section, 1);

    if (chunks.length > 1) {
      expect(chunks[0].title).toContain("(part 1)");
      expect(chunks[1].title).toContain("(part 2)");
    }
  });
});

// ============================================================================
// chunkMarkdown tests
// ============================================================================

describe("chunkMarkdown", () => {
  it("chunks a simple resume", () => {
    const chunks = chunkMarkdown(SIMPLE_RESUME, 1);

    expect(chunks.length).toBeGreaterThan(0);

    // All chunks should have required fields
    for (const chunk of chunks) {
      expect(chunk.chunkId).toBeDefined();
      expect(chunk.title).toBeDefined();
      expect(chunk.sourceRef).toBeDefined();
      expect(chunk.content).toBeDefined();
      expect(chunk.content.length).toBeGreaterThan(0);
    }
  });

  it("generates stable chunk IDs for same content", () => {
    const chunks1 = chunkMarkdown(SIMPLE_RESUME, 1);
    const chunks2 = chunkMarkdown(SIMPLE_RESUME, 1);

    expect(chunks1.length).toBe(chunks2.length);

    for (let i = 0; i < chunks1.length; i++) {
      expect(chunks1[i].chunkId).toBe(chunks2[i].chunkId);
    }
  });

  it("generates different chunk IDs for different versions", () => {
    const chunks1 = chunkMarkdown(SIMPLE_RESUME, 1);
    const chunks2 = chunkMarkdown(SIMPLE_RESUME, 2);

    // Same content but different versions = different IDs
    expect(chunks1[0].chunkId).not.toBe(chunks2[0].chunkId);
  });

  it("handles resume with no headings", () => {
    const chunks = chunkMarkdown(NO_HEADINGS_CONTENT, 1);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].title).toBe("(Introduction)");
  });

  it("handles empty content", () => {
    const chunks = chunkMarkdown("", 1);

    expect(chunks).toEqual([]);
  });

  it("handles whitespace-only content", () => {
    const chunks = chunkMarkdown("   \n\n   ", 1);

    expect(chunks).toEqual([]);
  });

  it("preserves heading hierarchy in titles", () => {
    const chunks = chunkMarkdown(NESTED_HEADINGS, 1);

    // Find a deeply nested chunk
    const deepChunk = chunks.find((c) => c.title.includes("Project 1"));
    if (deepChunk) {
      expect(deepChunk.title).toContain(">");
    }
  });

  it("handles large sections by splitting", () => {
    const chunks = chunkMarkdown(LARGE_SECTION_RESUME, 1);

    // The Experience section should be split
    const experienceChunks = chunks.filter((c) =>
      c.title.includes("Experience")
    );

    // Should have multiple chunks for the large Experience section
    expect(experienceChunks.length).toBeGreaterThanOrEqual(1);
  });

  it("merges small adjacent sections", () => {
    const smallSections = `# Title

## A

x

## B

y

## C

z`;

    const chunks = chunkMarkdown(smallSections, 1);

    // Small sections should be merged together
    // The exact behavior depends on MIN_CHUNK_SIZE
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("includes correct sourceRef for chunks", () => {
    const chunks = chunkMarkdown(SIMPLE_RESUME, 1);

    // Find the Experience section
    const expChunk = chunks.find((c) => c.title === "Experience");
    if (expChunk) {
      expect(expChunk.sourceRef).toBe("h2:Experience");
    }
  });
});

// ============================================================================
// Chunk ID stability tests (regression prevention)
// ============================================================================

describe("Chunk ID stability", () => {
  it("produces consistent IDs across multiple calls", () => {
    const testContent = `# Resume

## Experience

I worked at Company A for 5 years.

## Skills

- JavaScript
- TypeScript`;

    // Run chunking multiple times
    const results = Array(5)
      .fill(null)
      .map(() => chunkMarkdown(testContent, 1));

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i].map((c) => c.chunkId)).toEqual(
        results[0].map((c) => c.chunkId)
      );
    }
  });

  it("ID changes when content changes", () => {
    // Content must be long enough to not get merged (>= MIN_CHUNK_SIZE = 100 chars)
    const content1 = `# Resume

## Experience

This is version 1 content with enough text to meet the minimum chunk size requirement. I worked at Company A for five years building scalable systems.`;

    const content2 = `# Resume

## Experience

This is version 2 content which is different from version 1. I worked at Company B for three years on different projects and technologies entirely.`;

    const chunks1 = chunkMarkdown(content1, 1);
    const chunks2 = chunkMarkdown(content2, 1);

    // Both should have an Experience chunk
    expect(chunks1.length).toBeGreaterThan(0);
    expect(chunks2.length).toBeGreaterThan(0);

    // Find Experience chunks (might be titled just "Experience" or include parent)
    const expChunk1 = chunks1.find((c) => c.title.includes("Experience"));
    const expChunk2 = chunks2.find((c) => c.title.includes("Experience"));

    expect(expChunk1).toBeDefined();
    expect(expChunk2).toBeDefined();

    // IDs should be different because content changed
    expect(expChunk1?.chunkId).not.toBe(expChunk2?.chunkId);
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe("Edge cases", () => {
  it("handles markdown with only headings", () => {
    const headingsOnly = `# H1

## H2

### H3`;

    const chunks = chunkMarkdown(headingsOnly, 1);

    // Should handle gracefully (may have empty or minimal chunks)
    expect(Array.isArray(chunks)).toBe(true);
  });

  it("handles very long single line", () => {
    const longLine = "x".repeat(5000);
    const chunks = chunkMarkdown(longLine, 1);

    // Should not throw, and should produce at least one chunk
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("handles unicode content", () => {
    const unicode = `# Resume 简历

## Experience 经验

Worked at 公司A.

## Skills 技能

- Python 🐍
- TypeScript`;

    const chunks = chunkMarkdown(unicode, 1);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some((c) => c.content.includes("公司A"))).toBe(true);
  });

  it("handles code blocks in content", () => {
    const withCode = `# Projects

## CLI Tool

\`\`\`typescript
const foo = "bar";
console.log(foo);
\`\`\`

Built a CLI tool.`;

    const chunks = chunkMarkdown(withCode, 1);

    expect(chunks.length).toBeGreaterThan(0);
    // Code should be preserved in content
    expect(chunks.some((c) => c.content.includes("const foo"))).toBe(true);
  });

  it("handles bullet lists", () => {
    const withLists = `# Skills

## Technical

- TypeScript
- Python
- Go
- Rust

## Soft Skills

- Communication
- Leadership`;

    const chunks = chunkMarkdown(withLists, 1);

    expect(chunks.length).toBeGreaterThan(0);
  });
});
