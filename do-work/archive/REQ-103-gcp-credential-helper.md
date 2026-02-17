---
id: REQ-103
title: "Create GCP credential helper"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-16T14:00:00-08:00
route: A
completed_at: 2026-02-16T14:40:00-08:00
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
- [x] **[Codex/Opus] [AI]** Create `web/src/lib/gcp-credentials.ts` — shared function that parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` or returns `undefined` for ADC fallback
- [x] **[Codex/Opus] [AI]** Write unit tests in `web/src/lib/gcp-credentials.test.ts` (valid JSON, missing env var, malformed JSON, missing required fields)
- [x] **[Codex/Opus] [AI]** TEST: Run `npm test -- gcp-credentials` — all pass

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

---

## Triage

**Route: A** - Simple

**Reasoning:** File paths, function signatures, and implementation details are all explicitly specified. Clear scope with well-defined test cases.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: The blueprint provides exact file paths, function signatures, caching pattern, and test cases. No architectural decisions needed.

*Skipped by work action*

## Implementation Summary

- Updated `web/src/lib/gcp-credentials.ts` — added try-catch around JSON.parse for descriptive error on malformed JSON
- Updated `web/src/lib/gcp-credentials.test.ts` — tightened malformed JSON assertion to check for "not valid JSON" message

*Completed by work action (Route A)*

## Testing

**Tests run:** `npm test -- gcp-credentials`
**Result:** ✓ All tests passing (7 tests)

**Tests verified:**
- `gcp-credentials.test.ts` — valid JSON parsing, undefined on missing env var, malformed JSON error, missing client_email, missing private_key, caching, caching undefined

*Verified by work action*
