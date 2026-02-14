/**
 * Seed script to upload a resume to GCS and index it in Firestore.
 *
 * Run with: cd web && npm run seed:resume [-- path/to/resume.md]
 *
 * Examples:
 *   npm run seed:resume                           # Uses data/baseline-resume.md
 *   npm run seed:resume -- data/my-resume.md      # Uses specified file
 *
 * This script:
 * 1. Reads the specified markdown file (or data/baseline-resume.md by default)
 * 2. Uploads it to GCS at resume/master.md
 * 3. Chunks the content and indexes to Firestore
 *
 * Safe to run multiple times - overwrites existing data.
 *
 * Prerequisites:
 * - GCP credentials set up (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - web/.env.local file with required environment variables
 */

import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";
import { createHash } from "crypto";

// Load .env.local from the web directory
config({ path: resolve(__dirname, "../.env.local") });

import { Firestore, Timestamp } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_RESUME_PATH = resolve(__dirname, "../data/baseline-resume.md");
const RESUME_GCS_PATH = "resume/master.md";
const RESUME_INDEX_COLLECTION = "resumeIndex";
const RESUME_INDEX_DOC = "current";
const RESUME_CHUNKS_COLLECTION = "resumeChunks";

// Chunking constants (same as resume-chunker.ts)
const MAX_CHUNK_SIZE = 2000;
const MIN_CHUNK_SIZE = 100;

// Environment schema
const envSchema = z.object({
  GCP_PROJECT_ID: z.string().min(1),
  GCS_PRIVATE_BUCKET: z.string().min(1),
});

// ============================================================================
// Logging
// ============================================================================

function log(message: string, success?: boolean): void {
  const prefix =
    success === true ? "✓" : success === false ? "✗" : "→";
  console.log(`${prefix} ${message}`);
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

function getResumePath(): string {
  const args = process.argv.slice(2);
  
  // Handle help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: npm run seed:resume [-- path/to/resume.md]

Examples:
  npm run seed:resume                           # Uses data/baseline-resume.md
  npm run seed:resume -- data/my-resume.md      # Uses specified file

Uploads a resume to GCS and indexes it for RAG.
`);
    process.exit(0);
  }

  if (args.length > 0 && !args[0].startsWith("-")) {
    return resolve(process.cwd(), args[0]);
  }
  
  return DEFAULT_RESUME_PATH;
}

async function main(): Promise<void> {
  console.log("\n=== Seed Resume Script ===\n");

  // Get resume path from args
  const resumePath = getResumePath();

  // Step 1: Validate environment
  log("Checking environment variables...");
  const envResult = envSchema.safeParse(process.env);

  if (!envResult.success) {
    const missing = envResult.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    log(`Missing or invalid environment variables: ${missing}`, false);
    console.log("\nMake sure the following are set in web/.env.local:");
    console.log("  - GCP_PROJECT_ID");
    console.log("  - GCS_PRIVATE_BUCKET");
    process.exit(1);
  }

  const env = envResult.data;
  log("Environment validated", true);
  log(`  Project: ${env.GCP_PROJECT_ID}`);
  log(`  Bucket: ${env.GCS_PRIVATE_BUCKET}`);

  // Step 2: Read resume file
  log(`Reading resume from ${resumePath}...`);
  
  if (!existsSync(resumePath)) {
    log(`Resume not found at ${resumePath}`, false);
    console.log("\nProvide a valid path or create web/data/baseline-resume.md");
    process.exit(1);
  }

  const resumeContent = readFileSync(resumePath, "utf-8");
  const charCount = resumeContent.length;
  const lineCount = resumeContent.split("\n").length;
  log(`Read ${charCount} characters, ${lineCount} lines`, true);

  // Step 3: Upload to GCS
  log(`Uploading to gs://${env.GCS_PRIVATE_BUCKET}/${RESUME_GCS_PATH}...`);
  
  const storage = new Storage({ projectId: env.GCP_PROJECT_ID });
  const privateBucket = storage.bucket(env.GCS_PRIVATE_BUCKET);
  
  await privateBucket.file(RESUME_GCS_PATH).save(resumeContent, {
    contentType: "text/markdown; charset=utf-8",
    resumable: false,
  });
  log("Upload complete", true);

  // Step 4: Chunk the resume
  log("Chunking resume content...");
  
  // Initialize Firestore
  const firestore = new Firestore({ projectId: env.GCP_PROJECT_ID });
  const resumeIndexRef = firestore
    .collection(RESUME_INDEX_COLLECTION)
    .doc(RESUME_INDEX_DOC);

  // Always start from version 1 for a clean index
  const newVersion = 1;
  log(`Version: ${newVersion} (full reset)`);

  const chunks = chunkMarkdown(resumeContent, newVersion);
  log(`Generated ${chunks.length} chunks`, true);

  // Show chunk summary
  for (const chunk of chunks) {
    const contentPreview = chunk.content.substring(0, 50).replace(/\n/g, " ");
    log(`  • ${chunk.title} (${chunk.content.length} chars)`);
    log(`    Preview: "${contentPreview}..."`);
  }

  // Step 5: Delete ALL existing chunks (full reset)
  log("Purging all existing chunks...");
  const chunksCollection = firestore.collection(RESUME_CHUNKS_COLLECTION);

  const allChunks = await chunksCollection.get();
  if (!allChunks.empty) {
    // Delete in batches (Firestore limit is 500 per batch)
    const docs = allChunks.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = firestore.batch();
      const batchDocs = docs.slice(i, i + 500);
      for (const doc of batchDocs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
    log(`Purged ${allChunks.size} existing chunks (all versions)`, true);
  } else {
    log("No existing chunks to purge", true);
  }

  // Write new chunks
  log("Writing new chunks to Firestore...");
  const writeBatch = firestore.batch();
  
  for (const chunk of chunks) {
    const docRef = chunksCollection.doc(chunk.chunkId);
    writeBatch.set(docRef, {
      version: newVersion,
      title: chunk.title,
      content: chunk.content,
      sourceRef: chunk.sourceRef,
    });
  }
  
  await writeBatch.commit();
  log(`Wrote ${chunks.length} chunks`, true);

  // Step 6: Update resume index
  log("Updating resume index...");
  await resumeIndexRef.set({
    resumeGcsPath: RESUME_GCS_PATH,
    indexedAt: Timestamp.now(),
    chunkCount: chunks.length,
    version: newVersion,
  });
  log("Resume index updated", true);

  // Success!
  console.log("\n=== Seed complete ===\n");
  console.log(`Resume seeded successfully!`);
  console.log(`  Source: ${resumePath}`);
  console.log(`  GCS: gs://${env.GCS_PRIVATE_BUCKET}/${RESUME_GCS_PATH}`);
  console.log(`  Chunks: ${chunks.length}`);
  console.log(`  Version: ${newVersion}`);
  console.log("");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
