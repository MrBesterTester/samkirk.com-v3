import "server-only";

import { z } from "zod";

// Vercel env vars may contain trailing newlines — trim all string values
const trimmed = z.string().transform((s) => s.trim());

const envSchema = z.object({
  GCP_PROJECT_ID: trimmed.pipe(z.string().min(1)),
  GCS_PUBLIC_BUCKET: trimmed.pipe(z.string().min(1)),
  GCS_PRIVATE_BUCKET: trimmed.pipe(z.string().min(1)),
  VERTEX_AI_LOCATION: trimmed.pipe(z.string().min(1)),
  VERTEX_AI_MODEL: trimmed.pipe(z.string().min(1)),
  RECAPTCHA_SITE_KEY: trimmed.pipe(z.string().min(1)),
  RECAPTCHA_SECRET_KEY: trimmed.pipe(z.string().min(1)),
  GOOGLE_OAUTH_CLIENT_ID: trimmed.pipe(z.string().min(1)),
  GOOGLE_OAUTH_CLIENT_SECRET: trimmed.pipe(z.string().min(1)),
  ADMIN_ALLOWED_EMAIL: trimmed.pipe(z.string().email()),
  AUTH_SECRET: trimmed.pipe(z.string().min(32)),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: trimmed.optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(env: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Invalid environment variables: ${formatted}`);
  }

  return result.data;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }

  return cachedEnv;
}
