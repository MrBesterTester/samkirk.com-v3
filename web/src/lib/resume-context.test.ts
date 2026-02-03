import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ResumeChunk } from "./resume-chunker";

// Mock the resume-chunker module before imports
vi.mock("./resume-chunker", async () => {
  const actual = await vi.importActual<typeof import("./resume-chunker")>(
    "./resume-chunker"
  );
  return {
    ...actual,
    getCurrentChunks: vi.fn(),
  };
});

// Import after mocking
import {
  formatChunkForContext,
  assembleContextFromChunks,
  getResumeContext,
  generateCitationsFromChunks,
  generateCitationsForReferencedChunks,
  createCitationMap,
  getContextSummary,
  isResumeContextAvailable,
  getResumeContextSize,
  type ResumeContextResult,
} from "./resume-context";
import { getCurrentChunks } from "./resume-chunker";

// ============================================================================
// Test Fixtures
// ============================================================================

const mockChunks: ResumeChunk[] = [
  {
    chunkId: "chunk_abc123",
    title: "Work Experience",
    sourceRef: "h2:Experience",
    content:
      "10+ years of software engineering experience at various companies including Google and startups.",
  },
  {
    chunkId: "chunk_def456",
    title: "Education",
    sourceRef: "h2:Education",
    content:
      "BS in Computer Science from Stanford University. MS in Machine Learning from MIT.",
  },
  {
    chunkId: "chunk_ghi789",
    title: "Skills",
    sourceRef: "h2:Skills",
    content:
      "TypeScript, Python, React, Node.js, AWS, GCP, Kubernetes, Machine Learning, RAG systems.",
  },
];

// ============================================================================
// formatChunkForContext Tests
// ============================================================================

describe("formatChunkForContext", () => {
  describe("detailed format (default)", () => {
    it("formats chunk with number, title, and source ref", () => {
      const result = formatChunkForContext(mockChunks[0], 0);

      expect(result).toContain("[CHUNK 1: Work Experience]");
      expect(result).toContain("Source: h2:Experience");
      expect(result).toContain("10+ years of software engineering");
    });

    it("includes chunk ID when includeChunkIds is true", () => {
      const result = formatChunkForContext(mockChunks[0], 0, {
        includeChunkIds: true,
      });

      expect(result).toContain("(ID: chunk_abc123)");
    });

    it("does not include chunk ID by default", () => {
      const result = formatChunkForContext(mockChunks[0], 0);

      expect(result).not.toContain("chunk_abc123");
    });

    it("uses 1-indexed chunk numbers", () => {
      expect(formatChunkForContext(mockChunks[0], 0)).toContain("[CHUNK 1:");
      expect(formatChunkForContext(mockChunks[1], 1)).toContain("[CHUNK 2:");
      expect(formatChunkForContext(mockChunks[2], 2)).toContain("[CHUNK 3:");
    });
  });

  describe("compact format", () => {
    it("formats with title header and content only", () => {
      const result = formatChunkForContext(mockChunks[0], 0, {
        format: "compact",
      });

      expect(result).toBe(
        "### Work Experience\n\n10+ years of software engineering experience at various companies including Google and startups."
      );
    });

    it("does not include source ref or chunk number", () => {
      const result = formatChunkForContext(mockChunks[0], 0, {
        format: "compact",
      });

      expect(result).not.toContain("CHUNK");
      expect(result).not.toContain("Source:");
    });
  });

  describe("minimal format", () => {
    it("returns only the content", () => {
      const result = formatChunkForContext(mockChunks[0], 0, {
        format: "minimal",
      });

      expect(result).toBe(
        "10+ years of software engineering experience at various companies including Google and startups."
      );
    });

    it("has no headers or metadata", () => {
      const result = formatChunkForContext(mockChunks[1], 1, {
        format: "minimal",
      });

      expect(result).not.toContain("Education");
      expect(result).not.toContain("CHUNK");
      expect(result).not.toContain("h2:");
    });
  });
});

// ============================================================================
// assembleContextFromChunks Tests
// ============================================================================

describe("assembleContextFromChunks", () => {
  describe("basic assembly", () => {
    it("returns empty result for empty chunks array", () => {
      const result = assembleContextFromChunks([]);

      expect(result.contextString).toBe("");
      expect(result.usedChunks).toEqual([]);
      expect(result.characterCount).toBe(0);
      expect(result.chunkCount).toBe(0);
    });

    it("assembles all chunks by default", () => {
      const result = assembleContextFromChunks(mockChunks);

      expect(result.chunkCount).toBe(3);
      expect(result.usedChunks).toEqual(mockChunks);
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it("joins chunks with separator", () => {
      const result = assembleContextFromChunks(mockChunks);

      expect(result.contextString).toContain("---");
      expect(result.contextString).toContain("[CHUNK 1:");
      expect(result.contextString).toContain("[CHUNK 2:");
      expect(result.contextString).toContain("[CHUNK 3:");
    });
  });

  describe("maxChunks option", () => {
    it("limits chunks when maxChunks is specified", () => {
      const result = assembleContextFromChunks(mockChunks, { maxChunks: 2 });

      expect(result.chunkCount).toBe(2);
      expect(result.usedChunks).toHaveLength(2);
      expect(result.contextString).toContain("[CHUNK 1:");
      expect(result.contextString).toContain("[CHUNK 2:");
      expect(result.contextString).not.toContain("[CHUNK 3:");
    });

    it("returns all chunks if maxChunks exceeds available", () => {
      const result = assembleContextFromChunks(mockChunks, { maxChunks: 100 });

      expect(result.chunkCount).toBe(3);
    });

    it("returns empty for maxChunks of 0", () => {
      const result = assembleContextFromChunks(mockChunks, { maxChunks: 0 });

      expect(result.chunkCount).toBe(0);
      expect(result.contextString).toBe("");
    });
  });

  describe("format options", () => {
    it("uses detailed format by default", () => {
      const result = assembleContextFromChunks(mockChunks);

      expect(result.contextString).toContain("[CHUNK");
      expect(result.contextString).toContain("Source:");
    });

    it("uses minimal format with double newlines as separator", () => {
      const result = assembleContextFromChunks(mockChunks, {
        format: "minimal",
      });

      // Minimal format has no separators with ---
      expect(result.contextString).not.toContain("---");
      expect(result.contextString).not.toContain("[CHUNK");
    });

    it("compact format includes headers but not source refs", () => {
      const result = assembleContextFromChunks(mockChunks, {
        format: "compact",
      });

      expect(result.contextString).toContain("### Work Experience");
      expect(result.contextString).toContain("### Education");
      expect(result.contextString).not.toContain("Source:");
    });
  });

  describe("characterCount accuracy", () => {
    it("accurately counts characters in context string", () => {
      const result = assembleContextFromChunks(mockChunks);

      expect(result.characterCount).toBe(result.contextString.length);
    });

    it("counts 0 for empty input", () => {
      const result = assembleContextFromChunks([]);

      expect(result.characterCount).toBe(0);
    });
  });
});

// ============================================================================
// getResumeContext Tests (with mocked getCurrentChunks)
// ============================================================================

describe("getResumeContext", () => {
  const mockedGetCurrentChunks = getCurrentChunks as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads chunks from Firestore and assembles context", async () => {
    mockedGetCurrentChunks.mockResolvedValue(mockChunks);

    const result = await getResumeContext();

    expect(mockedGetCurrentChunks).toHaveBeenCalledOnce();
    expect(result.chunkCount).toBe(3);
    expect(result.contextString).toContain("Work Experience");
  });

  it("passes options to assembleContextFromChunks", async () => {
    mockedGetCurrentChunks.mockResolvedValue(mockChunks);

    const result = await getResumeContext({
      maxChunks: 1,
      format: "compact",
    });

    expect(result.chunkCount).toBe(1);
    expect(result.contextString).toContain("### Work Experience");
    expect(result.contextString).not.toContain("Education");
  });

  it("returns empty result when no chunks available", async () => {
    mockedGetCurrentChunks.mockResolvedValue([]);

    const result = await getResumeContext();

    expect(result.chunkCount).toBe(0);
    expect(result.contextString).toBe("");
  });
});

// ============================================================================
// generateCitationsFromChunks Tests
// ============================================================================

describe("generateCitationsFromChunks", () => {
  it("generates citations for all chunks", () => {
    const citations = generateCitationsFromChunks(mockChunks);

    expect(citations).toHaveLength(3);
    expect(citations[0]).toEqual({
      chunkId: "chunk_abc123",
      title: "Work Experience",
      sourceRef: "h2:Experience",
    });
  });

  it("returns empty array for empty input", () => {
    const citations = generateCitationsFromChunks([]);

    expect(citations).toEqual([]);
  });

  it("preserves all citation fields from chunks", () => {
    const citations = generateCitationsFromChunks(mockChunks);

    for (let i = 0; i < mockChunks.length; i++) {
      expect(citations[i].chunkId).toBe(mockChunks[i].chunkId);
      expect(citations[i].title).toBe(mockChunks[i].title);
      expect(citations[i].sourceRef).toBe(mockChunks[i].sourceRef);
    }
  });

  it("does not include chunk content in citations", () => {
    const citations = generateCitationsFromChunks(mockChunks);

    for (const citation of citations) {
      expect(citation).not.toHaveProperty("content");
    }
  });
});

// ============================================================================
// generateCitationsForReferencedChunks Tests
// ============================================================================

describe("generateCitationsForReferencedChunks", () => {
  it("generates citations only for referenced chunk IDs", () => {
    const referencedIds = ["chunk_abc123", "chunk_ghi789"];
    const citations = generateCitationsForReferencedChunks(
      mockChunks,
      referencedIds
    );

    expect(citations).toHaveLength(2);
    expect(citations.map((c) => c.chunkId)).toEqual([
      "chunk_abc123",
      "chunk_ghi789",
    ]);
  });

  it("returns empty array when no IDs match", () => {
    const citations = generateCitationsForReferencedChunks(mockChunks, [
      "nonexistent_id",
    ]);

    expect(citations).toEqual([]);
  });

  it("returns empty array for empty reference list", () => {
    const citations = generateCitationsForReferencedChunks(mockChunks, []);

    expect(citations).toEqual([]);
  });

  it("handles duplicate IDs in reference list", () => {
    const referencedIds = ["chunk_abc123", "chunk_abc123", "chunk_def456"];
    const citations = generateCitationsForReferencedChunks(
      mockChunks,
      referencedIds
    );

    // Should filter to unique chunks
    expect(citations).toHaveLength(2);
  });

  it("preserves order based on chunks array, not reference order", () => {
    const referencedIds = ["chunk_ghi789", "chunk_abc123"];
    const citations = generateCitationsForReferencedChunks(
      mockChunks,
      referencedIds
    );

    // Order follows mockChunks order (abc123, def456, ghi789)
    expect(citations[0].chunkId).toBe("chunk_abc123");
    expect(citations[1].chunkId).toBe("chunk_ghi789");
  });
});

// ============================================================================
// createCitationMap Tests
// ============================================================================

describe("createCitationMap", () => {
  it("creates a map from chunk ID to citation", () => {
    const map = createCitationMap(mockChunks);

    expect(map.size).toBe(3);
    expect(map.has("chunk_abc123")).toBe(true);
    expect(map.has("chunk_def456")).toBe(true);
    expect(map.has("chunk_ghi789")).toBe(true);
  });

  it("returns correct citation for each ID", () => {
    const map = createCitationMap(mockChunks);

    const citation = map.get("chunk_abc123");
    expect(citation).toEqual({
      chunkId: "chunk_abc123",
      title: "Work Experience",
      sourceRef: "h2:Experience",
    });
  });

  it("returns undefined for non-existent ID", () => {
    const map = createCitationMap(mockChunks);

    expect(map.get("nonexistent")).toBeUndefined();
  });

  it("returns empty map for empty input", () => {
    const map = createCitationMap([]);

    expect(map.size).toBe(0);
  });
});

// ============================================================================
// getContextSummary Tests
// ============================================================================

describe("getContextSummary", () => {
  it("returns summary with chunk count and character count", () => {
    const result: ResumeContextResult = assembleContextFromChunks(mockChunks);
    const summary = getContextSummary(result);

    expect(summary).toContain("3 chunks");
    expect(summary).toMatch(/\d+ characters/);
    expect(summary).toContain("Sections:");
  });

  it("includes all chunk titles in summary", () => {
    const result: ResumeContextResult = assembleContextFromChunks(mockChunks);
    const summary = getContextSummary(result);

    expect(summary).toContain("Work Experience");
    expect(summary).toContain("Education");
    expect(summary).toContain("Skills");
  });

  it("handles empty context gracefully", () => {
    const emptyResult: ResumeContextResult = {
      contextString: "",
      usedChunks: [],
      characterCount: 0,
      chunkCount: 0,
    };
    const summary = getContextSummary(emptyResult);

    expect(summary).toContain("No resume context available");
    expect(summary).toContain("0 chunks");
  });

  it("formats character count with locale separator", () => {
    const largeResult: ResumeContextResult = {
      contextString: "x".repeat(10000),
      usedChunks: [mockChunks[0]],
      characterCount: 10000,
      chunkCount: 1,
    };
    const summary = getContextSummary(largeResult);

    // Should have comma separator for thousands
    expect(summary).toContain("10,000 characters");
  });
});

// ============================================================================
// isResumeContextAvailable Tests
// ============================================================================

describe("isResumeContextAvailable", () => {
  const mockedGetCurrentChunks = getCurrentChunks as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when chunks are available", async () => {
    mockedGetCurrentChunks.mockResolvedValue(mockChunks);

    const available = await isResumeContextAvailable();

    expect(available).toBe(true);
  });

  it("returns false when no chunks are available", async () => {
    mockedGetCurrentChunks.mockResolvedValue([]);

    const available = await isResumeContextAvailable();

    expect(available).toBe(false);
  });
});

// ============================================================================
// getResumeContextSize Tests
// ============================================================================

describe("getResumeContextSize", () => {
  const mockedGetCurrentChunks = getCurrentChunks as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns total character count across all chunks", async () => {
    mockedGetCurrentChunks.mockResolvedValue(mockChunks);

    const size = await getResumeContextSize();

    // Calculate expected size
    const expectedSize = mockChunks.reduce(
      (total, chunk) => total + chunk.content.length,
      0
    );
    expect(size).toBe(expectedSize);
  });

  it("returns 0 for empty chunks", async () => {
    mockedGetCurrentChunks.mockResolvedValue([]);

    const size = await getResumeContextSize();

    expect(size).toBe(0);
  });
});

// ============================================================================
// Integration-style Tests
// ============================================================================

describe("Context and Citation Integration", () => {
  it("context usedChunks can be passed directly to generateCitationsFromChunks", () => {
    const context = assembleContextFromChunks(mockChunks);
    const citations = generateCitationsFromChunks(context.usedChunks);

    expect(citations.length).toBe(context.chunkCount);
    expect(citations[0].chunkId).toBe(mockChunks[0].chunkId);
  });

  it("maxChunks option affects both context and subsequent citations", () => {
    const context = assembleContextFromChunks(mockChunks, { maxChunks: 2 });
    const citations = generateCitationsFromChunks(context.usedChunks);

    expect(context.chunkCount).toBe(2);
    expect(citations.length).toBe(2);
    expect(citations.map((c) => c.title)).toEqual([
      "Work Experience",
      "Education",
    ]);
  });

  it("citation map can look up citations from context usedChunks", () => {
    const context = assembleContextFromChunks(mockChunks);
    const citationMap = createCitationMap(context.usedChunks);

    // Simulate LLM referencing a chunk
    const referencedId = "chunk_def456";
    const citation = citationMap.get(referencedId);

    expect(citation).toBeDefined();
    expect(citation?.title).toBe("Education");
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("handles chunks with empty content", () => {
    const chunksWithEmpty: ResumeChunk[] = [
      {
        chunkId: "chunk_empty",
        title: "Empty Section",
        sourceRef: "h2:Empty",
        content: "",
      },
    ];

    const result = assembleContextFromChunks(chunksWithEmpty);

    expect(result.chunkCount).toBe(1);
    expect(result.contextString).toContain("Empty Section");
  });

  it("handles chunks with special characters in content", () => {
    const chunksWithSpecial: ResumeChunk[] = [
      {
        chunkId: "chunk_special",
        title: "Special & Chars",
        sourceRef: "h2:Special > Subsection",
        content: "Content with <tags>, \"quotes\", and 'apostrophes'.",
      },
    ];

    const result = assembleContextFromChunks(chunksWithSpecial);

    expect(result.contextString).toContain("<tags>");
    expect(result.contextString).toContain('"quotes"');
  });

  it("handles very long chunk titles", () => {
    const longTitle = "A".repeat(500);
    const chunksWithLongTitle: ResumeChunk[] = [
      {
        chunkId: "chunk_long",
        title: longTitle,
        sourceRef: "h2:Long",
        content: "Some content",
      },
    ];

    const result = assembleContextFromChunks(chunksWithLongTitle);

    expect(result.contextString).toContain(longTitle);
  });

  it("handles chunks with unicode content", () => {
    const unicodeChunks: ResumeChunk[] = [
      {
        chunkId: "chunk_unicode",
        title: "日本語タイトル",
        sourceRef: "h2:Unicode",
        content: "Emoji: 🚀 Chinese: 中文 Arabic: العربية",
      },
    ];

    const result = assembleContextFromChunks(unicodeChunks);
    const citations = generateCitationsFromChunks(unicodeChunks);

    expect(result.contextString).toContain("🚀");
    expect(citations[0].title).toBe("日本語タイトル");
  });
});
