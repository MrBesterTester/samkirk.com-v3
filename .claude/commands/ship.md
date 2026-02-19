---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*), Bash(git push:*), Bash(gitleaks:*), Bash(npm run test:results:*), Bash(gh run:*), mcp__vercel__list_deployments, mcp__vercel__get_deployment_build_logs, mcp__vercel__web_fetch_vercel_url, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate
description: Commit, scan, push, and monitor CI + deploy pipeline
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

## Your task

This is the production ship pipeline. Follow every step in order.

### Step 1: Pre-flight — confirm tests passed

Ask the user: **Have you run `npm run test:all` and confirmed all tests pass?**

Check for recent test results with `npm run test:results -- --json` if available. If the user has not run tests, stop and recommend they run `npm run test:all` first. Do not proceed without confirmation.

### Step 2: Commit

If there are uncommitted changes, stage relevant files and create a commit with a clear message. Exclude `.env`, credentials, and other secrets. Ask the user for a commit message if the changes aren't self-evident. If the working tree is clean, skip to Step 3.

### Step 3: Gitleaks scan

Run `gitleaks detect --source .` to scan for secrets. If gitleaks finds any issues, **stop immediately** — do not push. Report the findings to the user.

### Step 4: Push

Push to main: `git push origin main`.

### Step 5: Monitor CI + deploy pipeline

The GitHub Actions CI workflow has three jobs: `build-and-test`, `security-scan` (both parallel), then `deploy` (needs both, uses `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`, health-checked via `vercel inspect`). Vercel Git auto-deploy is disabled on `main` via `ignoreCommand` in `web/vercel.json` — production deploys go exclusively through CI.

Use `gh run list --limit 1 --json status,conclusion,url,databaseId` to find the latest run. If in progress, tail it with `gh run watch` (run in background). Set a 10-minute timeout.

**If CI fails (build-and-test or security-scan):** Show failed logs via `gh run view <run-id> --log-failed`. Print the failure summary and **stop**. Do NOT proceed.

**If deploy fails:** Show failed logs via `gh run view <run-id> --log-failed`. Common issues: (1) Vercel credentials — secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` must be set in GitHub; (2) health check uses `vercel inspect` to confirm READY state (not curl, which is blocked by Deployment Protection on `.vercel.app` URLs and WAF on production domain). For additional Vercel diagnostics, fetch build logs via `mcp__vercel__get_deployment_build_logs`. **Stop.**

### Step 6: Health check

CI already verifies the deployment reached READY state via `vercel inspect`. As a secondary check, verify via `mcp__vercel__list_deployments` (project: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx`, team: `team_lAFd8eLgRO9IuivB7YwxiO3m`) to confirm the latest deployment status is `READY`.

### Step 7: Visual confirmation

Open the deployed URL in a new Chrome tab using the Claude in Chrome extension so the user can see the live site.

### Step 8: Final report

Print:
- Commit SHA
- Branch
- CI status (pass/fail + URL)
- Vercel deployment URL
- Health check result (ok/fail)
