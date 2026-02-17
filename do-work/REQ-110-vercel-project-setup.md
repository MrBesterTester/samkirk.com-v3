---
id: REQ-110
title: "Create Vercel project and connect repository"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-111, REQ-112]
batch: "vercel-migration-phase-3"
source_step: "3.1"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Create Vercel project and connect repository (Step 3.1)

## What
Sam creates a new project in the Vercel dashboard, imports the samkirk-v3 GitHub repo, sets root directory to `web`, and configures the Next.js framework preset. Do NOT deploy yet.

## Checklist
- [ ] **[Sam]** Create new project in Vercel dashboard
- [ ] **[Sam]** Import samkirk-v3 GitHub repository
- [ ] **[Sam]** Set Root Directory to `web`
- [ ] **[Sam]** Framework Preset: Next.js
- [ ] **[Sam]** Do NOT deploy yet (env vars needed first)

## Blueprint Guidance

### Step 3.1: Create Vercel project and connect repository

```
Manual step (Sam in Vercel dashboard):

1. Go to vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import the samkirk-v3 GitHub repository
4. Set the Root Directory to "web" (since Next.js lives in web/)
5. Framework Preset: Next.js (should be auto-detected)
6. Do NOT deploy yet — we need env vars first
7. Note the project URL (e.g., samkirk-v3.vercel.app)
```

## Context
- **Document set**: vercel-migration
- **Phase**: 3 — Vercel Project Setup (Dashboard + Git Integration)
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (dashboard action)

## Dependencies
Can be done in parallel with Phase 1-2 code changes. REQ-111 (env vars) and REQ-112 (SA key) depend on this.

---
*Source: docs/vercel-migration-TODO.md, Step 3.1*
