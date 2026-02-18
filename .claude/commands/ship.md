---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*), Bash(git push:*), Bash(gitleaks:*), Bash(npm run test:results:*), Bash(gh run:*), mcp__vercel__list_deployments, mcp__vercel__get_deployment_build_logs, mcp__vercel__web_fetch_vercel_url, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate
description: Commit, scan, push, and monitor CI + Vercel auto-deploy
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

### Step 5: Monitor GitHub Actions CI

Use `gh run list --limit 1 --json status,conclusion,url` to find the latest run. If in progress, tail it with `gh run watch`. Set a 10-minute timeout.

**If CI fails:** Show failed logs via `gh run view <run-id> --log-failed`. Print the failure summary and **stop**. Do NOT proceed.

### Step 6: Monitor Vercel auto-deploy

CI passing triggers Vercel auto-deploy. Poll via `mcp__vercel__list_deployments` (project: `prj_w6WtTr0Ae61aE2cW0GTEHaffs3kx`, team: `team_lAFd8eLgRO9IuivB7YwxiO3m`) until the latest deployment status is `READY`. Poll every 15 seconds, timeout after 10 minutes.

**If Vercel build fails:** Fetch build logs via `mcp__vercel__get_deployment_build_logs` and display them. **Stop.**

### Step 7: Health check

Fetch `/api/health` via `mcp__vercel__web_fetch_vercel_url` on the deployment URL. Confirm it returns `{"status":"ok",...}`.

### Step 8: Visual confirmation

Open the deployed URL in a new Chrome tab using the Claude in Chrome extension so the user can see the live site.

### Step 9: Final report

Print:
- Commit SHA
- Branch
- CI status (pass/fail + URL)
- Vercel deployment URL
- Health check result (ok/fail)
