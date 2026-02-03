/**
 * @vitest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { getPublicBucket } from "@/lib/storage";
import { config } from "dotenv";
import { resolve } from "path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Load env vars from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

describe("Public Proxy API Integration", () => {
  const bucket = getPublicBucket();
  const testFilename = "_proxy_integration_test.txt";
  const testContent = "Integration test content for proxy";

  beforeAll(async () => {
    // Write test file to GCS
    await bucket.file(testFilename).save(testContent, {
      contentType: "text/plain",
      resumable: false,
    });
  });

  afterAll(async () => {
    // Cleanup
    try {
      await bucket.file(testFilename).delete();
    } catch {}
  });

  it("should serve existing file from GCS via proxy", async () => {
    const req = new NextRequest(`http://localhost:3000/api/public/${testFilename}`);
    const params = Promise.resolve({ path: [testFilename] });
    
    const res = await GET(req, { params });
    
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(testContent);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it("should return 404 for missing file", async () => {
    const req = new NextRequest("http://localhost:3000/api/public/missing-file-123.txt");
    const params = Promise.resolve({ path: ["missing-file-123.txt"] });
    
    const res = await GET(req, { params });
    
    expect(res.status).toBe(404);
  });

  it("should block directory traversal attempts", async () => {
    const req = new NextRequest("http://localhost:3000/api/public/../secret.txt");
    const params = Promise.resolve({ path: ["..", "secret.txt"] });
    
    const res = await GET(req, { params });
    
    expect(res.status).toBe(400);
  });
});
