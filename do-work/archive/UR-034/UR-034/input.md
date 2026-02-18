---
id: UR-034
title: "CI/CD slash commands and README update"
created_at: 2026-02-17T11:00:00-08:00
requests: [REQ-125, REQ-126, REQ-127, REQ-128]
word_count: 450
---

# CI/CD Slash Commands and README Update

## Summary
Create three CI/CD slash commands (`/ship`, `/watch-deploy`, update `/deploy-vercel`) and rewrite the "Deploying to Vercel" README section to document the full pipeline.

## Extracted Requests

| ID | Title | Model Hint | Owner |
|----|-------|------------|-------|
| REQ-125 | Create `/ship` slash command | Sonnet 4 | AI |
| REQ-126 | Create `/watch-deploy` slash command | Sonnet 4 | AI |
| REQ-127 | Update `/deploy-vercel` with manual-override note | Sonnet 4 | AI |
| REQ-128 | Rewrite "Deploying to Vercel" README section | Sonnet 4 | AI |

## Full Verbatim Input

Create CI/CD slash commands for the Vercel deployment pipeline:

1. `/ship` — The "big red button". Commit + push + monitor GitHub Actions CI + monitor Vercel deployment + health check + open in Chrome. This is the standard deploy workflow.

2. `/watch-deploy` — Monitor-only. Check latest CI run and Vercel deployment status without committing or pushing. Useful for checking REQ-113 status and ongoing monitoring.

3. Update `/deploy-vercel` — Add a manual-override note at the top explaining it bypasses CI/CD and that `/ship` is preferred for the standard workflow.

4. Rewrite the "Deploying to Vercel" section in README_dev_guide.md with: CI/CD pipeline diagram, automatic flow explanation, slash command table, GitHub Actions CI checks list, Vercel migration status, monitoring/troubleshooting guide. Also add `/ship` and `/watch-deploy` to the Utilities slash commands table.

*Captured: 2026-02-17T11:00:00-08:00*
