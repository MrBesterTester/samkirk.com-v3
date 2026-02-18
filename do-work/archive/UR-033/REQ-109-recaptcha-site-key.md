---
id: REQ-109
title: "Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-16T20:00:00-08:00
route: A
completed_at: 2026-02-16T20:01:00-08:00
related: [REQ-107, REQ-108]
batch: "vercel-migration-phase-2"
source_step: "2.3"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY (Step 2.3)

## What
Verify how `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is used in the codebase and document that on Vercel it should be set as a `NEXT_PUBLIC_` env var in the dashboard (auto-available at build time).

## Checklist
- [x] **[Sonnet 4] [AI]** Verify how `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is used in the codebase (search for references)
- [x] **[Sonnet 4] [AI]** Document: on Vercel, set as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` env var in dashboard (auto-available at build time)

## Blueprint Guidance

### Step 2.3: Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY for Vercel builds

Currently, the reCAPTCHA site key is injected as a Docker build arg. On Vercel, it needs to be a `NEXT_PUBLIC_` env var available at build time.

```
Check how NEXT_PUBLIC_RECAPTCHA_SITE_KEY is currently used in the codebase:
- Search for NEXT_PUBLIC_RECAPTCHA_SITE_KEY in web/src/

On Vercel, NEXT_PUBLIC_ env vars set in the dashboard are automatically available at build time. No code changes needed — just ensure it's set in the Vercel dashboard as NEXT_PUBLIC_RECAPTCHA_SITE_KEY.

Document this in the Vercel env var setup step (Phase 4).
```

## Context
- **Document set**: vercel-migration
- **Phase**: 2 — Next.js Configuration for Vercel
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — quick investigation)

## Dependencies
No code dependencies. Can be done in parallel with REQ-107 and REQ-108.

---
*Source: docs/vercel-migration-TODO.md, Step 2.3*

---

## Triage

**Route: A** - Simple

**Reasoning:** Pure investigation/documentation task — search for env var usage and confirm no code changes needed.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple verification task with clear scope. Search for references, document findings.

*Skipped by work action*

## Implementation Summary

**Codebase usage of `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`:**

- `web/src/components/ReCaptcha.tsx:91` — reads `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY` to initialize the reCAPTCHA widget
- `web/src/components/ReCaptcha.test.tsx` — tests set/restore the env var
- `web/src/components/ToolGate.test.tsx:20` — test sets the env var
- `web/Dockerfile:29-30` — currently injected as a Docker `ARG`/`ENV`
- `cloudbuild.yaml:16` — Cloud Build passes the value from Secret Manager as a build arg
- `web/.env.local.example:18` — documented for local dev

**Vercel migration note:** On Vercel, `NEXT_PUBLIC_` prefixed env vars set in the Vercel dashboard are automatically inlined into the client bundle at build time. No code changes are required — the existing `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY` usage in `ReCaptcha.tsx` will work as-is. The key just needs to be added as an env var in the Vercel project settings (covered by REQ-111).

*Completed by work action (Route A)*

## Testing

**Tests run:** N/A
**Result:** No code changes — investigation/documentation only. Existing tests remain unaffected.

*Verified by work action*
