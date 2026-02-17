import "server-only";

export type GcpCredentials = { client_email: string; private_key: string; [key: string]: unknown };

let cached: GcpCredentials | undefined;
let resolved = false;

export function getGcpCredentials(): GcpCredentials | undefined {
  if (resolved) return cached;
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) { resolved = true; return undefined; }
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON"); }
  if (typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON missing required fields: client_email, private_key");
  }
  cached = parsed as GcpCredentials;
  resolved = true;
  return cached;
}
