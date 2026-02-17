---
id: REQ-104
title: "Update env.ts schema"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-103, REQ-105]
batch: "vercel-migration-phase-1"
source_step: "1.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Update env.ts schema (Step 1.2)

## What
Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` as an optional field to the Zod schema in `web/src/lib/env.ts` and update the corresponding tests.

## Checklist
- [ ] **[Codex/Opus] [AI]** Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` as `z.string().optional()` to Zod schema in `web/src/lib/env.ts`
- [ ] **[Codex/Opus] [AI]** Update `web/src/lib/env.test.ts` — add tests for schema with/without the new optional field
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm test -- env` — all pass

## Blueprint Guidance

### Step 1.2: Update env.ts schema

Add the new credential env var to the Zod schema as optional (required in production, absent in local dev).

```
Read web/src/lib/env.ts.

Add GOOGLE_APPLICATION_CREDENTIALS_JSON to the Zod schema:
- Type: z.string().optional()
- It should NOT be .min(1) — it's legitimately absent in local dev
- Do NOT change any existing env vars

Update existing env.test.ts if it validates the schema:
- Ensure tests still pass with the new optional field
- Add a test that the schema accepts a valid env with GOOGLE_APPLICATION_CREDENTIALS_JSON present
- Add a test that the schema accepts a valid env without GOOGLE_APPLICATION_CREDENTIALS_JSON

Run: npm test -- env
```

## Context
- **Document set**: vercel-migration
- **Phase**: 1 — GCP Credential Plumbing (Code Changes)
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory)

## Dependencies
Can be done in parallel with REQ-103 (no code dependency). REQ-105 depends on both REQ-103 and REQ-104.

---
*Source: docs/vercel-migration-TODO.md, Step 1.2*
