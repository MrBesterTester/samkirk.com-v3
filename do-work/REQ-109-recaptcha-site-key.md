---
id: REQ-109
title: "Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
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
- [ ] **[Sonnet 4] [AI]** Verify how `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is used in the codebase (search for references)
- [ ] **[Sonnet 4] [AI]** Document: on Vercel, set as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` env var in dashboard (auto-available at build time)

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
