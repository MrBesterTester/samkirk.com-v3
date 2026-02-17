---
id: REQ-126
title: "Create /watch-deploy slash command"
status: pending
created_at: 2026-02-17T11:00:00-08:00
user_request: UR-034
related: [REQ-125, REQ-127]
batch: "cicd-slash-commands"
model_hint: "Sonnet 4"
---

# Create /watch-deploy slash command

## What
Create `.claude/commands/watch-deploy.md` — a monitor-only command that checks the latest CI run and Vercel deployment status without committing or pushing anything.

## Checklist
- [ ] **[Sonnet 4] [AI]** Create `.claude/commands/watch-deploy.md` with the full workflow below
- [ ] **[Sonnet 4] [AI]** Verify the command file is valid markdown with clear step-by-step instructions

## Command Specification

**File:** `.claude/commands/watch-deploy.md`

**Steps (in order):**

1. **Check latest CI run** — Use `gh run list --limit 1 --json status,conclusion,url,headSha,createdAt` to get the most recent GitHub Actions run. Report its status.

2. **If CI is in progress** — Tail it with `gh run watch` so the user can see progress. Set a 10-minute timeout.

3. **If CI failed** — Show failed logs via `gh run view <run-id> --log-failed`. Report the failure.

4. **Check latest Vercel deployment** — Use `mcp__vercel__list_deployments` (project: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx`, team: `team_lAFd8eLgRO9IuivB7YwxiO3m`) to get the latest deployment and its status.

5. **If Vercel deployment is building** — Poll every 15 seconds until `READY` or failed. Timeout after 10 minutes.

6. **If Vercel build failed** — Fetch build logs via `mcp__vercel__get_deployment_build_logs` and display them.

7. **If both green** — Health-check via `mcp__vercel__web_fetch_vercel_url` on the deployment URL's `/api/health`. Open the deployment URL in Chrome for visual confirmation.

8. **Status report** — Print: latest commit SHA, CI status + URL, Vercel deployment status + URL, health check result (if applicable).

## Context
- **Use case**: Checking on REQ-113 (first deploy) status, monitoring ongoing deployments, verifying after someone else pushes
- **Vercel project**: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx` / `team_lAFd8eLgRO9IuivB7YwxiO3m`
- **No side effects**: This command does not commit, push, or deploy anything

## Dependencies
None — can be implemented immediately.

---
*Source: UR-034 — CI/CD slash commands*
