import "server-only";

import { createHash } from "crypto";
import { Timestamp } from "@google-cloud/firestore";
import {
  getFirestore,
  getResumeIndexRef,
  getResumeChunksCollection,
  ResumeChunkDoc,
  ResumeIndexDoc,
} from "./firestore";

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum chunk size in characters.
 * Target ~2000 chars to keep chunks manageable for LLM context.
 */
export const MAX_CHUNK_SIZE = 2000;

/**
 * Minimum chunk size to avoid tiny fragments.
 * Chunks smaller than this will be merged with adjacent content.
 */
export const MIN_CHUNK_SIZE = 100;

// ============================================================================
// Types
// ============================================================================

/**
 * A parsed heading from markdown content.
 */
export interface MarkdownHeading {
  /** Heading level (1-6) */
  level: number;
  /** The heading text without the # markers */
  text: string;
  /** Line number where the heading appears (0-indexed) */
  lineNumber: number;
}

/**
 * A section of markdown content identified by its heading hierarchy.
 */
export interface MarkdownSection {
  /** The heading for this section */
  heading: MarkdownHeading | null;
  /** Parent headings forming the path to this section */
  parentHeadings: MarkdownHeading[];
  /** The content of this section (excluding child sections) */
  content: string;
  /** Starting line number (0-indexed) */
  startLine: number;
  /** Ending line number (0-indexed, exclusive) */
  endLine: number;
}

/**
 * A chunk ready for storage with all required metadata.
 */
export interface ResumeChunk {
  /** Unique identifier for this chunk (deterministic hash) */
  chunkId: string;
  /** Human-readable title derived from heading hierarchy */
  title: string;
  /** Source reference (heading path or line range) */
  sourceRef: string;
  /** The actual text content of the chunk */
  content: string;
}

/**
 * Result of chunking a resume document.
 */
export interface ChunkingResult {
  /** Array of chunks extracted from the document */
  chunks: ResumeChunk[];
  /** Version number assigned to this chunking */
  version: number;
}

// ============================================================================
// Parsing functions
// ============================================================================

/**
 * Parse markdown content into lines.
 */
export function parseLines(markdown: string): string[] {
  return markdown.split(/\r?\n/);
}

/**
 * Extract headings from markdown lines.
 */
export function extractHeadings(lines: string[]): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = headingRegex.exec(line);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineNumber: i,
      });
    }
  }

  return headings;
}

/**
 * Parse markdown into sections based on headings.
 * Each section contains content from its heading until the next heading of same or higher level.
 */
export function parseIntoSections(markdown: string): MarkdownSection[] {
  const lines = parseLines(markdown);
  const headings = extractHeadings(lines);
  const sections: MarkdownSection[] = [];

  // If no headings, return the entire content as a single section
  if (headings.length === 0) {
    const content = markdown.trim();
    if (content.length > 0) {
      sections.push({
        heading: null,
        parentHeadings: [],
        content,
        startLine: 0,
        endLine: lines.length,
      });
    }
    return sections;
  }

  // Handle content before the first heading
  if (headings[0].lineNumber > 0) {
    const preContent = lines.slice(0, headings[0].lineNumber).join("\n").trim();
    if (preContent.length > 0) {
      sections.push({
        heading: null,
        parentHeadings: [],
        content: preContent,
        startLine: 0,
        endLine: headings[0].lineNumber,
      });
    }
  }

  // Process each heading
  for (let i = 0; i < headings.length; i++) {
    const currentHeading = headings[i];
    const nextHeading = headings[i + 1];

    // Determine parent headings (all headings of lower level before this one)
    const parentHeadings: MarkdownHeading[] = [];
    for (let j = i - 1; j >= 0; j--) {
      if (headings[j].level < currentHeading.level) {
        parentHeadings.unshift(headings[j]);
        // Stop when we find a level 1 heading
        if (headings[j].level === 1) break;
      }
    }

    // Content starts after the heading line
    const startLine = currentHeading.lineNumber + 1;
    const endLine = nextHeading ? nextHeading.lineNumber : lines.length;

    // Extract content (excluding the heading line itself)
    const contentLines = lines.slice(startLine, endLine);
    const content = contentLines.join("\n").trim();

    sections.push({
      heading: currentHeading,
      parentHeadings,
      content,
      startLine,
      endLine,
    });
  }

  return sections;
}

// ============================================================================
// Chunk ID generation
// ============================================================================

/**
 * Generate a deterministic chunk ID based on version and content.
 * This ensures stable IDs across re-indexing with the same content.
 */
export function generateChunkId(
  version: number,
  title: string,
  contentHash: string
): string {
  const input = `v${version}:${title}:${contentHash}`;
  const hash = createHash("sha256").update(input).digest("hex");
  // Use first 16 chars for a reasonably unique but readable ID
  return `chunk_${hash.substring(0, 16)}`;
}

/**
 * Generate a content hash for chunk ID stability.
 */
export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").substring(0, 8);
}

// ============================================================================
// Title and sourceRef generation
// ============================================================================

/**
 * Generate a human-readable title from a section.
 */
export function generateTitle(section: MarkdownSection): string {
  if (section.heading) {
    // Build title from parent hierarchy + current heading
    const parts = section.parentHeadings.map((h) => h.text);
    parts.push(section.heading.text);
    return parts.join(" > ");
  }
  return "(Introduction)";
}

/**
 * Generate a source reference for a section.
 * Format: "h2:Experience > h3:Company Name" or "lines:1-50"
 */
export function generateSourceRef(section: MarkdownSection): string {
  if (section.heading) {
    const parts: string[] = [];
    for (const parent of section.parentHeadings) {
      parts.push(`h${parent.level}:${parent.text}`);
    }
    parts.push(`h${section.heading.level}:${section.heading.text}`);
    return parts.join(" > ");
  }
  return `lines:${section.startLine + 1}-${section.endLine}`;
}

// ============================================================================
// Chunking logic
// ============================================================================

/**
 * Split a large section into smaller chunks if it exceeds MAX_CHUNK_SIZE.
 * Attempts to split on paragraph boundaries.
 */
export function splitLargeSection(
  section: MarkdownSection,
  version: number
): ResumeChunk[] {
  const content = section.content;
  const baseTitle = generateTitle(section);
  const baseSourceRef = generateSourceRef(section);

  // If content is within limits, return as single chunk
  if (content.length <= MAX_CHUNK_SIZE) {
    if (content.length < MIN_CHUNK_SIZE) {
      // Too small, will be handled by merging logic
      return [];
    }
    return [
      {
        chunkId: generateChunkId(version, baseTitle, hashContent(content)),
        title: baseTitle,
        sourceRef: baseSourceRef,
        content,
      },
    ];
  }

  // Split on paragraph boundaries (double newlines)
  const paragraphs = content.split(/\n\n+/);
  const chunks: ResumeChunk[] = [];
  let currentContent = "";
  let partNumber = 1;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // Check if adding this paragraph would exceed the limit
    const wouldBe = currentContent
      ? `${currentContent}\n\n${trimmedParagraph}`
      : trimmedParagraph;

    if (wouldBe.length > MAX_CHUNK_SIZE && currentContent.length > 0) {
      // Save current chunk
      const title =
        paragraphs.length > 1 ? `${baseTitle} (part ${partNumber})` : baseTitle;
      chunks.push({
        chunkId: generateChunkId(version, title, hashContent(currentContent)),
        title,
        sourceRef: `${baseSourceRef} (part ${partNumber})`,
        content: currentContent,
      });
      partNumber++;
      currentContent = trimmedParagraph;
    } else {
      currentContent = wouldBe;
    }
  }

  // Don't forget the last chunk
  if (currentContent.length >= MIN_CHUNK_SIZE) {
    const title =
      partNumber > 1 ? `${baseTitle} (part ${partNumber})` : baseTitle;
    chunks.push({
      chunkId: generateChunkId(version, title, hashContent(currentContent)),
      title,
      sourceRef: partNumber > 1 ? `${baseSourceRef} (part ${partNumber})` : baseSourceRef,
      content: currentContent,
    });
  } else if (currentContent.length > 0 && chunks.length > 0) {
    // Merge small remainder with previous chunk if possible
    const lastChunk = chunks[chunks.length - 1];
    lastChunk.content = `${lastChunk.content}\n\n${currentContent}`;
    // Regenerate chunk ID with new content
    lastChunk.chunkId = generateChunkId(
      version,
      lastChunk.title,
      hashContent(lastChunk.content)
    );
  } else if (currentContent.length > 0) {
    // Single small chunk - keep it anyway
    chunks.push({
      chunkId: generateChunkId(version, baseTitle, hashContent(currentContent)),
      title: baseTitle,
      sourceRef: baseSourceRef,
      content: currentContent,
    });
  }

  return chunks;
}

/**
 * Chunk markdown content into an array of ResumeChunks.
 * Splits by headings first, then by size if sections are too large.
 */
export function chunkMarkdown(markdown: string, version: number): ResumeChunk[] {
  const sections = parseIntoSections(markdown);
  const allChunks: ResumeChunk[] = [];
  let pendingSmallContent: {
    content: string;
    title: string;
    sourceRef: string;
  } | null = null;

  for (const section of sections) {
    // Skip empty sections
    if (!section.content.trim()) continue;

    const sectionChunks = splitLargeSection(section, version);

    // Handle small sections by potentially merging them
    if (sectionChunks.length === 0 && section.content.length < MIN_CHUNK_SIZE) {
      const title = generateTitle(section);
      const sourceRef = generateSourceRef(section);

      if (pendingSmallContent) {
        // Try to merge with pending content
        const merged = `${pendingSmallContent.content}\n\n${section.content}`;
        if (merged.length <= MAX_CHUNK_SIZE) {
          pendingSmallContent = {
            content: merged,
            title: `${pendingSmallContent.title}; ${title}`,
            sourceRef: `${pendingSmallContent.sourceRef}; ${sourceRef}`,
          };
        } else {
          // Can't merge, save pending and start new
          allChunks.push({
            chunkId: generateChunkId(
              version,
              pendingSmallContent.title,
              hashContent(pendingSmallContent.content)
            ),
            title: pendingSmallContent.title,
            sourceRef: pendingSmallContent.sourceRef,
            content: pendingSmallContent.content,
          });
          pendingSmallContent = { content: section.content, title, sourceRef };
        }
      } else {
        pendingSmallContent = { content: section.content, title, sourceRef };
      }
    } else if (sectionChunks.length > 0) {
      // Save any pending small content first
      if (pendingSmallContent) {
        allChunks.push({
          chunkId: generateChunkId(
            version,
            pendingSmallContent.title,
            hashContent(pendingSmallContent.content)
          ),
          title: pendingSmallContent.title,
          sourceRef: pendingSmallContent.sourceRef,
          content: pendingSmallContent.content,
        });
        pendingSmallContent = null;
      }
      allChunks.push(...sectionChunks);
    }
  }

  // Don't forget any remaining pending content
  if (pendingSmallContent) {
    allChunks.push({
      chunkId: generateChunkId(
        version,
        pendingSmallContent.title,
        hashContent(pendingSmallContent.content)
      ),
      title: pendingSmallContent.title,
      sourceRef: pendingSmallContent.sourceRef,
      content: pendingSmallContent.content,
    });
  }

  return allChunks;
}

// ============================================================================
// Firestore persistence
// ============================================================================

/**
 * Delete all chunks for a specific version.
 */
export async function deleteChunksForVersion(version: number): Promise<void> {
  const db = getFirestore();
  const chunksCollection = getResumeChunksCollection();

  // Query for chunks with this version
  const snapshot = await chunksCollection.where("version", "==", version).get();

  if (snapshot.empty) return;

  // Delete in batches (Firestore limit is 500 per batch)
  const batchSize = 500;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    const batchDocs = docs.slice(i, i + batchSize);

    for (const doc of batchDocs) {
      batch.delete(doc.ref);
    }

    await batch.commit();
  }
}

/**
 * Persist chunks to Firestore resumeChunks collection.
 */
export async function persistChunks(
  chunks: ResumeChunk[],
  version: number
): Promise<void> {
  const db = getFirestore();
  const chunksCollection = getResumeChunksCollection();

  // Delete existing chunks for this version first
  await deleteChunksForVersion(version);

  // Write new chunks in batches
  const batchSize = 500;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = db.batch();
    const batchChunks = chunks.slice(i, i + batchSize);

    for (const chunk of batchChunks) {
      const docRef = chunksCollection.doc(chunk.chunkId);
      const chunkDoc: ResumeChunkDoc = {
        version,
        title: chunk.title,
        content: chunk.content,
        sourceRef: chunk.sourceRef,
      };
      batch.set(docRef, chunkDoc);
    }

    await batch.commit();
  }
}

/**
 * Update the resume index with the new version and chunk count.
 */
export async function updateResumeIndex(
  gcsPath: string,
  version: number,
  chunkCount: number
): Promise<void> {
  const indexRef = getResumeIndexRef();
  const indexData: ResumeIndexDoc = {
    resumeGcsPath: gcsPath,
    indexedAt: Timestamp.now(),
    chunkCount,
    version,
  };
  await indexRef.set(indexData);
}

/**
 * Index a resume: chunk it and persist to Firestore.
 * This is the main entry point for resume indexing.
 */
export async function indexResume(
  markdownContent: string,
  gcsPath: string,
  version: number
): Promise<ChunkingResult> {
  // Chunk the markdown content
  const chunks = chunkMarkdown(markdownContent, version);

  // Persist chunks to Firestore
  await persistChunks(chunks, version);

  // Update the resume index
  await updateResumeIndex(gcsPath, version, chunks.length);

  return {
    chunks,
    version,
  };
}

/**
 * Get all chunks for the current resume version.
 */
export async function getCurrentChunks(): Promise<ResumeChunk[]> {
  const indexRef = getResumeIndexRef();
  const indexDoc = await indexRef.get();

  if (!indexDoc.exists) {
    return [];
  }

  const indexData = indexDoc.data() as ResumeIndexDoc;
  const version = indexData.version;

  const chunksCollection = getResumeChunksCollection();
  const snapshot = await chunksCollection.where("version", "==", version).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as ResumeChunkDoc;
    return {
      chunkId: doc.id,
      title: data.title,
      sourceRef: data.sourceRef,
      content: data.content,
    };
  });
}
