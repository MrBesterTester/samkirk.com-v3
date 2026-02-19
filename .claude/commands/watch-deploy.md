---
allowed-tools: Bash(gh run:*), Bash(git log:*), mcp__vercel__list_deployments, mcp__vercel__get_deployment_build_logs, mcp__vercel__web_fetch_vercel_url, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate
description: Monitor CI + deploy pipeline status (no commit/push)
---

## Your task

Monitor-only — check the latest CI run and deployment status without committing or pushing anything. Production deployment is part of the GitHub Actions CI workflow (the `deploy` job runs after build-and-test and security-scan).

### Step 1: Check latest CI run

Use `gh run list --limit 1 --json status,conclusion,url,headSha,createdAt` to get the most recent GitHub Actions run. Report its status.

### Step 2: If CI is in progress

Tail it with `gh run watch` so the user can see progress. This covers all jobs including the deploy job. Set a 15-minute timeout.

### Step 3: If CI failed

Show failed logs via `gh run view <run-id> --log-failed`. Report whether the failure was in build-and-test, security-scan, or deploy.

### Step 4: Verify Vercel deployment

Use `mcp__vercel__list_deployments` (project: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx`, team: `team_lAFd8eLgRO9IuivB7YwxiO3m`) to confirm the latest deployment matches the expected commit and its status is `READY`. If the deployment is still building, poll every 15 seconds until `READY` or failed (timeout after 5 minutes).

### Step 5: If Vercel deployment failed

Fetch build logs via `mcp__vercel__get_deployment_build_logs` and display them.

### Step 6: If all green

Health-check via `mcp__vercel__web_fetch_vercel_url` on the deployment URL's `/api/health`. Open the deployment URL in Chrome for visual confirmation.

### Step 7: Status report

Print:
- Latest commit SHA
- CI status + URL (including deploy job result)
- Vercel deployment status + URL
- Health check result (if applicable)
