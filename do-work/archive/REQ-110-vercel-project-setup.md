---
id: REQ-110
title: "Create Vercel project and connect repository"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-16T20:02:00-08:00
route: A
completed_at: 2026-02-16T20:07:00-08:00
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
- [x] **[Sam]** Create new project in Vercel dashboard
- [x] **[Sam]** Import samkirk-v3 GitHub repository
- [x] **[Sam]** Set Root Directory to `web`
- [x] **[Sam]** Framework Preset: Next.js
- [x] **[Sam]** Do NOT deploy yet (env vars needed first)

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

---

## Triage

**Route: A** - Simple

**Reasoning:** Manual dashboard task — Sam creates the Vercel project in the browser.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Manual Vercel dashboard setup with clear step-by-step instructions.

*Skipped by work action*

## Implementation Summary

- Sam created Vercel project in dashboard
- Imported samkirk-v3 GitHub repository
- Set root directory to `web`, framework preset Next.js
- Deployment deferred until env vars configured

*Completed by work action (Route A) — manual step by Sam*

## Testing

**Tests run:** N/A
**Result:** Manual dashboard action — no automated tests applicable.

*Verified by work action*
