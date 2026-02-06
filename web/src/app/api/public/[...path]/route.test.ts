/**
 * @vitest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getPublicBucket } from "@/lib/storage";
import { config } from "dotenv";
import { resolve } from "path";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { Bucket } from "@google-cloud/storage";

// Load env vars from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

/**
 * Check if GCP credentials are available without throwing.
 */
function hasGcpCredentials(): boolean {
  return !!(
    process.env.GCP_PROJECT_ID &&
    process.env.GCS_PUBLIC_BUCKET
  );
}

const gcpAvailable = hasGcpCredentials();

describe("Public Proxy API Integration", () => {
  let bucket: Bucket;
  const testFilename = "_proxy_integration_test.txt";
  const testContent = "Integration test content for proxy";

  beforeAll(async () => {
    if (!gcpAvailable) return;
    bucket = getPublicBucket();
    // Write test file to GCS
    await bucket.file(testFilename).save(testContent, {
      contentType: "text/plain",
      resumable: false,
    });
  });

  afterAll(async () => {
    if (!gcpAvailable) return;
    // Cleanup
    try {
      await bucket.file(testFilename).delete();
    } catch {}
  });

  it.skipIf(!gcpAvailable)("should serve existing file from GCS via proxy", async () => {
    const req = new NextRequest(`http://localhost:3000/api/public/${testFilename}`);
    const params = Promise.resolve({ path: [testFilename] });

    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(testContent);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it.skipIf(!gcpAvailable)("should return 404 for missing file", async () => {
    const req = new NextRequest("http://localhost:3000/api/public/missing-file-123.txt");
    const params = Promise.resolve({ path: ["missing-file-123.txt"] });

    const res = await GET(req, { params });

    expect(res.status).toBe(404);
  });
});

describe("Public Proxy API – Security (unit)", () => {
  it("should block directory traversal attempts", async () => {
    // Clear the module registry so the route handler picks up our mock
    vi.resetModules();

    // Mock storage so this test runs without GCP credentials.
    // The traversal check fires after getPublicBucket() but before any
    // bucket methods, so we only need a minimal stub.
    vi.doMock("@/lib/storage", () => ({
      getPublicBucket: () => ({} as Bucket),
      fileExists: vi.fn(),
    }));

    // Import route handler AFTER the mock is installed
    const { GET: MockedGET } = await import("./route");

    const req = new NextRequest("http://localhost:3000/api/public/../secret.txt");
    const params = Promise.resolve({ path: ["..", "secret.txt"] });

    const res = await MockedGET(req, { params });

    expect(res.status).toBe(400);

    // Clean up mock and restore module registry
    vi.doUnmock("@/lib/storage");
    vi.resetModules();
  });
});
