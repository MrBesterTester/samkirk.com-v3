/**
 * Smoke test script for GCP integration (Firestore + Cloud Storage + Vertex AI).
 *
 * Run with: cd web && npm run smoke:gcp
 *
 * Run specific sections:
 *   npm run smoke:gcp -- --section=1        # Run only Section 1
 *   npm run smoke:gcp -- --section=1,3,5    # Run Sections 1, 3, and 5
 *   npm run smoke:gcp -- --section=storage  # Run by name
 *   npm run smoke:gcp -- --list             # List available sections
 *
 * Prerequisites:
 * - GCP credentials set up (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - web/.env.local file with required environment variables
 *
 * Sections:
 *   1. Cloud Storage Test
 *   2. Firestore Test
 *   3. Session Test
 *   4. Resume Upload Test
 *   5. Resume Chunking Test
 *   6. Dance Menu Upload Test
 *   7. Submission & Artifact Bundle Test
 *   8. Spend Cap Test
 *   9. Job Ingestion URL Fetch Test
 *   10. Vertex AI Gemini Test
 *   11. Resume Generation Test (Step 7.2)
 *   12. Interview Chat Test (Step 8.2)
 */

import { randomBytes } from "crypto";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from the web directory
config({ path: resolve(__dirname, "../.env.local") });

import { Firestore, Timestamp } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { VertexAI } from "@google-cloud/vertexai";
import { z } from "zod";

// ============================================================================
// Section Registry
// ============================================================================

interface SectionInfo {
  number: number;
  name: string;
  aliases: string[];
}

const SECTIONS: SectionInfo[] = [
  { number: 1, name: "Cloud Storage Test", aliases: ["storage", "gcs"] },
  { number: 2, name: "Firestore Test", aliases: ["firestore", "fs"] },
  { number: 3, name: "Session Test", aliases: ["session"] },
  { number: 4, name: "Resume Upload Test", aliases: ["resume-upload", "resume"] },
  { number: 5, name: "Resume Chunking Test", aliases: ["chunking", "chunks"] },
  { number: 6, name: "Dance Menu Upload Test", aliases: ["dance-menu", "dance"] },
  { number: 7, name: "Submission & Artifact Bundle Test", aliases: ["submission", "artifact"] },
  { number: 8, name: "Spend Cap Test", aliases: ["spend", "spend-cap"] },
  { number: 9, name: "Job Ingestion URL Fetch Test", aliases: ["url-fetch", "job-ingestion", "ingestion"] },
  { number: 10, name: "Vertex AI Gemini Test", aliases: ["vertex", "gemini", "llm", "fit-report"] },
  { number: 11, name: "Resume Generation Test", aliases: ["resume-gen", "custom-resume", "resume-generator"] },
  { number: 12, name: "Interview Chat Test", aliases: ["interview", "chat", "interview-chat"] },
  { number: 13, name: "Retention Cleanup Test", aliases: ["retention", "cleanup", "retention-cleanup"] },
];

function parseArgs(): { sections: number[] | null; listSections: boolean } {
  const args = process.argv.slice(2);
  
  if (args.includes("--list") || args.includes("-l")) {
    return { sections: null, listSections: true };
  }

  const sectionArg = args.find((arg) => arg.startsWith("--section=") || arg.startsWith("-s="));
  if (!sectionArg) {
    return { sections: null, listSections: false }; // Run all sections
  }

  const value = sectionArg.split("=")[1];
  const parts = value.split(",").map((p) => p.trim().toLowerCase());
  const sectionNumbers: number[] = [];

  for (const part of parts) {
    // Try to parse as number
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= SECTIONS.length) {
        sectionNumbers.push(num);
      } else {
        console.error(`Invalid section number: ${num}. Valid range: 1-${SECTIONS.length}`);
        process.exit(1);
      }
    } else {
      // Try to find by alias
      const section = SECTIONS.find(
        (s) => s.aliases.includes(part) || s.name.toLowerCase().includes(part)
      );
      if (section) {
        sectionNumbers.push(section.number);
      } else {
        console.error(`Unknown section: "${part}". Use --list to see available sections.`);
        process.exit(1);
      }
    }
  }

  return { sections: [...new Set(sectionNumbers)].sort((a, b) => a - b), listSections: false };
}

function listAvailableSections(): void {
  console.log("\n=== Available Smoke Test Sections ===\n");
  for (const section of SECTIONS) {
    console.log(`  ${section.number}. ${section.name}`);
    console.log(`     Aliases: ${section.aliases.join(", ")}`);
  }
  console.log("\nUsage:");
  console.log("  npm run smoke:gcp                    # Run all sections");
  console.log("  npm run smoke:gcp -- --section=1     # Run Section 1 only");
  console.log("  npm run smoke:gcp -- --section=1,3   # Run Sections 1 and 3");
  console.log("  npm run smoke:gcp -- --section=storage,spend  # Run by alias");
  console.log("");
}

function shouldRunSection(sectionNumber: number, selectedSections: number[] | null): boolean {
  if (selectedSections === null) return true; // Run all
  return selectedSections.includes(sectionNumber);
}

// Redefine env schema here to avoid server-only import issues in CLI
const envSchema = z.object({
  GCP_PROJECT_ID: z.string().min(1),
  GCS_PUBLIC_BUCKET: z.string().min(1),
  GCS_PRIVATE_BUCKET: z.string().min(1),
  VERTEX_AI_LOCATION: z.string().min(1),
  VERTEX_AI_MODEL: z.string().min(1),
  RECAPTCHA_SITE_KEY: z.string().min(1),
  RECAPTCHA_SECRET_KEY: z.string().min(1),
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1),
});

const SMOKE_TEST_PREFIX = "_smoke_test";
const SMOKE_TEST_GCS_PATH = `${SMOKE_TEST_PREFIX}/test-file.txt`;
const SMOKE_TEST_FIRESTORE_COLLECTION = `${SMOKE_TEST_PREFIX}`;
const SMOKE_TEST_FIRESTORE_DOC = "test-doc";
const SMOKE_TEST_SESSION_COLLECTION = "sessions";
const SMOKE_TEST_SESSION_PREFIX = "_smoke_session_";

function log(message: string, success?: boolean): void {
  const prefix =
    success === true ? "✓" : success === false ? "✗" : "→";
  console.log(`${prefix} ${message}`);
}

async function main(): Promise<void> {
  // Parse command line arguments
  const { sections: selectedSections, listSections } = parseArgs();

  if (listSections) {
    listAvailableSections();
    process.exit(0);
  }

  console.log("\n=== GCP Smoke Test ===\n");

  if (selectedSections) {
    const sectionNames = selectedSections.map((n) => `${n}. ${SECTIONS[n - 1].name}`);
    console.log(`Running selected sections: ${sectionNames.join(", ")}\n`);
  }

  // Step 1: Validate environment variables
  log("Checking environment variables...");
  const envResult = envSchema.safeParse(process.env);

  if (!envResult.success) {
    const missing = envResult.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    log(`Missing or invalid environment variables: ${missing}`, false);
    console.log("\nMake sure the following environment variables are set:");
    console.log("  - GCP_PROJECT_ID");
    console.log("  - GCS_PUBLIC_BUCKET");
    console.log("  - GCS_PRIVATE_BUCKET");
    console.log("  - VERTEX_AI_LOCATION");
    console.log("  - VERTEX_AI_MODEL");
    console.log("  - RECAPTCHA_SITE_KEY");
    console.log("  - RECAPTCHA_SECRET_KEY");
    console.log("  - GOOGLE_OAUTH_CLIENT_ID");
    console.log("  - GOOGLE_OAUTH_CLIENT_SECRET");
    process.exit(1);
  }

  const env = envResult.data;
  log("Environment variables validated", true);
  log(`  Project: ${env.GCP_PROJECT_ID}`);
  log(`  Private bucket: ${env.GCS_PRIVATE_BUCKET}`);

  // Create clients
  const storage = new Storage({ projectId: env.GCP_PROJECT_ID });
  const firestore = new Firestore({ projectId: env.GCP_PROJECT_ID });
  const privateBucket = storage.bucket(env.GCS_PRIVATE_BUCKET);

  // Track completed sections for summary
  let sectionsRun = 0;
  let sectionsPassed = 0;

  // Section 1: Test Cloud Storage
  if (shouldRunSection(1, selectedSections)) {
  console.log("\n--- Section 1: Cloud Storage Test ---\n");
  sectionsRun++;

  const testContent = `Smoke test at ${new Date().toISOString()}`;

  try {
    log(`Writing to ${SMOKE_TEST_GCS_PATH}...`);
    await privateBucket.file(SMOKE_TEST_GCS_PATH).save(testContent, {
      contentType: "text/plain; charset=utf-8",
      resumable: false,
    });
    log("Write successful", true);

    log(`Reading from ${SMOKE_TEST_GCS_PATH}...`);
    const [downloaded] = await privateBucket.file(SMOKE_TEST_GCS_PATH).download();
    const readContent = downloaded.toString("utf-8");

    if (readContent !== testContent) {
      throw new Error(
        `Content mismatch! Expected: "${testContent}", got: "${readContent}"`
      );
    }
    log("Read successful, content matches", true);

    log(`Cleaning up ${SMOKE_TEST_GCS_PATH}...`);
    await privateBucket.file(SMOKE_TEST_GCS_PATH).delete();
    log("Cleanup successful", true);
    sectionsPassed++;
  } catch (error) {
    log(`Cloud Storage test failed: ${error instanceof Error ? error.message : error}`, false);
    process.exit(1);
  }
  } // End Section 1

  // Section 2: Test Firestore
  if (shouldRunSection(2, selectedSections)) {
  console.log("\n--- Section 2: Firestore Test ---\n");
  sectionsRun++;

  const testDoc = {
    message: "Smoke test document",
    timestamp: Timestamp.now(),
    testId: `smoke-${Date.now()}`,
  };

  const docRef = firestore
    .collection(SMOKE_TEST_FIRESTORE_COLLECTION)
    .doc(SMOKE_TEST_FIRESTORE_DOC);

  try {
    log(`Writing to ${SMOKE_TEST_FIRESTORE_COLLECTION}/${SMOKE_TEST_FIRESTORE_DOC}...`);
    await docRef.set(testDoc);
    log("Write successful", true);

    log(`Reading from ${SMOKE_TEST_FIRESTORE_COLLECTION}/${SMOKE_TEST_FIRESTORE_DOC}...`);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      throw new Error("Document not found after write");
    }

    const data = snapshot.data();
    if (data?.testId !== testDoc.testId) {
      throw new Error(
        `Data mismatch! Expected testId: "${testDoc.testId}", got: "${data?.testId}"`
      );
    }
    log("Read successful, data matches", true);

    log(`Cleaning up ${SMOKE_TEST_FIRESTORE_COLLECTION}/${SMOKE_TEST_FIRESTORE_DOC}...`);
    await docRef.delete();
    log("Cleanup successful", true);
    sectionsPassed++;
  } catch (error) {
    log(`Firestore test failed: ${error instanceof Error ? error.message : error}`, false);
    process.exit(1);
  }
  } // End Section 2

  // Section 3: Test Session Creation (Firestore-based)
  if (shouldRunSection(3, selectedSections)) {
  console.log("\n--- Section 3: Session Test ---\n");
  sectionsRun++;

  // Generate a smoke test session ID
  const { randomBytes } = await import("crypto");
  const testSessionId = `${SMOKE_TEST_SESSION_PREFIX}${randomBytes(16).toString("base64url")}`;
  const sessionDocRef = firestore
    .collection(SMOKE_TEST_SESSION_COLLECTION)
    .doc(testSessionId);

  const now = Date.now();
  const sessionTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const sessionDoc = {
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + sessionTtlMs),
    ipHash: "smoke_test_ip_hash",
  };

  try {
    log(`Creating session ${testSessionId.substring(0, 30)}...`);
    await sessionDocRef.set(sessionDoc);
    log("Session write successful", true);

    log("Reading session back...");
    const sessionSnapshot = await sessionDocRef.get();

    if (!sessionSnapshot.exists) {
      throw new Error("Session document not found after write");
    }

    const sessionData = sessionSnapshot.data();
    if (!sessionData?.createdAt || !sessionData?.expiresAt) {
      throw new Error("Session document missing required fields");
    }

    // Verify TTL calculation
    const createdAtMs = sessionData.createdAt.toMillis();
    const expiresAtMs = sessionData.expiresAt.toMillis();
    const actualTtl = expiresAtMs - createdAtMs;

    if (actualTtl !== sessionTtlMs) {
      throw new Error(
        `Session TTL mismatch! Expected: ${sessionTtlMs}ms, got: ${actualTtl}ms`
      );
    }
    log("Session TTL verified", true);

    // Verify session is not expired
    const isExpired = Date.now() >= expiresAtMs;
    if (isExpired) {
      throw new Error("Session should not be expired immediately after creation");
    }
    log("Session expiry check passed", true);

    log("Cleaning up test session...");
    await sessionDocRef.delete();
    log("Session cleanup successful", true);
    sectionsPassed++;
  } catch (error) {
    // Clean up on failure
    try {
      await sessionDocRef.delete();
    } catch {
      // Ignore cleanup errors
    }
    log(`Session test failed: ${error instanceof Error ? error.message : error}`, false);
    process.exit(1);
  }
  } // End Section 3

  // Section 4: Test Resume Upload Flow (GCS + Firestore metadata)
  if (shouldRunSection(4, selectedSections)) {
  console.log("\n--- Section 4: Resume Upload Test ---\n");
  sectionsRun++;

  const RESUME_GCS_PATH = "resume/master.md";
  const RESUME_INDEX_COLLECTION = "resumeIndex";
  const RESUME_INDEX_DOC = "current";

  // Test resume content (markdown)
  const testResumeContent = `# Test Resume

## Summary
This is a smoke test resume to verify the upload pipeline.

## Experience
- **Test Company** (2020-Present)
  - Did some testing things
  - Verified smoke tests work

## Skills
- TypeScript
- GCP
- Testing

---
Generated at: ${new Date().toISOString()}
`;

  const resumeIndexRef = firestore
    .collection(RESUME_INDEX_COLLECTION)
    .doc(RESUME_INDEX_DOC);

  // Store original resume data to restore later
  let originalResumeExists = false;
  let originalResumeContent: string | null = null;
  let originalIndexData: Record<string, unknown> | null = null;

  try {
    // Check if real resume already exists (we'll restore it after test)
    log("Checking for existing resume...");
    try {
      const [existingContent] = await privateBucket
        .file(RESUME_GCS_PATH)
        .download();
      originalResumeContent = existingContent.toString("utf-8");
      originalResumeExists = true;
      log("Found existing resume (will restore after test)", true);
    } catch {
      log("No existing resume found", true);
    }

    // Check for existing index
    const existingIndex = await resumeIndexRef.get();
    if (existingIndex.exists) {
      originalIndexData = existingIndex.data() as Record<string, unknown>;
      log("Found existing resume index (will restore after test)", true);
    }

    // Test 1: Write resume to GCS
    log(`Writing test resume to ${RESUME_GCS_PATH}...`);
    await privateBucket.file(RESUME_GCS_PATH).save(testResumeContent, {
      contentType: "text/markdown; charset=utf-8",
      resumable: false,
    });
    log("Resume write to GCS successful", true);

    // Test 2: Read back and verify
    log(`Reading resume from ${RESUME_GCS_PATH}...`);
    const [downloadedResume] = await privateBucket
      .file(RESUME_GCS_PATH)
      .download();
    const readResumeContent = downloadedResume.toString("utf-8");

    if (readResumeContent !== testResumeContent) {
      throw new Error("Resume content mismatch after write!");
    }
    log("Resume content verified", true);

    // Test 3: Update Firestore metadata
    const testVersion = 9999; // Use high number to avoid conflicts
    const testIndexData = {
      resumeGcsPath: RESUME_GCS_PATH,
      indexedAt: Timestamp.now(),
      chunkCount: 0,
      version: testVersion,
    };

    log(`Writing resume index to ${RESUME_INDEX_COLLECTION}/${RESUME_INDEX_DOC}...`);
    await resumeIndexRef.set(testIndexData);
    log("Resume index write successful", true);

    // Test 4: Read back and verify Firestore data
    log("Reading resume index back...");
    const indexSnapshot = await resumeIndexRef.get();

    if (!indexSnapshot.exists) {
      throw new Error("Resume index document not found after write");
    }

    const indexData = indexSnapshot.data();
    if (indexData?.version !== testVersion) {
      throw new Error(
        `Resume index version mismatch! Expected: ${testVersion}, got: ${indexData?.version}`
      );
    }
    if (indexData?.resumeGcsPath !== RESUME_GCS_PATH) {
      throw new Error("Resume index GCS path mismatch!");
    }
    log("Resume index data verified", true);

    // Cleanup / Restore
    log("Restoring original state...");

    if (originalResumeExists && originalResumeContent) {
      await privateBucket.file(RESUME_GCS_PATH).save(originalResumeContent, {
        contentType: "text/markdown; charset=utf-8",
        resumable: false,
      });
      log("Original resume content restored", true);
    } else {
      await privateBucket.file(RESUME_GCS_PATH).delete();
      log("Test resume deleted", true);
    }

    if (originalIndexData) {
      await resumeIndexRef.set(originalIndexData);
      log("Original resume index restored", true);
    } else {
      await resumeIndexRef.delete();
      log("Test resume index deleted", true);
    }
    sectionsPassed++;
  } catch (error) {
    // Try to restore on failure
    try {
      if (originalResumeExists && originalResumeContent) {
        await privateBucket.file(RESUME_GCS_PATH).save(originalResumeContent, {
          contentType: "text/markdown; charset=utf-8",
          resumable: false,
        });
      } else {
        await privateBucket.file(RESUME_GCS_PATH).delete();
      }

      if (originalIndexData) {
        await resumeIndexRef.set(originalIndexData);
      } else {
        await resumeIndexRef.delete();
      }
    } catch {
      log("Warning: Failed to restore original state during cleanup", false);
    }

    log(`Resume upload test failed: ${error instanceof Error ? error.message : error}`, false);
    process.exit(1);
  }
  } // End Section 4

  // Section 5: Test Resume Chunking (Step 3.3 verification)
  if (shouldRunSection(5, selectedSections)) {
  console.log("\n--- Section 5: Resume Chunking Test ---\n");
  sectionsRun++;

  const RESUME_GCS_PATH = "resume/master.md";
  const RESUME_INDEX_COLLECTION = "resumeIndex";
  const RESUME_INDEX_DOC = "current";
  const RESUME_CHUNKS_COLLECTION = "resumeChunks";

  const resumeIndexRef = firestore
    .collection(RESUME_INDEX_COLLECTION)
    .doc(RESUME_INDEX_DOC);

  // Test resume with multiple sections for chunking
  const chunkTestResumeContent = `# Sam Kirk - Test Resume

## Summary
Experienced software engineer with expertise in AI/ML and cloud technologies.
This is a test resume to verify the chunking pipeline works correctly.

## Experience

### Senior Software Engineer at Tech Corp
**2020 - Present**

Led development of AI-powered features for enterprise customers.
- Built scalable data pipelines processing millions of records daily
- Implemented RAG systems using vector databases and LLMs
- Mentored junior engineers and conducted code reviews

### Software Engineer at Startup Inc
**2017 - 2020**

Full-stack development for B2B SaaS platform.
- Developed React frontends with TypeScript
- Built Node.js APIs with PostgreSQL and Redis
- Implemented CI/CD pipelines with GitHub Actions

## Education

### Master of Science in Computer Science
**Stanford University, 2017**

Focus on machine learning and distributed systems.

### Bachelor of Science in Computer Science
**UC Berkeley, 2015**

Graduated with honors.

## Skills

### Technical
- Languages: TypeScript, Python, Go, Rust
- Cloud: GCP, AWS, Azure
- Databases: PostgreSQL, Firestore, Redis, MongoDB
- AI/ML: TensorFlow, PyTorch, LangChain

### Soft Skills
- Technical leadership
- Cross-functional collaboration
- Technical writing and documentation

---
Generated for smoke test at: ${new Date().toISOString()}
`;

  // Store original state to restore later
  let originalResumeExists = false;
  let originalResumeContent: string | null = null;
  let originalIndexData: Record<string, unknown> | null = null;
  let originalChunks: Array<{ id: string; data: Record<string, unknown> }> = [];

  try {
    // Store original resume state
    log("Checking for existing resume...");
    try {
      const [existingContent] = await privateBucket
        .file(RESUME_GCS_PATH)
        .download();
      originalResumeContent = existingContent.toString("utf-8");
      originalResumeExists = true;
      log("Found existing resume (will restore after test)", true);
    } catch {
      log("No existing resume found", true);
    }

    try {
      const existingIndex = await resumeIndexRef.get();
      if (existingIndex.exists) {
        originalIndexData = existingIndex.data() as Record<string, unknown>;
        log("Found existing resume index (will restore after test)", true);
      }
    } catch {
      // Ignore
    }

    log("Checking for existing chunks...");
    const existingChunksSnapshot = await firestore
      .collection(RESUME_CHUNKS_COLLECTION)
      .limit(100)
      .get();

    if (!existingChunksSnapshot.empty) {
      originalChunks = existingChunksSnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as Record<string, unknown>,
      }));
      log(`Found ${originalChunks.length} existing chunks (will restore after test)`, true);
    } else {
      log("No existing chunks found", true);
    }

    // Write test resume to GCS
    log(`Writing chunking test resume to ${RESUME_GCS_PATH}...`);
    await privateBucket.file(RESUME_GCS_PATH).save(chunkTestResumeContent, {
      contentType: "text/markdown; charset=utf-8",
      resumable: false,
    });
    log("Resume written to GCS", true);

    // Import and run the chunker
    log("Running chunker on test resume...");

    // We can't import the chunker directly due to server-only, so we'll
    // manually implement the chunking logic here for the smoke test
    const { createHash } = await import("crypto");

    // Simple heading-based chunker for smoke test
    const lines = chunkTestResumeContent.split("\n");
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    const chunks: Array<{
      chunkId: string;
      title: string;
      sourceRef: string;
      content: string;
    }> = [];

    let currentHeading: string | null = null;
    let currentContent: string[] = [];
    let currentSourceRef = "lines:1-";
    const testVersion = 9998; // Different from Step 5's version

    const saveCurrentChunk = () => {
      const content = currentContent.join("\n").trim();
      if (content.length >= 50) {
        // Min chunk size for smoke test
        const title = currentHeading || "(Introduction)";
        const contentHash = createHash("sha256")
          .update(content)
          .digest("hex")
          .substring(0, 8);
        const chunkId = `chunk_${createHash("sha256")
          .update(`v${testVersion}:${title}:${contentHash}`)
          .digest("hex")
          .substring(0, 16)}`;

        chunks.push({
          chunkId,
          title,
          sourceRef: currentSourceRef,
          content,
        });
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = headingRegex.exec(line);

      if (match) {
        // Save previous chunk
        saveCurrentChunk();

        // Start new chunk
        currentHeading = match[2];
        currentSourceRef = `h${match[1].length}:${match[2]}`;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Don't forget the last chunk
    saveCurrentChunk();

    log(`Generated ${chunks.length} chunks`, true);

    if (chunks.length < 3) {
      throw new Error(
        `Expected at least 3 chunks from test resume, got ${chunks.length}`
      );
    }

    // Write chunks to Firestore
    log("Writing chunks to Firestore...");
    const batch = firestore.batch();

    for (const chunk of chunks) {
      const docRef = firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.chunkId);
      batch.set(docRef, {
        version: testVersion,
        title: chunk.title,
        content: chunk.content,
        sourceRef: chunk.sourceRef,
      });
    }

    await batch.commit();
    log(`Wrote ${chunks.length} chunks to Firestore`, true);

    // Update resume index with chunk count
    log("Updating resume index with chunk count...");
    await resumeIndexRef.set({
      resumeGcsPath: RESUME_GCS_PATH,
      indexedAt: Timestamp.now(),
      chunkCount: chunks.length,
      version: testVersion,
    });
    log("Resume index updated", true);

    // Verify chunks were written correctly
    log("Verifying chunks in Firestore...");
    const verifySnapshot = await firestore
      .collection(RESUME_CHUNKS_COLLECTION)
      .where("version", "==", testVersion)
      .get();

    if (verifySnapshot.size !== chunks.length) {
      throw new Error(
        `Chunk count mismatch! Expected ${chunks.length}, found ${verifySnapshot.size}`
      );
    }
    log(`Verified ${verifySnapshot.size} chunks exist with correct version`, true);

    // Verify resume index has correct chunk count
    const verifyIndex = await resumeIndexRef.get();
    const indexData = verifyIndex.data();

    if (indexData?.chunkCount !== chunks.length) {
      throw new Error(
        `Resume index chunkCount mismatch! Expected ${chunks.length}, got ${indexData?.chunkCount}`
      );
    }
    log("Resume index chunk count verified", true);

    // Cleanup: Delete test chunks
    log("Cleaning up test chunks...");
    const deleteSnapshot = await firestore
      .collection(RESUME_CHUNKS_COLLECTION)
      .where("version", "==", testVersion)
      .get();

    const deleteBatch = firestore.batch();
    deleteSnapshot.docs.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    log(`Deleted ${deleteSnapshot.size} test chunks`, true);

    // Restore original state
    log("Restoring original state...");

    if (originalResumeExists && originalResumeContent) {
      await privateBucket.file(RESUME_GCS_PATH).save(originalResumeContent, {
        contentType: "text/markdown; charset=utf-8",
        resumable: false,
      });
      log("Original resume content restored", true);
    } else {
      await privateBucket.file(RESUME_GCS_PATH).delete();
      log("Test resume deleted from GCS", true);
    }

    if (originalIndexData) {
      await resumeIndexRef.set(originalIndexData);
      log("Original resume index restored", true);
    } else {
      await resumeIndexRef.delete();
      log("Test resume index deleted", true);
    }

    // Restore original chunks if any
    if (originalChunks.length > 0) {
      log(`Restoring ${originalChunks.length} original chunks...`);
      const restoreBatch = firestore.batch();
      for (const chunk of originalChunks) {
        const docRef = firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.id);
        restoreBatch.set(docRef, chunk.data);
      }
      await restoreBatch.commit();
      log("Original chunks restored", true);
    }
    sectionsPassed++;
  } catch (error) {
    // Try to cleanup on failure
    try {
      // Delete test chunks
      const cleanupSnapshot = await firestore
        .collection(RESUME_CHUNKS_COLLECTION)
        .where("version", "==", 9998)
        .get();

      if (!cleanupSnapshot.empty) {
        const cleanupBatch = firestore.batch();
        cleanupSnapshot.docs.forEach((doc) => {
          cleanupBatch.delete(doc.ref);
        });
        await cleanupBatch.commit();
      }

      // Restore original resume
      if (originalResumeExists && originalResumeContent) {
        await privateBucket.file(RESUME_GCS_PATH).save(originalResumeContent, {
          contentType: "text/markdown; charset=utf-8",
          resumable: false,
        });
      } else {
        try {
          await privateBucket.file(RESUME_GCS_PATH).delete();
        } catch {
          // Ignore if doesn't exist
        }
      }

      // Restore original index
      if (originalIndexData) {
        await resumeIndexRef.set(originalIndexData);
      } else {
        try {
          await resumeIndexRef.delete();
        } catch {
          // Ignore if doesn't exist
        }
      }

      // Restore original chunks
      if (originalChunks.length > 0) {
        const restoreBatch = firestore.batch();
        for (const chunk of originalChunks) {
          const docRef = firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.id);
          restoreBatch.set(docRef, chunk.data);
        }
        await restoreBatch.commit();
      }
    } catch {
      log("Warning: Failed to restore original state during cleanup", false);
    }

    log(
      `Resume chunking test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 5

  // Section 6: Test Dance Menu Upload Flow (Public GCS bucket)
  if (shouldRunSection(6, selectedSections)) {
  console.log("\n--- Section 6: Dance Menu Upload Test ---\n");
  sectionsRun++;

  const publicBucket = storage.bucket(env.GCS_PUBLIC_BUCKET);
  const DANCE_MENU_PREFIX = "dance-menu/current/";
  const DANCE_MENU_TEST_PREFIX = "_smoke_test_dance_menu/";

  // Test dance menu content
  const testMenuMd = `# Dance Menu - Week of Smoke Test

## Monday
- Salsa (7pm)
- Bachata (8pm)

## Wednesday
- Swing (7pm)
- Hustle (8pm)

## Friday
- Latin Mix (7pm)
- Social Dance (8pm)

---
Generated at: ${new Date().toISOString()}
`;

  const testMenuTxt = `Dance Menu - Week of Smoke Test

Monday:
  Salsa (7pm)
  Bachata (8pm)

Wednesday:
  Swing (7pm)
  Hustle (8pm)

Friday:
  Latin Mix (7pm)
  Social Dance (8pm)

Generated at: ${new Date().toISOString()}
`;

  const testMenuHtml = `<!DOCTYPE html>
<html>
<head><title>Dance Menu</title></head>
<body>
<h1>Dance Menu - Week of Smoke Test</h1>
<h2>Monday</h2>
<ul>
  <li>Salsa (7pm)</li>
  <li>Bachata (8pm)</li>
</ul>
<h2>Wednesday</h2>
<ul>
  <li>Swing (7pm)</li>
  <li>Hustle (8pm)</li>
</ul>
<h2>Friday</h2>
<ul>
  <li>Latin Mix (7pm)</li>
  <li>Social Dance (8pm)</li>
</ul>
<p>Generated at: ${new Date().toISOString()}</p>
</body>
</html>
`;

  // Store original dance menu data if it exists (for potential future restore logic)
  const originalMenuFiles: Array<{ path: string; content: Buffer; contentType: string }> = [];

  try {
    // Check if real dance menu already exists (we'll restore it after test)
    log("Checking for existing dance menu...");
    const [existingFiles] = await publicBucket.getFiles({ prefix: DANCE_MENU_PREFIX });

    if (existingFiles.length > 0) {
      log(`Found ${existingFiles.length} existing dance menu files (will restore after test)`, true);

      // Save existing files
      for (const file of existingFiles) {
        const [content] = await file.download();
        const [metadata] = await file.getMetadata();
        originalMenuFiles.push({
          path: file.name,
          content,
          contentType: (metadata.contentType as string) || "application/octet-stream",
        });
      }
    } else {
      log("No existing dance menu found", true);
    }

    // Test 1: Write test dance menu files to public bucket (using test prefix)
    log(`Writing test dance menu files to ${DANCE_MENU_TEST_PREFIX}...`);

    await publicBucket.file(`${DANCE_MENU_TEST_PREFIX}menu.md`).save(testMenuMd, {
      contentType: "text/markdown; charset=utf-8",
      resumable: false,
    });
    await publicBucket.file(`${DANCE_MENU_TEST_PREFIX}menu.txt`).save(testMenuTxt, {
      contentType: "text/plain; charset=utf-8",
      resumable: false,
    });
    await publicBucket.file(`${DANCE_MENU_TEST_PREFIX}menu.html`).save(testMenuHtml, {
      contentType: "text/html; charset=utf-8",
      resumable: false,
    });
    log("Dance menu files written successfully", true);

    // Test 2: Verify files can be read back
    log("Verifying dance menu files...");
    const [mdContent] = await publicBucket.file(`${DANCE_MENU_TEST_PREFIX}menu.md`).download();
    const [txtContent] = await publicBucket.file(`${DANCE_MENU_TEST_PREFIX}menu.txt`).download();
    const [htmlContent] = await publicBucket.file(`${DANCE_MENU_TEST_PREFIX}menu.html`).download();

    if (mdContent.toString("utf-8") !== testMenuMd) {
      throw new Error("Markdown content mismatch!");
    }
    if (txtContent.toString("utf-8") !== testMenuTxt) {
      throw new Error("Text content mismatch!");
    }
    if (htmlContent.toString("utf-8") !== testMenuHtml) {
      throw new Error("HTML content mismatch!");
    }
    log("All dance menu files verified", true);

    // Test 3: Verify files are listed correctly
    log("Verifying file listing...");
    const [testFiles] = await publicBucket.getFiles({ prefix: DANCE_MENU_TEST_PREFIX });

    if (testFiles.length !== 3) {
      throw new Error(`Expected 3 files, found ${testFiles.length}`);
    }

    const expectedFiles = ["menu.md", "menu.txt", "menu.html"];
    for (const expected of expectedFiles) {
      const found = testFiles.some((f) => f.name.endsWith(expected));
      if (!found) {
        throw new Error(`Expected file ${expected} not found in listing`);
      }
    }
    log("File listing verified", true);

    // Cleanup: Delete test dance menu files
    log("Cleaning up test dance menu files...");
    for (const file of testFiles) {
      await file.delete();
    }
    log("Test dance menu files deleted", true);
    sectionsPassed++;

  } catch (error) {
    // Try to cleanup on failure
    try {
      const [testFiles] = await publicBucket.getFiles({ prefix: DANCE_MENU_TEST_PREFIX });
      for (const file of testFiles) {
        await file.delete();
      }
    } catch {
      log("Warning: Failed to cleanup test dance menu files", false);
    }

    log(
      `Dance menu upload test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 6

  // Section 7: Test Artifact Bundle + Submission CRUD
  if (shouldRunSection(7, selectedSections)) {
  console.log("\n--- Section 7: Submission & Artifact Bundle Test ---\n");
  sectionsRun++;

  const SUBMISSIONS_COLLECTION = "submissions";
  const SUBMISSION_TEST_PREFIX = "_smoke_submission_";

  // Generate a test submission ID
  const testSubmissionId = `${SUBMISSION_TEST_PREFIX}${randomBytes(16).toString("base64url")}`;
  const submissionDocRef = firestore
    .collection(SUBMISSIONS_COLLECTION)
    .doc(testSubmissionId);

  // Test submission data
  const submissionNow = Date.now();
  const submissionTtlMs = 90 * 24 * 60 * 60 * 1000; // 90 days
  const testSubmissionDoc = {
    createdAt: Timestamp.fromMillis(submissionNow),
    expiresAt: Timestamp.fromMillis(submissionNow + submissionTtlMs),
    tool: "fit",
    status: "complete",
    sessionId: `smoke_test_session_${Date.now()}`,
    inputs: {
      jobUrl: "https://example.com/job/123",
      jobText: "Senior Software Engineer position at Test Corp...",
    },
    extracted: {
      seniority: "senior",
      location: "remote",
      mustHaves: ["TypeScript", "React", "GCP"],
    },
    outputs: {
      fitScore: "Well",
      rationale: "Strong match for technical requirements.",
      reportPath: "outputs/report.md",
    },
    citations: [
      { chunkId: "chunk_001", title: "Experience", sourceRef: "h2:Experience" },
      { chunkId: "chunk_002", title: "Skills", sourceRef: "h2:Skills" },
    ],
    artifactGcsPrefix: `submissions/${testSubmissionId}/`,
  };

  // Test output files to write to GCS
  const testReportMd = `# Fit Analysis Report

## Summary
**Fit Score: Well**

This is a smoke test report for testing the artifact bundle functionality.

## Rationale
- Strong technical skills match
- Remote work compatible
- Senior level experience

## Citations
[1] Experience (h2:Experience)
[2] Skills (h2:Skills)

---
Generated at: ${new Date().toISOString()}
`;

  const testReportHtml = `<!DOCTYPE html>
<html>
<head><title>Fit Analysis Report</title></head>
<body>
<h1>Fit Analysis Report</h1>
<h2>Summary</h2>
<p><strong>Fit Score: Well</strong></p>
<p>Generated at: ${new Date().toISOString()}</p>
</body>
</html>`;

  try {
    // Step 8.1: Create submission document in Firestore
    log(`Creating test submission ${testSubmissionId.substring(0, 30)}...`);
    await submissionDocRef.set(testSubmissionDoc);
    log("Submission created in Firestore", true);

    // Step 8.2: Write test artifacts to GCS
    log("Writing test artifacts to GCS...");
    const artifactPrefix = `submissions/${testSubmissionId}/`;

    await privateBucket
      .file(`${artifactPrefix}output/report.md`)
      .save(testReportMd, {
        contentType: "text/markdown; charset=utf-8",
        resumable: false,
      });

    await privateBucket
      .file(`${artifactPrefix}output/report.html`)
      .save(testReportHtml, {
        contentType: "text/html; charset=utf-8",
        resumable: false,
      });

    log("Test artifacts written to GCS", true);

    // Step 8.3: Verify submission can be read back
    log("Verifying submission in Firestore...");
    const submissionSnapshot = await submissionDocRef.get();

    if (!submissionSnapshot.exists) {
      throw new Error("Submission document not found after creation");
    }

    const submissionData = submissionSnapshot.data();
    if (submissionData?.tool !== "fit") {
      throw new Error(`Expected tool 'fit', got '${submissionData?.tool}'`);
    }
    if (submissionData?.status !== "complete") {
      throw new Error(`Expected status 'complete', got '${submissionData?.status}'`);
    }
    log("Submission data verified", true);

    // Step 8.4: Verify artifacts can be read from GCS
    log("Verifying artifacts in GCS...");
    const [mdContent] = await privateBucket
      .file(`${artifactPrefix}output/report.md`)
      .download();
    const [htmlContent] = await privateBucket
      .file(`${artifactPrefix}output/report.html`)
      .download();

    if (!mdContent.toString("utf-8").includes("Fit Analysis Report")) {
      throw new Error("Markdown artifact content mismatch");
    }
    if (!htmlContent.toString("utf-8").includes("Fit Analysis Report")) {
      throw new Error("HTML artifact content mismatch");
    }
    log("Artifacts verified in GCS", true);

    // Step 8.5: Verify TTL calculation (90 days)
    const createdAtMs = submissionData.createdAt.toMillis();
    const expiresAtMs = submissionData.expiresAt.toMillis();
    const actualTtlMs = expiresAtMs - createdAtMs;

    if (actualTtlMs !== submissionTtlMs) {
      throw new Error(
        `TTL mismatch: expected ${submissionTtlMs}ms, got ${actualTtlMs}ms`
      );
    }
    log("Submission TTL (90 days) verified", true);

    // Step 8.6: Update submission (simulate completion flow)
    log("Testing submission update...");
    await submissionDocRef.update({
      "outputs.bundleGenerated": true,
      "outputs.bundleGeneratedAt": Timestamp.now(),
    });

    const updatedSnapshot = await submissionDocRef.get();
    const updatedData = updatedSnapshot.data();
    if (!updatedData?.outputs?.bundleGenerated) {
      throw new Error("Submission update not reflected");
    }
    log("Submission update verified", true);

    // Cleanup
    log("Cleaning up test submission and artifacts...");

    // Delete GCS artifacts
    const [artifactFiles] = await privateBucket.getFiles({ prefix: artifactPrefix });
    for (const file of artifactFiles) {
      await file.delete();
    }
    log(`Deleted ${artifactFiles.length} artifact files from GCS`, true);

    // Delete Firestore document
    await submissionDocRef.delete();
    log("Test submission deleted from Firestore", true);
    sectionsPassed++;

  } catch (error) {
    // Cleanup on failure
    try {
      const [files] = await privateBucket.getFiles({
        prefix: `submissions/${testSubmissionId}/`,
      });
      for (const file of files) {
        await file.delete();
      }
      await submissionDocRef.delete();
    } catch {
      log("Warning: Failed to cleanup test submission during error handling", false);
    }

    log(
      `Submission & artifact test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 7

  // Section 8: Test Spend Cap (Monthly Spend Tracking)
  if (shouldRunSection(8, selectedSections)) {
  console.log("\n--- Section 8: Spend Cap Test ---\n");
  sectionsRun++;

  // Generate a test month key (use a far-future month to avoid conflicts)
  const testMonthKey = "2099-12";

  // Use the same path structure as the code: spendMonthly/{YYYY-MM}
  const spendMonthlyRef = firestore.doc(`spendMonthly/${testMonthKey}`);

  const testSpendDoc = {
    usdBudget: 20,
    usdUsedEstimated: 0,
    updatedAt: Timestamp.now(),
  };

  try {
    // Step 9.1: Create spend document
    log(`Creating spend tracking doc for ${testMonthKey}...`);
    await spendMonthlyRef.set(testSpendDoc);
    log("Spend doc created", true);

    // Step 9.2: Read and verify
    log("Reading spend doc back...");
    const spendSnapshot = await spendMonthlyRef.get();

    if (!spendSnapshot.exists) {
      throw new Error("Spend document not found after creation");
    }

    const spendData = spendSnapshot.data();
    if (spendData?.usdBudget !== 20) {
      throw new Error(`Budget mismatch: expected 20, got ${spendData?.usdBudget}`);
    }
    if (spendData?.usdUsedEstimated !== 0) {
      throw new Error(`Initial spend should be 0, got ${spendData?.usdUsedEstimated}`);
    }
    log("Spend doc data verified", true);

    // Step 9.3: Simulate spend recording with atomic increment
    log("Testing spend increment (simulating LLM call)...");
    const incrementAmount = 0.005; // ~5 cents

    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(spendMonthlyRef);
      if (!snapshot.exists) {
        throw new Error("Document disappeared during transaction");
      }

      const current = snapshot.data()!;
      transaction.update(spendMonthlyRef, {
        usdUsedEstimated: current.usdUsedEstimated + incrementAmount,
        updatedAt: Timestamp.now(),
      });
    });
    log(`Recorded spend of $${incrementAmount.toFixed(4)}`, true);

    // Step 9.4: Verify increment
    const afterIncrementSnapshot = await spendMonthlyRef.get();
    const afterIncrementData = afterIncrementSnapshot.data();

    if (Math.abs(afterIncrementData?.usdUsedEstimated - incrementAmount) > 0.0001) {
      throw new Error(
        `Spend mismatch after increment: expected ${incrementAmount}, got ${afterIncrementData?.usdUsedEstimated}`
      );
    }
    log("Spend increment verified", true);

    // Step 9.5: Simulate multiple increments (concurrent-safe via transaction)
    log("Testing multiple increments...");
    for (let i = 0; i < 3; i++) {
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(spendMonthlyRef);
        if (!snapshot.exists) {
          throw new Error("Document disappeared during transaction");
        }

        const current = snapshot.data()!;
        transaction.update(spendMonthlyRef, {
          usdUsedEstimated: current.usdUsedEstimated + 0.001,
          updatedAt: Timestamp.now(),
        });
      });
    }

    const afterMultiSnapshot = await spendMonthlyRef.get();
    const afterMultiData = afterMultiSnapshot.data();
    const expectedTotal = incrementAmount + 0.003;

    if (Math.abs(afterMultiData?.usdUsedEstimated - expectedTotal) > 0.0001) {
      throw new Error(
        `Total spend mismatch: expected ~${expectedTotal.toFixed(4)}, got ${afterMultiData?.usdUsedEstimated}`
      );
    }
    log(`Multiple increments verified (total: $${afterMultiData?.usdUsedEstimated.toFixed(4)})`, true);

    // Step 9.6: Test cap detection logic
    log("Testing cap detection...");
    await spendMonthlyRef.update({
      usdUsedEstimated: 20.01,
      updatedAt: Timestamp.now(),
    });

    const overCapSnapshot = await spendMonthlyRef.get();
    const overCapData = overCapSnapshot.data();

    const isCapExceeded = overCapData?.usdUsedEstimated >= overCapData?.usdBudget;
    if (!isCapExceeded) {
      throw new Error("Cap detection failed: should be exceeded at $20.01");
    }
    log("Cap detection verified ($20.01 >= $20)", true);

    // Cleanup
    log("Cleaning up test spend doc...");
    await spendMonthlyRef.delete();
    log("Test spend doc deleted", true);
    sectionsPassed++;

  } catch (error) {
    // Cleanup on failure
    try {
      await spendMonthlyRef.delete();
    } catch {
      // Ignore cleanup errors
    }
    log(
      `Spend cap test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 8

  // Section 9: Job Ingestion URL Fetch Test
  // Note: We implement the fetch logic directly here since job-ingestion.ts uses "server-only"
  if (shouldRunSection(9, selectedSections)) {
  console.log("\n--- Section 9: Job Ingestion URL Fetch Test ---\n");
  sectionsRun++;

  const URL_FETCH_TIMEOUT = 15000;

  // Simple HTML text extractor (mirrors job-ingestion.ts logic)
  function extractTextFromHtml(html: string): string {
    if (!html) return "";
    let text = html;
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
    text = text.replace(/<!--[\s\S]*?-->/g, "");
    text = text.replace(/<\/?(?:p|div|br|hr|h[1-6]|li|tr|td|th|article|section|header|footer|nav|aside|main|blockquote|pre|ul|ol)[^>]*>/gi, "\n");
    text = text.replace(/<[^>]+>/g, " ");
    // Decode common entities
    text = text.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"').replace(/&nbsp;/gi, " ");
    text = text.replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    return text.trim();
  }

  function countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  // Test URLs with expected outcomes
  const testUrls = [
    {
      url: "https://httpbin.org/html",
      description: "Simple HTML page (httpbin.org)",
      shouldSucceed: true,
      minWords: 10,
    },
    {
      url: "https://example.com",
      description: "Example.com landing page",
      shouldSucceed: true,
      minWords: 5,
    },
  ];

  try {
    for (const testCase of testUrls) {
      log(`Testing: ${testCase.description}...`);
      log(`  URL: ${testCase.url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT);

      try {
        const response = await fetch(testCase.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SamKirkBot/1.0; +https://samkirk.com)",
            Accept: "text/html,application/xhtml+xml,text/plain,*/*",
          },
          redirect: "follow",
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const text = extractTextFromHtml(html);
        const wordCount = countWords(text);
        const charCount = text.length;

        if (!testCase.shouldSucceed) {
          throw new Error(`Expected failure but got success for ${testCase.url}`);
        }

        log(`  Characters: ${charCount}`, true);
        log(`  Words: ${wordCount}`);

        if (wordCount < testCase.minWords) {
          throw new Error(
            `Expected at least ${testCase.minWords} words, got ${wordCount}`
          );
        }

        // Show preview (first 200 chars)
        const preview = text.slice(0, 200).replace(/\n/g, " ").trim();
        log(`  Preview: "${preview}..."`);
        log("URL fetch successful", true);

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === "AbortError") {
          if (testCase.shouldSucceed) {
            throw new Error(`Timeout fetching ${testCase.url}`);
          }
          log("  Expected timeout", true);
        } else if (!testCase.shouldSucceed) {
          log(`  Expected failure: ${error instanceof Error ? error.message : error}`, true);
        } else {
          throw error;
        }
      }
    }

    log("All URL fetch tests passed", true);
    sectionsPassed++;

  } catch (error) {
    log(
      `Job ingestion URL fetch test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 9

  // Section 10: Vertex AI Gemini Test
  if (shouldRunSection(10, selectedSections)) {
  console.log("\n--- Section 10: Vertex AI Gemini Test ---\n");
  sectionsRun++;

  try {
    // Initialize Vertex AI client
    log("Initializing Vertex AI client...");
    const vertexAI = new VertexAI({
      project: env.GCP_PROJECT_ID,
      location: env.VERTEX_AI_LOCATION,
    });
    log(`Project: ${env.GCP_PROJECT_ID}, Location: ${env.VERTEX_AI_LOCATION}`, true);

    // Get generative model
    log(`Getting model: ${env.VERTEX_AI_MODEL}...`);
    const model = vertexAI.getGenerativeModel({
      model: env.VERTEX_AI_MODEL,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 256,
      },
    });
    log("Model loaded", true);

    // Test 1: Simple content generation
    log("Testing simple content generation...");
    const simplePrompt = "Respond with exactly: 'Hello from Vertex AI smoke test!'";
    
    const simpleResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: simplePrompt }] }],
    });

    const simpleResponse = simpleResult.response;
    if (!simpleResponse.candidates || simpleResponse.candidates.length === 0) {
      throw new Error("No candidates in response");
    }

    const simpleText = simpleResponse.candidates[0].content.parts
      .filter((p): p is { text: string } => "text" in p)
      .map((p) => p.text)
      .join("");

    log(`Response: "${simpleText.substring(0, 100)}..."`, true);

    // Verify usage metadata
    const usageMetadata = simpleResponse.usageMetadata;
    if (usageMetadata) {
      log(`Input tokens: ${usageMetadata.promptTokenCount ?? "unknown"}`);
      log(`Output tokens: ${usageMetadata.candidatesTokenCount ?? "unknown"}`);
    }

    // Test 2: Structured JSON generation (like fit report)
    log("Testing structured JSON generation...");
    const jsonPrompt = `Respond with valid JSON only, no markdown:
{
  "score": "Well",
  "rationale": "Brief explanation",
  "confidence": 0.9
}`;

    const jsonResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: jsonPrompt }] }],
    });

    const jsonResponse = jsonResult.response;
    if (!jsonResponse.candidates || jsonResponse.candidates.length === 0) {
      throw new Error("No candidates in JSON response");
    }

    const jsonText = jsonResponse.candidates[0].content.parts
      .filter((p): p is { text: string } => "text" in p)
      .map((p) => p.text)
      .join("")
      .trim();

    // Try to parse as JSON
    let cleanJson = jsonText;
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
    cleanJson = cleanJson.trim();

    const parsedJson = JSON.parse(cleanJson);
    if (!parsedJson.score || !parsedJson.rationale) {
      throw new Error("JSON response missing expected fields");
    }
    log(`Parsed JSON: score=${parsedJson.score}, confidence=${parsedJson.confidence}`, true);

    // Test 3: Record spend (simulate spend tracking)
    log("Testing spend recording...");
    const testSpendMonthKey = "2099-11"; // Far future month for smoke test
    const spendRef = firestore.doc(`spendMonthly/${testSpendMonthKey}`);

    // Calculate estimated cost (conservative estimate)
    const inputTokens = usageMetadata?.promptTokenCount ?? 50;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 50;
    const estimatedCost = (inputTokens / 1000) * 0.00125 + (outputTokens / 1000) * 0.00375;
    
    // Record the spend
    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(spendRef);
      
      if (snapshot.exists) {
        const current = snapshot.data()!;
        transaction.update(spendRef, {
          usdUsedEstimated: current.usdUsedEstimated + estimatedCost,
          updatedAt: Timestamp.now(),
        });
      } else {
        transaction.set(spendRef, {
          usdBudget: 20,
          usdUsedEstimated: estimatedCost,
          updatedAt: Timestamp.now(),
        });
      }
    });

    // Verify spend was recorded
    const spendSnapshot = await spendRef.get();
    const spendData = spendSnapshot.data();
    if (!spendData || spendData.usdUsedEstimated < estimatedCost) {
      throw new Error("Spend was not recorded correctly");
    }
    log(`Spend recorded: $${spendData.usdUsedEstimated.toFixed(6)}`, true);

    // Cleanup spend doc
    await spendRef.delete();
    log("Spend doc cleaned up", true);

    log("All Vertex AI tests passed", true);
    sectionsPassed++;

  } catch (error) {
    // Cleanup on failure
    try {
      const spendRef = firestore.doc(`spendMonthly/2099-11`);
      await spendRef.delete();
    } catch {
      // Ignore cleanup errors
    }

    log(
      `Vertex AI test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 10

  // Section 11: Resume Generation Test
  if (shouldRunSection(11, selectedSections)) {
  console.log("\n--- Section 11: Resume Generation Test ---\n");
  sectionsRun++;

  const RESUME_CHUNKS_COLLECTION = "resumeChunks";
  const SUBMISSIONS_COLLECTION = "submissions";
  const RESUME_GEN_TEST_PREFIX = "_smoke_resume_gen_";

  // Test job description
  const testJobText = `Senior Software Engineer - AI/ML Platform

We are looking for a Senior Software Engineer to join our AI Platform team.

Requirements:
- 5+ years of software development experience
- Strong experience with TypeScript and Node.js
- Experience with cloud platforms (GCP preferred)
- Familiarity with machine learning concepts
- Excellent communication skills

Location: Remote-friendly
Compensation: $150,000 - $200,000`;

  // Test resume chunks (simplified version of real resume content)
  const testChunks = [
    {
      chunkId: `${RESUME_GEN_TEST_PREFIX}chunk_001`,
      title: "Summary",
      sourceRef: "h2:Summary",
      content: "Experienced software engineer with 10+ years building scalable web applications and AI systems. Expert in TypeScript, React, Node.js, and GCP.",
      version: 9997,
    },
    {
      chunkId: `${RESUME_GEN_TEST_PREFIX}chunk_002`,
      title: "Experience > TechCorp",
      sourceRef: "h2:Experience > h3:TechCorp",
      content: `Senior Engineer at TechCorp (2019-2024)
- Led development of AI-powered analytics dashboard serving 50K+ users
- Built microservices architecture using Node.js and GCP Cloud Run
- Mentored team of 5 engineers and conducted 200+ code reviews
- Reduced API latency by 40% through optimization`,
      version: 9997,
    },
    {
      chunkId: `${RESUME_GEN_TEST_PREFIX}chunk_003`,
      title: "Skills",
      sourceRef: "h2:Skills",
      content: `Programming: TypeScript, JavaScript, Python, Go
Frontend: React, Next.js, Tailwind CSS
Backend: Node.js, Express, PostgreSQL, Redis
Cloud: GCP (Cloud Run, Firestore, BigQuery), AWS
AI/ML: TensorFlow, LangChain, RAG systems`,
      version: 9997,
    },
    {
      chunkId: `${RESUME_GEN_TEST_PREFIX}chunk_004`,
      title: "Education",
      sourceRef: "h2:Education",
      content: "B.S. Computer Science, UC Berkeley, 2014 - Graduated with honors",
      version: 9997,
    },
  ];

  // Save original resume index for restoration
  const resumeIndexRef11 = firestore.doc("resumeIndex/current");
  const originalIndexSnapshot11 = await resumeIndexRef11.get();
  const originalIndexData11 = originalIndexSnapshot11.exists ? originalIndexSnapshot11.data() : null;

  try {
    // Step 11.1: Write test chunks to Firestore
    log("Writing test resume chunks to Firestore...");
    const chunkBatch = firestore.batch();
    for (const chunk of testChunks) {
      const docRef = firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.chunkId);
      chunkBatch.set(docRef, chunk);
    }
    await chunkBatch.commit();
    log(`Wrote ${testChunks.length} test chunks`, true);

    // Update resume index
    const testIndexData = {
      resumeGcsPath: "resume/master.md",
      indexedAt: Timestamp.now(),
      chunkCount: testChunks.length,
      version: 9997,
    };
    await resumeIndexRef11.set(testIndexData);
    log("Resume index updated", true);

    // Step 11.2: Test resume generation with Vertex AI
    log("Initializing Vertex AI for resume generation...");
    const vertexAI = new VertexAI({
      project: env.GCP_PROJECT_ID,
      location: env.VERTEX_AI_LOCATION,
    });

    const model = vertexAI.getGenerativeModel({
      model: env.VERTEX_AI_MODEL,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    // Build the resume context
    const resumeContext = testChunks
      .map((chunk, i) => `[CHUNK ${i + 1}: ${chunk.title}]\n${chunk.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a resume writer. Generate a tailored resume as JSON.
CRITICAL: Only use information from the resume context provided. Never invent information.

Output valid JSON with this structure:
{
  "header": { "name": "Sam Kirk", "title": "Professional Title" },
  "summary": "2-3 sentence summary",
  "skills": [{ "category": "Category", "items": ["skill1", "skill2"] }],
  "experience": [{ "title": "Title", "company": "Company", "dateRange": "YYYY-YYYY", "bullets": ["bullet1"] }],
  "education": [{ "degree": "Degree", "institution": "School", "year": "YYYY" }]
}`;

    const userPrompt = `## Job Posting
${testJobText}

## Resume Context (SOURCE OF TRUTH)
${resumeContext}

Generate a tailored resume JSON. Only include facts from the resume context.`;

    log("Generating tailored resume with Vertex AI...");
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
      ],
    });

    const response = result.response;
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates in resume generation response");
    }

    const responseText = response.candidates[0].content.parts
      .filter((p): p is { text: string } => "text" in p)
      .map((p) => p.text)
      .join("")
      .trim();

    // Parse JSON response
    let jsonText = responseText;
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();

    const resumeContent = JSON.parse(jsonText);
    log("Resume JSON parsed successfully", true);

    // Validate structure
    if (!resumeContent.header?.name || !resumeContent.summary) {
      throw new Error("Resume content missing required fields");
    }
    log(`Generated resume for: ${resumeContent.header.name}`, true);
    log(`Title: ${resumeContent.header.title}`);
    log(`Experience entries: ${resumeContent.experience?.length ?? 0}`);
    log(`Skill categories: ${resumeContent.skills?.length ?? 0}`);

    // Step 11.3: Generate markdown from content
    log("Generating markdown from resume content...");
    const markdownSections: string[] = [];
    markdownSections.push(`# ${resumeContent.header.name}`);
    markdownSections.push(`**${resumeContent.header.title}**\n`);
    markdownSections.push(`## Professional Summary\n${resumeContent.summary}\n`);

    if (resumeContent.skills?.length > 0) {
      markdownSections.push("## Skills");
      for (const skill of resumeContent.skills) {
        markdownSections.push(`**${skill.category}:** ${skill.items.join(", ")}`);
      }
      markdownSections.push("");
    }

    if (resumeContent.experience?.length > 0) {
      markdownSections.push("## Professional Experience");
      for (const exp of resumeContent.experience) {
        markdownSections.push(`### ${exp.title} — ${exp.company}`);
        markdownSections.push(`*${exp.dateRange}*\n`);
        for (const bullet of exp.bullets) {
          markdownSections.push(`- ${bullet}`);
        }
        markdownSections.push("");
      }
    }

    const markdown = markdownSections.join("\n");
    const wordCount = markdown.split(/\s+/).filter((w) => w.length > 0).length;
    log(`Generated markdown: ${wordCount} words, ${markdown.length} characters`, true);

    // Step 11.4: Write artifacts to GCS
    log("Writing resume artifacts to GCS...");
    const testSubmissionId = `${RESUME_GEN_TEST_PREFIX}${Date.now()}`;
    const artifactPrefix = `submissions/${testSubmissionId}/`;

    await privateBucket
      .file(`${artifactPrefix}output/resume.md`)
      .save(markdown, {
        contentType: "text/markdown; charset=utf-8",
        resumable: false,
      });

    // Simple HTML wrapper
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resume - ${resumeContent.header.name}</title>
  <style>body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }</style>
</head>
<body>
${markdown.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/^- (.+)$/gm, '<li>$1</li>')
  .replace(/\n/g, '<br>')}
</body>
</html>`;

    await privateBucket
      .file(`${artifactPrefix}output/resume.html`)
      .save(html, {
        contentType: "text/html; charset=utf-8",
        resumable: false,
      });

    log("Artifacts written to GCS", true);

    // Step 11.5: Create submission record
    log("Creating submission record...");
    const submissionRef = firestore.collection(SUBMISSIONS_COLLECTION).doc(testSubmissionId);
    await submissionRef.set({
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000),
      tool: "resume",
      status: "complete",
      sessionId: `smoke_test_${Date.now()}`,
      inputs: { jobText: testJobText.substring(0, 200) },
      extracted: { targetTitle: resumeContent.header.title },
      outputs: {
        wordCount,
        experienceEntries: resumeContent.experience?.length ?? 0,
        resumeMdPath: `${artifactPrefix}output/resume.md`,
        resumeHtmlPath: `${artifactPrefix}output/resume.html`,
      },
      citations: testChunks.map((c) => ({
        chunkId: c.chunkId,
        title: c.title,
        sourceRef: c.sourceRef,
      })),
      artifactGcsPrefix: artifactPrefix,
    });
    log("Submission record created", true);

    // Step 11.6: Verify artifacts can be read back
    log("Verifying artifacts...");
    const [mdContent] = await privateBucket
      .file(`${artifactPrefix}output/resume.md`)
      .download();
    if (!mdContent.toString().includes(resumeContent.header.name)) {
      throw new Error("Markdown artifact content verification failed");
    }
    log("Artifacts verified", true);

    // Cleanup
    log("Cleaning up test data...");

    // Delete test chunks
    const deleteChunkBatch = firestore.batch();
    for (const chunk of testChunks) {
      deleteChunkBatch.delete(firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.chunkId));
    }
    await deleteChunkBatch.commit();
    log("Test chunks deleted", true);

    // Delete test submission
    await submissionRef.delete();
    log("Test submission deleted", true);

    // Delete GCS artifacts
    const [artifactFiles] = await privateBucket.getFiles({ prefix: artifactPrefix });
    for (const file of artifactFiles) {
      await file.delete();
    }
    log(`Deleted ${artifactFiles.length} artifact files`, true);

    // Restore original resume index
    if (originalIndexData11) {
      await resumeIndexRef11.set(originalIndexData11);
      log("Resume index restored", true);
    } else {
      await resumeIndexRef11.delete();
      log("Resume index removed (none existed before)", true);
    }

    log("Resume generation test complete", true);
    sectionsPassed++;

  } catch (error) {
    // Cleanup on failure
    try {
      // Delete test chunks
      for (const chunk of testChunks) {
        try {
          await firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.chunkId).delete();
        } catch { /* ignore */ }
      }
      // Delete any test submissions
      const testSubs = await firestore.collection(SUBMISSIONS_COLLECTION)
        .where("sessionId", ">=", "smoke_test_")
        .limit(10)
        .get();
      for (const doc of testSubs.docs) {
        if (doc.id.startsWith(RESUME_GEN_TEST_PREFIX)) {
          await doc.ref.delete();
        }
      }
      // Delete test artifacts
      const [files] = await privateBucket.getFiles({ prefix: `submissions/${RESUME_GEN_TEST_PREFIX}` });
      for (const file of files) {
        await file.delete();
      }
      // Restore resume index
      try {
        if (originalIndexData11) {
          await resumeIndexRef11.set(originalIndexData11);
        } else {
          await resumeIndexRef11.delete();
        }
      } catch { /* ignore */ }
    } catch {
      log("Warning: Failed to cleanup test data during error handling", false);
    }

    log(
      `Resume generation test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 11

  // Section 12: Interview Chat Test (Step 8.2)
  if (shouldRunSection(12, selectedSections)) {
  console.log("\n--- Section 12: Interview Chat Test ---\n");
  sectionsRun++;

  const RESUME_CHUNKS_COLLECTION = "resumeChunks";
  const SUBMISSIONS_COLLECTION = "submissions";
  const INTERVIEW_TEST_PREFIX = "_smoke_interview_";

  // Test resume chunks for interview context
  const testChunks = [
    {
      chunkId: `${INTERVIEW_TEST_PREFIX}chunk_001`,
      title: "Summary",
      sourceRef: "h2:Summary",
      content: "Sam Kirk is an experienced software engineer with 10+ years building scalable web applications and AI systems. Expert in TypeScript, React, Node.js, and GCP.",
      version: 9996,
    },
    {
      chunkId: `${INTERVIEW_TEST_PREFIX}chunk_002`,
      title: "Experience",
      sourceRef: "h2:Experience",
      content: `Senior Engineer at TechCorp (2019-2024)
- Led development of AI-powered analytics dashboard serving 50K+ users
- Built microservices architecture using Node.js and GCP Cloud Run
- Mentored team of 5 engineers

Software Engineer at StartupXYZ (2016-2019)
- Full-stack development with React and Node.js
- Implemented CI/CD pipelines`,
      version: 9996,
    },
    {
      chunkId: `${INTERVIEW_TEST_PREFIX}chunk_003`,
      title: "Skills",
      sourceRef: "h2:Skills",
      content: `Programming: TypeScript, JavaScript, Python, Go
Cloud: GCP (Cloud Run, Firestore, BigQuery), AWS
AI/ML: TensorFlow, LangChain, RAG systems
Location: Open to remote work, based in San Francisco Bay Area`,
      version: 9996,
    },
  ];

  // Test conversation questions
  const testQuestions = [
    {
      question: "What is your background?",
      expectedTopics: ["engineer", "experience", "years"],
      isCareerRelated: true,
    },
    {
      question: "What are your technical skills?",
      expectedTopics: ["typescript", "python", "cloud", "gcp"],
      isCareerRelated: true,
    },
  ];

  // Save original resume index for restoration
  const resumeIndexRef12 = firestore.doc("resumeIndex/current");
  const originalIndexSnapshot12 = await resumeIndexRef12.get();
  const originalIndexData12 = originalIndexSnapshot12.exists ? originalIndexSnapshot12.data() : null;

  try {
    // Step 12.1: Write test chunks to Firestore
    log("Writing test resume chunks to Firestore...");
    const chunkBatch = firestore.batch();
    for (const chunk of testChunks) {
      const docRef = firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.chunkId);
      chunkBatch.set(docRef, chunk);
    }
    await chunkBatch.commit();
    log(`Wrote ${testChunks.length} test chunks`, true);

    // Update resume index
    const testIndexData = {
      resumeGcsPath: "resume/master.md",
      indexedAt: Timestamp.now(),
      chunkCount: testChunks.length,
      version: 9996,
    };
    await resumeIndexRef12.set(testIndexData);
    log("Resume index updated", true);

    // Step 12.2: Initialize Vertex AI for chat
    log("Initializing Vertex AI for interview chat...");
    const vertexAI = new VertexAI({
      project: env.GCP_PROJECT_ID,
      location: env.VERTEX_AI_LOCATION,
    });

    const model = vertexAI.getGenerativeModel({
      model: env.VERTEX_AI_MODEL,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });
    log("Vertex AI initialized", true);

    // Step 12.3: Build context and system prompt
    const resumeContext = testChunks
      .map((chunk, i) => `[CHUNK ${i + 1}: ${chunk.title}]\nSource: ${chunk.sourceRef}\n\n${chunk.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a professional career interview assistant representing Sam Kirk. Your role is to answer questions about Sam Kirk's career, skills, experience, and professional background.

## YOUR KNOWLEDGE BASE

<resume_context>
${resumeContext}
</resume_context>

## RULES

1. Only discuss career-related topics (work history, skills, projects, education, availability, location).
2. Only use information from the resume context above. Don't invent information.
3. Speak in first person as if you are Sam Kirk.
4. Keep responses concise but informative.
5. If asked about off-topic subjects (personal life, politics, religion, etc.), politely redirect to career topics.`;

    // Step 12.4: Test multi-turn conversation
    log("Testing multi-turn conversation...");
    const conversationHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    for (const testCase of testQuestions) {
      log(`  Q: "${testCase.question}"`);

      // Build conversation with history
      const contents = [
        ...conversationHistory,
        { role: "user" as const, parts: [{ text: testCase.question }] },
      ];

      const result = await model.generateContent({
        contents,
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
      });

      const response = result.response;
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates in response");
      }

      const responseText = response.candidates[0].content.parts
        .filter((p): p is { text: string } => "text" in p)
        .map((p) => p.text)
        .join("")
        .trim();

      // Verify response contains expected topics
      const responseLower = responseText.toLowerCase();
      const foundTopics = testCase.expectedTopics.filter((topic) =>
        responseLower.includes(topic.toLowerCase())
      );

      if (foundTopics.length === 0) {
        log(`  A: "${responseText.substring(0, 150)}..."`, false);
        throw new Error(
          `Response doesn't contain any expected topics: ${testCase.expectedTopics.join(", ")}`
        );
      }

      log(`  A: "${responseText.substring(0, 100)}..."`, true);
      log(`  Found topics: ${foundTopics.join(", ")}`);

      // Add to conversation history
      conversationHistory.push(
        { role: "user", parts: [{ text: testCase.question }] },
        { role: "model", parts: [{ text: responseText }] }
      );
    }
    log("Multi-turn conversation test passed", true);

    // Step 12.5: Test off-topic redirection
    log("Testing off-topic redirection...");
    const offTopicQuestion = "What are your political views?";

    const offTopicResult = await model.generateContent({
      contents: [
        ...conversationHistory,
        { role: "user" as const, parts: [{ text: offTopicQuestion }] },
      ],
      systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
    });

    const offTopicResponse = offTopicResult.response;
    if (!offTopicResponse.candidates || offTopicResponse.candidates.length === 0) {
      throw new Error("No candidates in off-topic response");
    }

    const offTopicText = offTopicResponse.candidates[0].content.parts
      .filter((p): p is { text: string } => "text" in p)
      .map((p) => p.text)
      .join("")
      .trim()
      .toLowerCase();

    // Should redirect or decline, not provide political opinions
    const isRedirect = offTopicText.includes("career") ||
      offTopicText.includes("professional") ||
      offTopicText.includes("work") ||
      offTopicText.includes("focus") ||
      offTopicText.includes("experience") ||
      offTopicText.includes("skills");

    if (!isRedirect) {
      log(`Off-topic response: "${offTopicText.substring(0, 150)}..."`, false);
      throw new Error("Model did not redirect off-topic question to career topics");
    }
    log("Off-topic redirection verified", true);

    // Step 12.6: Create test submission and transcript artifacts
    log("Creating test submission and transcript...");
    const testSubmissionId = `${INTERVIEW_TEST_PREFIX}${Date.now()}`;
    const artifactPrefix = `submissions/${testSubmissionId}/`;

    // Generate transcript markdown
    const transcriptLines = [
      "# Interview Transcript",
      "",
      "**Candidate:** Sam Kirk",
      `**Date:** ${new Date().toISOString()}`,
      `**Total Messages:** ${conversationHistory.length}`,
      "",
      "---",
      "",
    ];

    for (let i = 0; i < conversationHistory.length; i += 2) {
      const userMsg = conversationHistory[i];
      const assistantMsg = conversationHistory[i + 1];

      transcriptLines.push(`**Interviewer:**`);
      transcriptLines.push("");
      transcriptLines.push(userMsg.parts[0].text);
      transcriptLines.push("");
      transcriptLines.push("---");
      transcriptLines.push("");
      transcriptLines.push(`**Sam Kirk:**`);
      transcriptLines.push("");
      transcriptLines.push(assistantMsg.parts[0].text);
      transcriptLines.push("");
      transcriptLines.push("---");
      transcriptLines.push("");
    }

    transcriptLines.push("## Sources Referenced");
    transcriptLines.push("");
    testChunks.forEach((chunk, i) => {
      transcriptLines.push(`${i + 1}. **${chunk.title}** — ${chunk.sourceRef}`);
    });

    const transcript = transcriptLines.join("\n");

    // Write transcript to GCS
    await privateBucket
      .file(`${artifactPrefix}output/transcript.md`)
      .save(transcript, {
        contentType: "text/markdown; charset=utf-8",
        resumable: false,
      });

    // Write HTML version
    const transcriptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interview Transcript - Sam Kirk</title>
  <style>body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }</style>
</head>
<body>
${transcript
  .replace(/^# (.+)$/gm, '<h1>$1</h1>')
  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/---/g, '<hr>')
  .replace(/\n/g, '<br>')}
</body>
</html>`;

    await privateBucket
      .file(`${artifactPrefix}output/transcript.html`)
      .save(transcriptHtml, {
        contentType: "text/html; charset=utf-8",
        resumable: false,
      });
    log("Transcript artifacts written to GCS", true);

    // Create submission record
    const submissionRef = firestore.collection(SUBMISSIONS_COLLECTION).doc(testSubmissionId);
    await submissionRef.set({
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000),
      tool: "interview",
      status: "complete",
      sessionId: `smoke_test_${Date.now()}`,
      inputs: { conversationId: testSubmissionId },
      extracted: {
        messageCount: conversationHistory.length,
        turnCount: conversationHistory.length / 2,
      },
      outputs: {
        transcriptMdPath: `${artifactPrefix}output/transcript.md`,
        transcriptHtmlPath: `${artifactPrefix}output/transcript.html`,
      },
      citations: testChunks.map((c) => ({
        chunkId: c.chunkId,
        title: c.title,
        sourceRef: c.sourceRef,
      })),
      artifactGcsPrefix: artifactPrefix,
    });
    log("Submission record created", true);

    // Step 12.7: Verify artifacts
    log("Verifying artifacts...");
    const [mdContent] = await privateBucket
      .file(`${artifactPrefix}output/transcript.md`)
      .download();
    if (!mdContent.toString().includes("Interview Transcript")) {
      throw new Error("Transcript artifact verification failed");
    }
    log("Artifacts verified", true);

    // Cleanup
    log("Cleaning up test data...");

    // Delete test chunks
    const deleteChunkBatch = firestore.batch();
    for (const chunk of testChunks) {
      deleteChunkBatch.delete(firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.chunkId));
    }
    await deleteChunkBatch.commit();
    log("Test chunks deleted", true);

    // Delete test submission
    await submissionRef.delete();
    log("Test submission deleted", true);

    // Delete GCS artifacts
    const [artifactFiles] = await privateBucket.getFiles({ prefix: artifactPrefix });
    for (const file of artifactFiles) {
      await file.delete();
    }
    log(`Deleted ${artifactFiles.length} artifact files`, true);

    // Restore original resume index
    if (originalIndexData12) {
      await resumeIndexRef12.set(originalIndexData12);
      log("Resume index restored", true);
    } else {
      await resumeIndexRef12.delete();
      log("Resume index removed (none existed before)", true);
    }

    log("Interview chat test complete", true);
    sectionsPassed++;

  } catch (error) {
    // Cleanup on failure
    try {
      // Delete test chunks
      for (const chunk of testChunks) {
        try {
          await firestore.collection(RESUME_CHUNKS_COLLECTION).doc(chunk.chunkId).delete();
        } catch { /* ignore */ }
      }
      // Delete any test submissions
      const testSubs = await firestore.collection(SUBMISSIONS_COLLECTION)
        .where("sessionId", ">=", "smoke_test_")
        .limit(10)
        .get();
      for (const doc of testSubs.docs) {
        if (doc.id.startsWith(INTERVIEW_TEST_PREFIX)) {
          await doc.ref.delete();
        }
      }
      // Delete test artifacts
      const [files] = await privateBucket.getFiles({ prefix: `submissions/${INTERVIEW_TEST_PREFIX}` });
      for (const file of files) {
        await file.delete();
      }
      // Restore resume index
      try {
        if (originalIndexData12) {
          await resumeIndexRef12.set(originalIndexData12);
        } else {
          await resumeIndexRef12.delete();
        }
      } catch { /* ignore */ }
    } catch {
      log("Warning: Failed to cleanup test data during error handling", false);
    }

    log(
      `Interview chat test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 12

  // Section 13: Retention Cleanup Test (Step 9.2)
  if (shouldRunSection(13, selectedSections)) {
  console.log("\n--- Section 13: Retention Cleanup Test ---\n");
  sectionsRun++;

  const SUBMISSIONS_COLLECTION = "submissions";
  const RETENTION_TEST_PREFIX = "_smoke_retention_";

  // Helper to create test submission with specific timestamps
  async function createTestSubmission(
    firestore: Firestore,
    bucket: ReturnType<typeof storage.bucket>,
    submissionId: string,
    isExpired: boolean
  ): Promise<void> {
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    // For expired: createdAt 100 days ago, expiresAt 10 days ago
    // For non-expired: createdAt now, expiresAt in 90 days
    const createdAtMs = isExpired ? now - 100 * 24 * 60 * 60 * 1000 : now;
    const expiresAtMs = isExpired ? now - 10 * 24 * 60 * 60 * 1000 : now + ninetyDaysMs;

    const artifactGcsPrefix = `submissions/${submissionId}/`;

    // Create Firestore submission doc
    const submissionRef = firestore.collection(SUBMISSIONS_COLLECTION).doc(submissionId);
    await submissionRef.set({
      createdAt: Timestamp.fromMillis(createdAtMs),
      expiresAt: Timestamp.fromMillis(expiresAtMs),
      tool: "fit",
      status: "complete",
      sessionId: `${RETENTION_TEST_PREFIX}session`,
      inputs: { mode: "paste", text: "Test job posting" },
      extracted: { seniority: "senior" },
      outputs: { fitScore: "Well" },
      citations: [],
      artifactGcsPrefix,
    });

    // Create GCS artifacts
    const testContent = `Test artifact for submission ${submissionId} at ${new Date().toISOString()}`;
    await bucket.file(`${artifactGcsPrefix}output/report.md`).save(testContent, {
      contentType: "text/markdown; charset=utf-8",
      resumable: false,
    });
    await bucket.file(`${artifactGcsPrefix}output/report.html`).save(`<html><body>${testContent}</body></html>`, {
      contentType: "text/html; charset=utf-8",
      resumable: false,
    });
    await bucket.file(`${artifactGcsPrefix}input/job.txt`).save("Test job posting content", {
      contentType: "text/plain; charset=utf-8",
      resumable: false,
    });
  }

  // Test data IDs
  const expiredSubmission1 = `${RETENTION_TEST_PREFIX}expired_1_${Date.now()}`;
  const expiredSubmission2 = `${RETENTION_TEST_PREFIX}expired_2_${Date.now()}`;
  const nonExpiredSubmission = `${RETENTION_TEST_PREFIX}active_${Date.now()}`;

  try {
    // Step 13.1: Create test submissions
    log("Creating test submissions...");

    log("  Creating expired submission 1...");
    await createTestSubmission(firestore, privateBucket, expiredSubmission1, true);
    log(`  Created ${expiredSubmission1}`, true);

    log("  Creating expired submission 2...");
    await createTestSubmission(firestore, privateBucket, expiredSubmission2, true);
    log(`  Created ${expiredSubmission2}`, true);

    log("  Creating non-expired submission...");
    await createTestSubmission(firestore, privateBucket, nonExpiredSubmission, false);
    log(`  Created ${nonExpiredSubmission}`, true);

    log("All test submissions created", true);

    // Step 13.2: Verify all submissions exist before cleanup
    log("Verifying submissions exist before cleanup...");
    const beforeSnap1 = await firestore.collection(SUBMISSIONS_COLLECTION).doc(expiredSubmission1).get();
    const beforeSnap2 = await firestore.collection(SUBMISSIONS_COLLECTION).doc(expiredSubmission2).get();
    const beforeSnapActive = await firestore.collection(SUBMISSIONS_COLLECTION).doc(nonExpiredSubmission).get();

    if (!beforeSnap1.exists || !beforeSnap2.exists || !beforeSnapActive.exists) {
      throw new Error("Test submissions were not created correctly");
    }
    log("All 3 test submissions exist in Firestore", true);

    // Verify GCS artifacts exist
    const [files1] = await privateBucket.getFiles({ prefix: `submissions/${expiredSubmission1}/` });
    const [files2] = await privateBucket.getFiles({ prefix: `submissions/${expiredSubmission2}/` });
    const [filesActive] = await privateBucket.getFiles({ prefix: `submissions/${nonExpiredSubmission}/` });

    if (files1.length !== 3 || files2.length !== 3 || filesActive.length !== 3) {
      throw new Error(`Expected 3 GCS files per submission. Got: ${files1.length}, ${files2.length}, ${filesActive.length}`);
    }
    log("All GCS artifacts exist (3 files per submission)", true);

    // Step 13.3: Run retention cleanup logic
    // Note: Since this smoke test runs outside Next.js context and retention.ts has "server-only" import,
    // we implement the retention logic inline here. The actual endpoint uses the same Firestore/GCS calls.
    log("Running retention cleanup logic...");

    // Query for expired submissions
    const expiredQuery = firestore.collection(SUBMISSIONS_COLLECTION)
      .where("expiresAt", "<=", Timestamp.now())
      .orderBy("expiresAt", "asc")
      .limit(100);

    const expiredSnapshot = await expiredQuery.get();
    log(`Found ${expiredSnapshot.size} expired submissions`);

    // Filter to only our test submissions
    const testExpiredDocs = expiredSnapshot.docs.filter(doc =>
      doc.id.startsWith(RETENTION_TEST_PREFIX)
    );
    log(`  ${testExpiredDocs.length} are test submissions to clean up`);

    // Delete each expired test submission
    let deletedCount = 0;
    let gcsFilesDeleted = 0;

    for (const doc of testExpiredDocs) {
      const data = doc.data();
      const prefix = data.artifactGcsPrefix as string;

      // Delete GCS artifacts first
      const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
      const [filesToDelete] = await privateBucket.getFiles({ prefix: normalizedPrefix });

      for (const file of filesToDelete) {
        await file.delete();
        gcsFilesDeleted++;
      }

      // Delete Firestore doc
      await doc.ref.delete();
      deletedCount++;
    }

    log(`Deleted ${deletedCount} expired submissions`, true);
    log(`Deleted ${gcsFilesDeleted} GCS artifact files`, true);

    // Step 13.4: Verify expired submissions are deleted
    log("Verifying expired submissions are deleted...");

    const afterSnap1 = await firestore.collection(SUBMISSIONS_COLLECTION).doc(expiredSubmission1).get();
    const afterSnap2 = await firestore.collection(SUBMISSIONS_COLLECTION).doc(expiredSubmission2).get();

    if (afterSnap1.exists) {
      throw new Error(`Expired submission 1 still exists: ${expiredSubmission1}`);
    }
    if (afterSnap2.exists) {
      throw new Error(`Expired submission 2 still exists: ${expiredSubmission2}`);
    }
    log("Expired Firestore docs are deleted", true);

    // Verify GCS artifacts are deleted
    const [afterFiles1] = await privateBucket.getFiles({ prefix: `submissions/${expiredSubmission1}/` });
    const [afterFiles2] = await privateBucket.getFiles({ prefix: `submissions/${expiredSubmission2}/` });

    if (afterFiles1.length !== 0) {
      throw new Error(`GCS artifacts still exist for expired submission 1: ${afterFiles1.length} files`);
    }
    if (afterFiles2.length !== 0) {
      throw new Error(`GCS artifacts still exist for expired submission 2: ${afterFiles2.length} files`);
    }
    log("Expired GCS artifacts are deleted", true);

    // Step 13.5: Verify non-expired submission still exists
    log("Verifying non-expired submission still exists...");

    const afterSnapActive = await firestore.collection(SUBMISSIONS_COLLECTION).doc(nonExpiredSubmission).get();
    if (!afterSnapActive.exists) {
      throw new Error(`Non-expired submission was incorrectly deleted: ${nonExpiredSubmission}`);
    }
    log("Non-expired Firestore doc still exists", true);

    const [afterFilesActive] = await privateBucket.getFiles({ prefix: `submissions/${nonExpiredSubmission}/` });
    if (afterFilesActive.length !== 3) {
      throw new Error(`Non-expired submission GCS artifacts were deleted: expected 3, got ${afterFilesActive.length}`);
    }
    log("Non-expired GCS artifacts still exist (3 files)", true);

    // Step 13.6: Test idempotency - running cleanup again should succeed
    log("Testing idempotency (running cleanup again)...");

    const secondRunQuery = firestore.collection(SUBMISSIONS_COLLECTION)
      .where("expiresAt", "<=", Timestamp.now())
      .limit(100);

    const secondRunSnapshot = await secondRunQuery.get();
    const testDocsSecondRun = secondRunSnapshot.docs.filter(doc =>
      doc.id.startsWith(RETENTION_TEST_PREFIX)
    );

    if (testDocsSecondRun.length !== 0) {
      throw new Error(`Expected 0 expired test submissions on second run, found ${testDocsSecondRun.length}`);
    }
    log("Second cleanup run found no expired test submissions (idempotent)", true);

    // Cleanup: Delete the non-expired test submission
    log("Cleaning up remaining test data...");

    // Delete GCS artifacts for non-expired submission
    for (const file of afterFilesActive) {
      await file.delete();
    }
    log("Deleted non-expired submission GCS artifacts", true);

    // Delete Firestore doc
    await firestore.collection(SUBMISSIONS_COLLECTION).doc(nonExpiredSubmission).delete();
    log("Deleted non-expired submission Firestore doc", true);

    log("Retention cleanup test complete", true);
    sectionsPassed++;

  } catch (error) {
    // Cleanup on failure
    log("Cleaning up after failure...", false);
    try {
      // Try to delete all test submissions
      for (const submissionId of [expiredSubmission1, expiredSubmission2, nonExpiredSubmission]) {
        try {
          // Delete GCS files
          const [files] = await privateBucket.getFiles({ prefix: `submissions/${submissionId}/` });
          for (const file of files) {
            await file.delete();
          }
          // Delete Firestore doc
          await firestore.collection(SUBMISSIONS_COLLECTION).doc(submissionId).delete();
        } catch {
          // Ignore individual cleanup errors
        }
      }
    } catch {
      log("Warning: Failed to cleanup test data during error handling", false);
    }

    log(
      `Retention cleanup test failed: ${error instanceof Error ? error.message : error}`,
      false
    );
    process.exit(1);
  }
  } // End Section 13

  // Success!
  if (sectionsRun === 0) {
    console.log("\n⚠️  No sections were run. Use --list to see available sections.\n");
  } else {
    console.log(`\n=== Smoke tests complete: ${sectionsPassed}/${sectionsRun} sections passed ===\n`);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
