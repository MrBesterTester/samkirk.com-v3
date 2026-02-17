import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const baseEnv = {
  NODE_ENV: "test" as const,
  GCP_PROJECT_ID: "project-123",
  GCS_PUBLIC_BUCKET: "public-bucket",
  GCS_PRIVATE_BUCKET: "private-bucket",
  VERTEX_AI_LOCATION: "us-central1",
  VERTEX_AI_MODEL: "gemini-2.0-flash-001",
  RECAPTCHA_SITE_KEY: "recaptcha-site",
  RECAPTCHA_SECRET_KEY: "recaptcha-secret",
  GOOGLE_OAUTH_CLIENT_ID: "oauth-client",
  GOOGLE_OAUTH_CLIENT_SECRET: "oauth-secret",
  ADMIN_ALLOWED_EMAIL: "admin@example.com",
  AUTH_SECRET: "this-is-a-32-character-or-longer-secret-key",
};

describe("parseEnv", () => {
  it("parses a valid environment", () => {
    const env = parseEnv(baseEnv);

    expect(env.GCP_PROJECT_ID).toBe("project-123");
    expect(env.GCS_PRIVATE_BUCKET).toBe("private-bucket");
  });

  it("throws when required values are missing", () => {
    const rest = { ...baseEnv } as NodeJS.ProcessEnv;
    delete rest.GCP_PROJECT_ID;

    expect(() => parseEnv(rest)).toThrow(
      "Invalid environment variables: GCP_PROJECT_ID"
    );
  });

  it("accepts env with GOOGLE_APPLICATION_CREDENTIALS_JSON present", () => {
    const env = parseEnv({
      ...baseEnv,
      GOOGLE_APPLICATION_CREDENTIALS_JSON: '{"client_email":"sa@test.iam.gserviceaccount.com","private_key":"key"}',
    });
    expect(env.GOOGLE_APPLICATION_CREDENTIALS_JSON).toBe(
      '{"client_email":"sa@test.iam.gserviceaccount.com","private_key":"key"}'
    );
  });

  it("accepts env without GOOGLE_APPLICATION_CREDENTIALS_JSON", () => {
    const env = parseEnv(baseEnv);
    expect(env.GOOGLE_APPLICATION_CREDENTIALS_JSON).toBeUndefined();
  });

  it("throws when required values are empty", () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        RECAPTCHA_SECRET_KEY: "",
      })
    ).toThrow("Invalid environment variables: RECAPTCHA_SECRET_KEY");
  });
});
