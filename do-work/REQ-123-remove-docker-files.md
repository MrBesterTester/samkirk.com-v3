---
id: REQ-123
title: "Remove Docker and Cloud Build files from repo"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-122, REQ-124]
batch: "vercel-migration-phase-7"
source_step: "7.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Remove Docker and Cloud Build files from repo (Step 7.2)

## What
Delete `web/Dockerfile`, `web/.dockerignore`, `cloudbuild.yaml`, and any Cloud Run deploy workflow from `.github/workflows/`. Verify tests and build still pass.

## Checklist
- [ ] **[Codex/Opus] [AI]** Delete `web/Dockerfile`
- [ ] **[Codex/Opus] [AI]** Delete `web/.dockerignore`
- [ ] **[Codex/Opus] [AI]** Delete `cloudbuild.yaml`
- [ ] **[Codex/Opus] [AI]** Remove any Cloud Run deploy workflow from `.github/workflows/`
- [ ] **[Sonnet 4] [AI]** TEST: Run `npm test` and `npm run build` — all still pass

## Blueprint Guidance

### Step 7.2: Remove Docker and Cloud Build files from repo

```
Delete these files from the repository:
- web/Dockerfile
- web/.dockerignore
- cloudbuild.yaml

Remove any Cloud Run deploy workflow from .github/workflows/ (if it exists beyond ci.yml).

Update CLAUDE.md:
- Remove references to Cloud Run deployment
- Update hosting references to Vercel
- Add Vercel-specific troubleshooting notes

Update README.md:
- Update deployment section to reference Vercel
- Remove Docker/Cloud Run instructions

Commit and push these cleanup changes.
```

## Context
- **Document set**: vercel-migration
- **Phase**: 7 — Cleanup Old Infrastructure
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory)

## Dependencies
Depends on REQ-122 (GCP infrastructure removed first). Can run in parallel with REQ-124.

---
*Source: docs/vercel-migration-TODO.md, Step 7.2*
