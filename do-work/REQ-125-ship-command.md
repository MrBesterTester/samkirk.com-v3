---
id: REQ-125
title: "Create /ship slash command"
status: pending
created_at: 2026-02-17T11:00:00-08:00
user_request: UR-034
related: [REQ-126, REQ-127]
batch: "cicd-slash-commands"
model_hint: "Sonnet 4"
---

# Create /ship slash command

## What
Create `.claude/commands/ship.md` — the "big red button" that commits, pushes, monitors CI, monitors Vercel deployment, health-checks, and opens the site in Chrome.

## Checklist
- [ ] **[Sonnet 4] [AI]** Create `.claude/commands/ship.md` with the full workflow below
- [ ] **[Sonnet 4] [AI]** Verify the command file is valid markdown with clear step-by-step instructions

## Command Specification

**File:** `.claude/commands/ship.md`

**Steps (in order):**

1. **Check working tree** — Run `git status`. If there are uncommitted changes, stage them and ask the user for a commit message, then commit. If clean, skip to step 2.

2. **Push** — Push to the current branch (e.g., `git push origin HEAD`). If on `main`, push to `main`.

3. **Monitor GitHub Actions CI** — Use `gh run list --limit 1 --json status,conclusion,url` to find the latest run. If in progress, tail it with `gh run watch`. Set a 10-minute timeout.

4. **If CI fails** — Show failed logs via `gh run view <run-id> --log-failed`. Print the failure summary and stop. Do NOT proceed to Vercel deployment.

5. **If CI passes** — Poll Vercel deployment via `mcp__vercel__list_deployments` (project: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx`, team: `team_lAFd8eLgRO9IuivB7YwxiO3m`) until the latest deployment status is `READY`. Poll every 15 seconds, timeout after 10 minutes.

6. **If Vercel build fails** — Fetch build logs via `mcp__vercel__get_deployment_build_logs` and display them. Stop.

7. **Health check** — Fetch `/api/health` via `mcp__vercel__web_fetch_vercel_url` on the deployment URL. Confirm it returns `{"status":"ok",...}`.

8. **Visual confirmation** — Open the deployed URL in a new Chrome tab using the Claude in Chrome extension so the user can see the live site.

9. **Final report** — Print: commit SHA, branch, CI status (pass/fail + URL), Vercel deployment URL, health check result (ok/fail).

## Context
- **GitHub Actions CI**: 2 jobs — `build-and-test` (type check, lint, build) and `security-scan` (gitleaks, npm audit, CodeQL)
- **Vercel project**: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx` / `team_lAFd8eLgRO9IuivB7YwxiO3m`
- **Existing reference**: See `.claude/commands/deploy-vercel.md` for MCP deploy patterns

## Dependencies
None — can be implemented immediately.

---
*Source: UR-034 — CI/CD slash commands*
