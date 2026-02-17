---
id: REQ-103
title: "Create GCP credential helper"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-104, REQ-105]
batch: "vercel-migration-phase-1"
source_step: "1.1"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Create GCP credential helper (Step 1.1)

## What
Create a shared utility `web/src/lib/gcp-credentials.ts` that parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` when present and returns typed credentials, or returns `undefined` to fall back to ADC. Write comprehensive unit tests.

## Checklist
- [ ] **[Codex/Opus] [AI]** Create `web/src/lib/gcp-credentials.ts` — shared function that parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` or returns `undefined` for ADC fallback
- [ ] **[Codex/Opus] [AI]** Write unit tests in `web/src/lib/gcp-credentials.test.ts` (valid JSON, missing env var, malformed JSON, missing required fields)
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm test -- gcp-credentials` — all pass

## Blueprint Guidance

### Step 1.1: Create GCP credential helper

Create a shared utility that parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` when present and returns typed credentials, or returns `undefined` to fall back to ADC.

```
Read web/src/lib/env.ts to understand the current Zod schema.

Create web/src/lib/gcp-credentials.ts:
- Export a function `getGcpCredentials()` that:
  1. Reads `process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON`
  2. If set: parses the JSON string, validates it has `client_email` and `private_key` fields, and returns the parsed object typed as `{ client_email: string; private_key: string; [key: string]: unknown }`
  3. If not set: returns `undefined` (signals ADC fallback)
- Add `import "server-only"` at the top
- Cache the result in a module-level variable (same singleton pattern as other lib files)
- Keep it under 20 lines

Write a unit test in web/src/lib/gcp-credentials.test.ts:
- Test: returns parsed credentials when env var is set with valid JSON
- Test: returns undefined when env var is not set
- Test: throws descriptive error when env var is set but JSON is malformed
- Test: throws when JSON is valid but missing required fields (client_email, private_key)

Run: npm test -- gcp-credentials
```

## Context
- **Document set**: vercel-migration
- **Phase**: 1 — GCP Credential Plumbing (Code Changes)
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory)

## Dependencies
This is the first step. REQ-104 (env.ts schema) and REQ-105 (wiring into singletons) depend on this.

---
*Source: docs/vercel-migration-TODO.md, Step 1.1*
