import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const VALID_CREDS = JSON.stringify({
  client_email: "sa@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----\n", // gitleaks:allow
  type: "service_account",
  project_id: "my-project",
});

async function loadModule() {
  const mod = await import("./gcp-credentials");
  return mod.getGcpCredentials;
}

describe("getGcpCredentials", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  });

  it("returns parsed credentials when env var is set with valid JSON", async () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = VALID_CREDS;
    const getGcpCredentials = await loadModule();

    const creds = getGcpCredentials();
    expect(creds).toBeDefined();
    expect(creds!.client_email).toBe("sa@project.iam.gserviceaccount.com");
    expect(creds!.private_key).toContain("BEGIN RSA PRIVATE KEY");
    expect(creds!.project_id).toBe("my-project");
  });

  it("returns undefined when env var is not set", async () => {
    const getGcpCredentials = await loadModule();
    expect(getGcpCredentials()).toBeUndefined();
  });

  it("throws descriptive error when env var is set but JSON is malformed", async () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = "not-json{{{";
    const getGcpCredentials = await loadModule();
    expect(() => getGcpCredentials()).toThrow("not valid JSON");
  });

  it("throws when JSON is valid but missing client_email", async () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify({
      private_key: "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----\n", // gitleaks:allow
    });
    const getGcpCredentials = await loadModule();
    expect(() => getGcpCredentials()).toThrow("missing required fields");
  });

  it("throws when JSON is valid but missing private_key", async () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify({
      client_email: "sa@project.iam.gserviceaccount.com",
    });
    const getGcpCredentials = await loadModule();
    expect(() => getGcpCredentials()).toThrow("missing required fields");
  });

  it("caches the result across multiple calls", async () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = VALID_CREDS;
    const getGcpCredentials = await loadModule();

    const first = getGcpCredentials();
    const second = getGcpCredentials();
    expect(first).toBe(second); // same reference
  });

  it("caches undefined result when env var is not set", async () => {
    const getGcpCredentials = await loadModule();
    expect(getGcpCredentials()).toBeUndefined();
    // Setting env after first call should not change the cached result
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = VALID_CREDS;
    expect(getGcpCredentials()).toBeUndefined();
  });
});
