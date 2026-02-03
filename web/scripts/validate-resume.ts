/**
 * Validation script to check resume chunking locally (no GCP needed).
 *
 * Run with: cd web && npm run validate:resume -- path/to/resume.md
 *
 * This script:
 * 1. Reads the specified markdown file
 * 2. Runs the chunking algorithm locally
 * 3. Reports chunk count, sizes, and any warnings
 *
 * Useful for checking your resume before committing or uploading.
 */

import { resolve, basename } from "path";
import { readFileSync, existsSync } from "fs";
import { createHash } from "crypto";

// ============================================================================
// Configuration
// ============================================================================

const MAX_CHUNK_SIZE = 2000;
const MIN_CHUNK_SIZE = 100;

// ============================================================================
// Logging
// ============================================================================

function log(message: string, success?: boolean): void {
  const prefix =
    success === true ? "✓" : success === false ? "✗" : "→";
  console.log(`${prefix} ${message}`);
}

function warn(message: string): void {
  console.log(`⚠ ${message}`);
}

// ============================================================================
// Chunking Logic (inlined to avoid server-only import issues)
// ============================================================================

interface MarkdownHeading {
  level: number;
  text: string;
  lineNumber: number;
}

interface MarkdownSection {
  heading: MarkdownHeading | null;
  parentHeadings: MarkdownHeading[];
  content: string;
  startLine: number;
  endLine: number;
}

interface ResumeChunk {
  chunkId: string;
  title: string;
  sourceRef: string;
  content: string;
}

function parseLines(markdown: string): string[] {
  return markdown.split(/\r?\n/);
}

function extractHeadings(lines: string[]): MarkdownHeading[] {
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

function parseIntoSections(markdown: string): MarkdownSection[] {
  const lines = parseLines(markdown);
  const headings = extractHeadings(lines);
  const sections: MarkdownSection[] = [];

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

  for (let i = 0; i < headings.length; i++) {
    const currentHeading = headings[i];
    const nextHeading = headings[i + 1];

    const parentHeadings: MarkdownHeading[] = [];
    for (let j = i - 1; j >= 0; j--) {
      if (headings[j].level < currentHeading.level) {
        parentHeadings.unshift(headings[j]);
        if (headings[j].level === 1) break;
      }
    }

    const startLine = currentHeading.lineNumber + 1;
    const endLine = nextHeading ? nextHeading.lineNumber : lines.length;
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

function generateChunkId(version: number, title: string, contentHash: string): string {
  const input = `v${version}:${title}:${contentHash}`;
  const hash = createHash("sha256").update(input).digest("hex");
  return `chunk_${hash.substring(0, 16)}`;
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").substring(0, 8);
}

function generateTitle(section: MarkdownSection): string {
  if (section.heading) {
    const parts = section.parentHeadings.map((h) => h.text);
    parts.push(section.heading.text);
    return parts.join(" > ");
  }
  return "(Introduction)";
}

function generateSourceRef(section: MarkdownSection): string {
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

function splitLargeSection(section: MarkdownSection, version: number): ResumeChunk[] {
  const content = section.content;
  const baseTitle = generateTitle(section);
  const baseSourceRef = generateSourceRef(section);

  if (content.length <= MAX_CHUNK_SIZE) {
    if (content.length < MIN_CHUNK_SIZE) {
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

  const paragraphs = content.split(/\n\n+/);
  const chunks: ResumeChunk[] = [];
  let currentContent = "";
  let partNumber = 1;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    const wouldBe = currentContent
      ? `${currentContent}\n\n${trimmedParagraph}`
      : trimmedParagraph;

    if (wouldBe.length > MAX_CHUNK_SIZE && currentContent.length > 0) {
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
    const lastChunk = chunks[chunks.length - 1];
    lastChunk.content = `${lastChunk.content}\n\n${currentContent}`;
    lastChunk.chunkId = generateChunkId(
      version,
      lastChunk.title,
      hashContent(lastChunk.content)
    );
  } else if (currentContent.length > 0) {
    chunks.push({
      chunkId: generateChunkId(version, baseTitle, hashContent(currentContent)),
      title: baseTitle,
      sourceRef: baseSourceRef,
      content: currentContent,
    });
  }

  return chunks;
}

function chunkMarkdown(markdown: string, version: number): ResumeChunk[] {
  const sections = parseIntoSections(markdown);
  const allChunks: ResumeChunk[] = [];
  let pendingSmallContent: {
    content: string;
    title: string;
    sourceRef: string;
  } | null = null;

  for (const section of sections) {
    if (!section.content.trim()) continue;

    const sectionChunks = splitLargeSection(section, version);

    if (sectionChunks.length === 0 && section.content.length < MIN_CHUNK_SIZE) {
      const title = generateTitle(section);
      const sourceRef = generateSourceRef(section);

      if (pendingSmallContent) {
        const merged = `${pendingSmallContent.content}\n\n${section.content}`;
        if (merged.length <= MAX_CHUNK_SIZE) {
          pendingSmallContent = {
            content: merged,
            title: `${pendingSmallContent.title}; ${title}`,
            sourceRef: `${pendingSmallContent.sourceRef}; ${sourceRef}`,
          };
        } else {
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
// Main
// ============================================================================

function printUsage(): void {
  console.log(`
Usage: npm run validate:resume -- <path-to-resume.md>

Examples:
  npm run validate:resume -- data/baseline-resume.md
  npm run validate:resume -- /path/to/my-resume.md

This validates the chunking of a markdown resume file locally.
No GCP credentials required.
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle help
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  // Get file path
  if (args.length === 0) {
    console.error("Error: No file path provided.\n");
    printUsage();
    process.exit(1);
  }

  const inputPath = args[0];
  const resolvedPath = resolve(process.cwd(), inputPath);

  console.log(`\n=== Resume Validation ===\n`);
  console.log(`File: ${basename(resolvedPath)}`);
  console.log(`Path: ${resolvedPath}\n`);

  // Check file exists
  if (!existsSync(resolvedPath)) {
    log(`File not found: ${resolvedPath}`, false);
    process.exit(1);
  }

  // Read file
  log("Reading file...");
  const content = readFileSync(resolvedPath, "utf-8");
  const charCount = content.length;
  const lineCount = content.split("\n").length;
  log(`Read ${charCount} characters, ${lineCount} lines`, true);

  // Parse headings
  log("Analyzing structure...");
  const lines = parseLines(content);
  const headings = extractHeadings(lines);
  log(`Found ${headings.length} headings`, true);

  // Show heading structure
  console.log("\n--- Heading Structure ---\n");
  for (const heading of headings) {
    const indent = "  ".repeat(heading.level - 1);
    console.log(`${indent}${"#".repeat(heading.level)} ${heading.text}`);
  }

  // Chunk the content
  console.log("\n--- Chunking Results ---\n");
  log("Running chunker...");
  const chunks = chunkMarkdown(content, 1); // Use version 1 for validation
  log(`Generated ${chunks.length} chunks`, true);

  // Analyze chunks
  let hasWarnings = false;
  const chunkSizes = chunks.map((c) => c.content.length);
  const minSize = Math.min(...chunkSizes);
  const maxSize = Math.max(...chunkSizes);
  const avgSize = Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunks.length);
  const totalChars = chunkSizes.reduce((a, b) => a + b, 0);

  console.log("\n--- Chunk Summary ---\n");
  console.log(`  Total chunks: ${chunks.length}`);
  console.log(`  Total chars:  ${totalChars}`);
  console.log(`  Min size:     ${minSize} chars`);
  console.log(`  Max size:     ${maxSize} chars`);
  console.log(`  Avg size:     ${avgSize} chars`);

  // Show each chunk
  console.log("\n--- Chunk Details ---\n");
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const size = chunk.content.length;
    const preview = chunk.content.substring(0, 60).replace(/\n/g, " ").trim();

    let sizeIndicator = "";
    if (size < MIN_CHUNK_SIZE) {
      sizeIndicator = " ⚠ (too small)";
      hasWarnings = true;
    } else if (size > MAX_CHUNK_SIZE) {
      sizeIndicator = " ⚠ (too large)";
      hasWarnings = true;
    }

    console.log(`  ${i + 1}. ${chunk.title}`);
    console.log(`     Size: ${size} chars${sizeIndicator}`);
    console.log(`     Ref:  ${chunk.sourceRef}`);
    console.log(`     Preview: "${preview}..."`);
    console.log("");
  }

  // Warnings
  if (hasWarnings) {
    console.log("--- Warnings ---\n");
  }

  // Check for sections without content under headings
  const sections = parseIntoSections(content);
  for (const section of sections) {
    if (section.heading && section.content.length === 0) {
      warn(`Empty section: ${section.heading.text}`);
      hasWarnings = true;
    }
    if (section.heading && section.content.length < MIN_CHUNK_SIZE && section.content.length > 0) {
      warn(`Small section (${section.content.length} chars): ${section.heading.text}`);
      hasWarnings = true;
    }
  }

  // Check for very large sections
  for (const chunk of chunks) {
    if (chunk.content.length > MAX_CHUNK_SIZE) {
      warn(`Large chunk (${chunk.content.length} chars): ${chunk.title}`);
      hasWarnings = true;
    }
  }

  // Final result
  console.log("\n--- Result ---\n");
  if (hasWarnings) {
    log("Validation complete with warnings", false);
    console.log("\nRecommendations:");
    console.log("  - Add more content to small sections (aim for 100-2000 chars)");
    console.log("  - Break large sections into subsections with ### headings");
    console.log("  - Ensure content appears under headings (not just nested headings)");
    process.exit(1);
  } else {
    log("Validation passed!", true);
    console.log("\nYour resume chunks correctly and is ready for seeding.");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
