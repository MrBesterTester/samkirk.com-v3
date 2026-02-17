---
id: REQ-124
title: "Update CLAUDE.md and project docs"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-122, REQ-123]
batch: "vercel-migration-phase-7"
source_step: "7.3"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Update CLAUDE.md and project docs (Step 7.3)

## What
Update CLAUDE.md to reflect Vercel hosting, auto-deploy on push, and Vercel env vars for secrets. Update README.md deployment section. Commit all cleanup changes.

## Checklist
- [ ] **[Sonnet 4] [AI]** Update CLAUDE.md — hosting: Vercel Pro, deploy: auto on push, secrets: Vercel env vars
- [ ] **[Sonnet 4] [AI]** Update README.md — deployment section references Vercel instead of Cloud Run
- [ ] **[Sonnet 4] [AI]** Commit all cleanup changes

## Blueprint Guidance

### Step 7.3: Update CLAUDE.md and project docs

```
Update CLAUDE.md with:
- Hosting: Vercel Pro (was Cloud Run)
- Deploy: automatic on push to main (was manual gcloud builds submit)
- Secrets: Vercel environment variables (was GCP Secret Manager)
- Add note about GOOGLE_APPLICATION_CREDENTIALS_JSON for GCP auth from Vercel

Update docs/vercel-migration-SPECIFICATION.md: mark as completed.

Update the "Current prefixed set" in CLAUDE.md to reference vercel-migration if needed.
```

## Context
- **Document set**: vercel-migration
- **Phase**: 7 — Cleanup Old Infrastructure
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — doc updates)

## Dependencies
Can run in parallel with REQ-123. Should be the final step in the migration.

---
*Source: docs/vercel-migration-TODO.md, Step 7.3*
