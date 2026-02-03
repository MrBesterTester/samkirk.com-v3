import "server-only";

import { getCurrentChunks, type ResumeChunk } from "./resume-chunker";
import type { Citation } from "./markdown-renderer";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for assembling resume context.
 */
export interface ResumeContextOptions {
  /**
   * Maximum number of chunks to include.
   * Defaults to all available chunks (RAG V0 - include everything).
   */
  maxChunks?: number;

  /**
   * Whether to include chunk IDs in the context.
   * Useful for traceability in generated content.
   */
  includeChunkIds?: boolean;

  /**
   * Format for the context assembly.
   * - "detailed": Includes chunk numbers, titles, and source refs
   * - "compact": Just titles and content
   * - "minimal": Content only
   */
  format?: "detailed" | "compact" | "minimal";
}

/**
 * Result of assembling resume context.
 */
export interface ResumeContextResult {
  /**
   * The assembled context string ready for LLM prompt injection.
   */
  contextString: string;

  /**
   * The chunks used to build the context.
   * Preserved for citation generation.
   */
  usedChunks: ResumeChunk[];

  /**
   * Total character count of the context.
   */
  characterCount: number;

  /**
   * Total number of chunks included.
   */
  chunkCount: number;
}

// ============================================================================
// Context Assembly Functions
// ============================================================================

/**
 * Format a single chunk for inclusion in context.
 */
export function formatChunkForContext(
  chunk: ResumeChunk,
  index: number,
  options: ResumeContextOptions = {}
): string {
  const { includeChunkIds = false, format = "detailed" } = options;

  switch (format) {
    case "minimal":
      return chunk.content;

    case "compact":
      return `### ${chunk.title}\n\n${chunk.content}`;

    case "detailed":
    default: {
      const idPart = includeChunkIds ? ` (ID: ${chunk.chunkId})` : "";
      const header = `[CHUNK ${index + 1}: ${chunk.title}]${idPart}`;
      const sourceRefLine = `Source: ${chunk.sourceRef}`;
      return `${header}\n${sourceRefLine}\n\n${chunk.content}`;
    }
  }
}

/**
 * Assemble a context string from resume chunks.
 *
 * This function formats the chunks into a string suitable for injection
 * into an LLM prompt. RAG V0 uses all chunks; future versions may
 * implement selective retrieval.
 *
 * @param chunks - The resume chunks to assemble
 * @param options - Options for context assembly
 * @returns The assembled context result
 */
export function assembleContextFromChunks(
  chunks: ResumeChunk[],
  options: ResumeContextOptions = {}
): ResumeContextResult {
  const { maxChunks, format = "detailed" } = options;

  // Apply chunk limit if specified (use explicit undefined check to handle maxChunks: 0)
  const usedChunks =
    maxChunks !== undefined ? chunks.slice(0, maxChunks) : chunks;

  if (usedChunks.length === 0) {
    return {
      contextString: "",
      usedChunks: [],
      characterCount: 0,
      chunkCount: 0,
    };
  }

  // Determine separator based on format
  const separator = format === "minimal" ? "\n\n" : "\n\n---\n\n";

  // Format each chunk
  const formattedChunks = usedChunks.map((chunk, i) =>
    formatChunkForContext(chunk, i, options)
  );

  // Join with separator
  const contextString = formattedChunks.join(separator);

  return {
    contextString,
    usedChunks,
    characterCount: contextString.length,
    chunkCount: usedChunks.length,
  };
}

/**
 * Load and assemble resume context from Firestore.
 *
 * This is the main entry point for getting resume context.
 * It loads the current resume chunks and assembles them into a context string.
 *
 * @param options - Options for context assembly
 * @returns The assembled context result
 *
 * @example
 * ```typescript
 * const context = await getResumeContext({ format: "detailed" });
 * console.log(`Loaded ${context.chunkCount} chunks (${context.characterCount} chars)`);
 * ```
 */
export async function getResumeContext(
  options: ResumeContextOptions = {}
): Promise<ResumeContextResult> {
  // Load chunks from Firestore
  const chunks = await getCurrentChunks();

  // Assemble context
  return assembleContextFromChunks(chunks, options);
}

// ============================================================================
// Citation Functions
// ============================================================================

/**
 * Generate citation entries from resume chunks.
 *
 * Creates a structured citation array that can be appended to
 * generated content for transparency and traceability.
 *
 * @param chunks - The chunks to generate citations for
 * @returns Array of Citation objects
 */
export function generateCitationsFromChunks(chunks: ResumeChunk[]): Citation[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    title: chunk.title,
    sourceRef: chunk.sourceRef,
  }));
}

/**
 * Generate citations for specific chunk IDs.
 *
 * Useful when the LLM output references specific chunks by ID
 * and we want to generate citations only for those referenced.
 *
 * @param allChunks - All available chunks
 * @param referencedIds - IDs of chunks actually referenced
 * @returns Array of Citation objects for referenced chunks only
 */
export function generateCitationsForReferencedChunks(
  allChunks: ResumeChunk[],
  referencedIds: string[]
): Citation[] {
  const idSet = new Set(referencedIds);
  const referencedChunks = allChunks.filter((chunk) =>
    idSet.has(chunk.chunkId)
  );
  return generateCitationsFromChunks(referencedChunks);
}

/**
 * Create a citation map for quick lookup by chunk ID.
 *
 * @param chunks - The chunks to map
 * @returns Map from chunk ID to Citation
 */
export function createCitationMap(
  chunks: ResumeChunk[]
): Map<string, Citation> {
  const map = new Map<string, Citation>();
  for (const chunk of chunks) {
    map.set(chunk.chunkId, {
      chunkId: chunk.chunkId,
      title: chunk.title,
      sourceRef: chunk.sourceRef,
    });
  }
  return map;
}

// ============================================================================
// Context Information Helpers
// ============================================================================

/**
 * Get a summary of resume context for debugging/logging.
 *
 * @param result - The context result to summarize
 * @returns Human-readable summary string
 */
export function getContextSummary(result: ResumeContextResult): string {
  if (result.chunkCount === 0) {
    return "No resume context available (0 chunks)";
  }

  const chunkTitles = result.usedChunks.map((c) => c.title).join(", ");
  return (
    `Resume context: ${result.chunkCount} chunks, ` +
    `${result.characterCount.toLocaleString()} characters. ` +
    `Sections: ${chunkTitles}`
  );
}

/**
 * Check if resume context is available (at least one chunk exists).
 *
 * @returns True if resume chunks are available
 */
export async function isResumeContextAvailable(): Promise<boolean> {
  const chunks = await getCurrentChunks();
  return chunks.length > 0;
}

/**
 * Get the total size of resume context in characters.
 *
 * @returns Total character count across all chunks
 */
export async function getResumeContextSize(): Promise<number> {
  const chunks = await getCurrentChunks();
  return chunks.reduce((total, chunk) => total + chunk.content.length, 0);
}

// ============================================================================
// Export helper type for re-export convenience
// ============================================================================

export type { ResumeChunk } from "./resume-chunker";
export type { Citation } from "./markdown-renderer";
