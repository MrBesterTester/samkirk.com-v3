---
allowed-tools: Bash(gh run:*), Bash(git log:*), mcp__vercel__list_deployments, mcp__vercel__get_deployment_build_logs, mcp__vercel__web_fetch_vercel_url, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate
description: Monitor CI and Vercel deployment status (no commit/push)
---

## Your task

Monitor-only — check the latest CI run and Vercel deployment status without committing or pushing anything.

### Step 1: Check latest CI run

Use `gh run list --limit 1 --json status,conclusion,url,headSha,createdAt` to get the most recent GitHub Actions run. Report its status.

### Step 2: If CI is in progress

Tail it with `gh run watch` so the user can see progress. Set a 10-minute timeout.

### Step 3: If CI failed

Show failed logs via `gh run view <run-id> --log-failed`. Report the failure.

### Step 4: Check latest Vercel deployment

Use `mcp__vercel__list_deployments` (project: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx`, team: `team_lAFd8eLgRO9IuivB7YwxiO3m`) to get the latest deployment and its status.

### Step 5: If Vercel deployment is building

Poll every 15 seconds until `READY` or failed. Timeout after 10 minutes.

### Step 6: If Vercel build failed

Fetch build logs via `mcp__vercel__get_deployment_build_logs` and display them.

### Step 7: If both green

Health-check via `mcp__vercel__web_fetch_vercel_url` on the deployment URL's `/api/health`. Open the deployment URL in Chrome for visual confirmation.

### Step 8: Status report

Print:
- Latest commit SHA
- CI status + URL
- Vercel deployment status + URL
- Health check result (if applicable)
