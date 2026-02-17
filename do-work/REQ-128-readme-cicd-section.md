---
id: REQ-128
title: "Rewrite Deploying to Vercel README section"
status: pending
created_at: 2026-02-17T11:00:00-08:00
user_request: UR-034
related: [REQ-125, REQ-126, REQ-127]
batch: "cicd-slash-commands"
model_hint: "Sonnet 4"
---

# Rewrite "Deploying to Vercel" README section

## What
Replace the current "Deploying to Vercel" section in `README_dev_guide.md` with a comprehensive CI/CD pipeline section. Also add `/ship` and `/watch-deploy` to the Utilities slash commands table.

## Checklist
- [ ] **[Sonnet 4] [AI]** Rewrite the "Deploying to Vercel" section with all subsections below
- [ ] **[Sonnet 4] [AI]** Add `/ship` and `/watch-deploy` to the Utilities table in "Cheat Sheet — Slash Commands"
- [ ] **[Sonnet 4] [AI]** Update the Table of Contents if needed (new subsection anchors)
- [ ] **[Sonnet 4] [AI]** Verify all internal links work and formatting is consistent

## Section Structure

The rewritten "Deploying to Vercel" section should contain these subsections:

### 1. CI/CD Pipeline (with ASCII diagram)

```
      push to GitHub
           │
   ┌───────┴───────┐
   │               │
 GitHub Actions  Vercel Build
 (CI quality     (preview or
  gate)           production)
   │               │
   └───────┬───────┘
           │
    Both must pass
           │
     Live deployment
```

Explain the dual pipeline: GitHub Actions for quality gates, Vercel for building and hosting.

### 2. Automatic Flow (preferred)

- Push to `main` → CI runs + Vercel production deploy
- Push to a PR branch → CI runs + Vercel preview deploy
- Vercel posts preview URL as a PR comment

### 3. Slash Commands (table)

| Command | What it does |
|---------|-------------|
| `/ship` | Commit + push + monitor CI + monitor Vercel + health check + open in Chrome |
| `/watch-deploy` | Monitor latest CI + Vercel status (read-only, no commit/push) |
| `/deploy-vercel` | Manual override — deploy via MCP (bypasses CI/CD pipeline) |
| `/login-vercel` | Authenticate CLI + MCP |

### 4. GitHub Actions CI Checks

List what the CI workflow checks (from `.github/workflows/ci.yml`):
- `build-and-test` job: TypeScript type check (`tsc --noEmit`), ESLint, Next.js build
- `security-scan` job: Gitleaks secret scan, npm audit, CodeQL analysis

### 5. Vercel Migration Status

Reference the Vercel migration REQ workflow (REQ-103 through REQ-119). Link to `docs/vercel-migration-TODO.md`. Show current phase completion status (Phases 1-3 complete, Phases 4-7 pending). This gives readers context on where the migration stands.

### 6. Prerequisites (table)

Keep the existing prerequisites table (Vercel CLI, project linked, MCP).

### 7. Authentication

Keep the existing `/login-vercel` reference.

### 8. Manual Override

Explain when to use `/deploy-vercel` directly (hotfixes, GitHub integration issues).

### 9. Vercel MCP Capabilities

Keep the existing MCP capabilities table.

### 10. Monitoring & Troubleshooting

- `gh run list` / `gh run watch` — CI status
- Vercel MCP tools for deployment status, build logs, runtime logs
- Common failure patterns and fixes

### Also update: Utilities slash commands table

In the "Cheat Sheet — Slash Commands" → "Utilities" section, add:

| `/ship` | Commit + push + monitor CI + Vercel deploy + health check |
| `/watch-deploy` | Monitor latest CI run + Vercel deployment status |

## Context
- **Current section**: Lines ~241-324 of README_dev_guide.md
- **Slash commands to reference**: `/ship` (REQ-125), `/watch-deploy` (REQ-126), `/deploy-vercel` (REQ-127)
- **CI config**: `.github/workflows/ci.yml` — 2 jobs: `build-and-test`, `security-scan`

## Dependencies
Depends on REQ-125, REQ-126, and REQ-127 being complete (all three commands must exist before documenting them).

---
*Source: UR-034 — CI/CD slash commands*
