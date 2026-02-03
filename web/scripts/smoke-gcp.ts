/**
 * Smoke test script for GCP integration (Firestore + Cloud Storage).
 *
 * Run with: cd web && npm run smoke:gcp
 *
 * Prerequisites:
 * - GCP credentials set up (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - web/.env.local file with required environment variables
 *
 * This script:
 * 1. Validates all required environment variables are present
 * 2. Writes/reads a test object in the private GCS bucket
 * 3. Writes/reads a test document in Firestore
 * 4. Cleans up test artifacts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from the web directory
config({ path: resolve(__dirname, "../.env.local") });

import { Firestore, Timestamp } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { z } from "zod";

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
  console.log("\n=== GCP Smoke Test ===\n");

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

  // Step 2: Test Cloud Storage
  console.log("\n--- Cloud Storage Test ---\n");

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
  } catch (error) {
    log(`Cloud Storage test failed: ${error instanceof Error ? error.message : error}`, false);
    process.exit(1);
  }

  // Step 3: Test Firestore
  console.log("\n--- Firestore Test ---\n");

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
  } catch (error) {
    log(`Firestore test failed: ${error instanceof Error ? error.message : error}`, false);
    process.exit(1);
  }

  // Step 4: Test Session Creation (Firestore-based)
  console.log("\n--- Session Test ---\n");

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

  // Step 5: Test Resume Upload Flow (GCS + Firestore metadata)
  console.log("\n--- Resume Upload Test ---\n");

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

  // Step 6: Test Resume Chunking (Step 3.3 verification)
  console.log("\n--- Resume Chunking Test ---\n");

  const RESUME_CHUNKS_COLLECTION = "resumeChunks";

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

  // Store original chunk data if any exists
  let originalChunks: Array<{ id: string; data: Record<string, unknown> }> = [];

  try {
    // First, store original resume state (reuse from Step 5 if needed)
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

  // Step 7: Test Dance Menu Upload Flow (Public GCS bucket)
  console.log("\n--- Dance Menu Upload Test ---\n");

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

  // Success!
  console.log("\n=== All smoke tests passed! ===\n");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
