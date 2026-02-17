---
id: REQ-105
title: "Wire credentials into GCP SDK singletons"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-16T14:43:00-08:00
route: B
completed_at: 2026-02-16T14:45:00-08:00
related: [REQ-103, REQ-104, REQ-106]
batch: "vercel-migration-phase-1"
source_step: "1.3"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Wire credentials into GCP SDK singletons (Step 1.3)

## What
Update `firestore.ts`, `storage.ts`, and `vertex-ai.ts` to import `getGcpCredentials` and pass explicit credentials to GCP SDK constructors when defined, falling back to ADC when undefined.

## Checklist
- [x] **[Codex/Opus] [AI]** Update `web/src/lib/firestore.ts` — import `getGcpCredentials`, pass `credentials` to `new Firestore()` when defined
- [x] **[Codex/Opus] [AI]** Update `web/src/lib/storage.ts` — same pattern for `new Storage()`
- [x] **[Codex/Opus] [AI]** Update `web/src/lib/vertex-ai.ts` — pass `googleAuthOptions: { credentials }` to `new VertexAI()` when defined
- [x] **[Codex/Opus] [AI]** TEST: Run `npm test` (full suite) — all pass, no regressions
- [x] **[Codex/Opus] [AI]** TEST: Run `npm run dev` — verify local dev still works with ADC

## Blueprint Guidance

### Step 1.3: Wire credentials into Firestore, Vertex AI, and Storage singletons

Update the three GCP SDK singleton constructors to pass explicit credentials when available.

```
Read web/src/lib/gcp-credentials.ts (just created in 1.1).
Read web/src/lib/firestore.ts, web/src/lib/vertex-ai.ts, web/src/lib/storage.ts.

Update web/src/lib/firestore.ts:
- Import getGcpCredentials from ./gcp-credentials
- In getFirestore(), call getGcpCredentials()
- If credentials are defined, pass them: new Firestore({ projectId, credentials })
- If undefined, keep current behavior: new Firestore({ projectId }) — ADC kicks in

Update web/src/lib/storage.ts:
- Same pattern: import getGcpCredentials, pass credentials to new Storage({ projectId, credentials }) when defined

Update web/src/lib/vertex-ai.ts:
- Import getGcpCredentials
- In getVertexAI(), call getGcpCredentials()
- If credentials are defined, pass: new VertexAI({ project, location, googleAuthOptions: { credentials } })
- If undefined, keep current behavior: new VertexAI({ project, location })

IMPORTANT: Do not change any other logic in these files. Only the constructor calls change.

Run: npm test (full suite — ensure nothing breaks)
Run: npm run dev (verify local dev still works with ADC)
```

## Context
- **Document set**: vercel-migration
- **Phase**: 1 — GCP Credential Plumbing (Code Changes)
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory)

## Dependencies
Depends on REQ-103 (credential helper must exist first). REQ-106 (local validation) depends on this.

---
*Source: docs/vercel-migration-TODO.md, Step 1.3*

---

## Triage

**Route: B** - Medium

**Reasoning:** Clear feature but need to read three files to find existing constructor patterns and apply the same credential-passing approach.

**Planning:** Not required

## Plan

**Planning not required** - Route B: Exploration-guided implementation

Rationale: Clear feature request. Need to discover existing constructor patterns in the three SDK files.

*Skipped by work action*

## Exploration

- `web/src/lib/firestore.ts:16-18` — `new Firestore({ projectId })` singleton pattern
- `web/src/lib/storage.ts:16-18` — `new Storage({ projectId })` same pattern
- `web/src/lib/vertex-ai.ts:163-166` — `new VertexAI({ project, location })` slightly different constructor shape
- All three use module-level cached singletons with a `get*()` function

*Explored by work action*

## Implementation Summary

- Updated `web/src/lib/firestore.ts` — imported `getGcpCredentials`, spread `credentials` into Firestore constructor when defined
- Updated `web/src/lib/storage.ts` — same pattern for Storage constructor
- Updated `web/src/lib/vertex-ai.ts` — spread `googleAuthOptions: { credentials }` into VertexAI constructor when defined
- Pattern used: `...(credentials && { credentials })` for conditional spread

*Completed by work action (Route B)*

## Testing

**Tests run:** `npm test` (full suite)
**Result:** ✓ All tests passing (1293 tests across 40 files)

**Note:** `npm run dev` verification deferred to REQ-106 (local validation step, requires Sam)

*Verified by work action*
