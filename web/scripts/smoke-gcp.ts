/**
 * Smoke test script for GCP integration (Firestore + Cloud Storage).
 *
 * Run with: npm run smoke:gcp
 *
 * Prerequisites:
 * - GCP credentials set up (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 * - Required environment variables set (see env.ts)
 *
 * This script:
 * 1. Validates all required environment variables are present
 * 2. Writes/reads a test object in the private GCS bucket
 * 3. Writes/reads a test document in Firestore
 * 4. Cleans up test artifacts
 */

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

  // Success!
  console.log("\n=== All smoke tests passed! ===\n");
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
