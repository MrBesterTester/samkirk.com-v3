---
id: REQ-127
title: "Update /deploy-vercel with manual-override note"
status: completed
completed_at: 2026-02-18T12:00:00-08:00
route: A
created_at: 2026-02-17T11:00:00-08:00
user_request: UR-034
related: [REQ-125, REQ-126]
batch: "cicd-slash-commands"
model_hint: "Sonnet 4"
---

# Update /deploy-vercel with manual-override note

## What
Add a manual-override note at the top of `.claude/commands/deploy-vercel.md` explaining that this command bypasses the normal CI/CD pipeline and that `/ship` is the preferred standard workflow.

## Checklist
- [ ] **[Sonnet 4] [AI]** Add manual-override note to the top of `.claude/commands/deploy-vercel.md`
- [ ] **[Sonnet 4] [AI]** Verify the rest of the command logic is unchanged

## Change Specification

**File:** `.claude/commands/deploy-vercel.md` (existing)

**Add at the very top, before the existing content:**

```
> **Manual override** — this bypasses the normal CI/CD pipeline (GitHub Actions + Vercel auto-deploy). Prefer `/ship` for the standard commit → push → CI → deploy workflow. Use `/deploy-vercel` for hotfixes or when the GitHub integration isn't deploying.
```

**No other changes** to the command's existing steps or logic.

## Context
- The current `/deploy-vercel` command deploys via the Vercel MCP `deploy_to_vercel` tool directly
- With CI/CD in place, the normal flow is: push → GitHub Actions CI → Vercel auto-deploy
- `/deploy-vercel` becomes the manual override for when that pipeline needs to be bypassed

## Dependencies
None — can be implemented immediately.

## Implementation Summary

Added manual-override note to top of `.claude/commands/deploy-vercel.md` pointing users to `/ship` for the standard workflow. No other changes to the command's existing logic.

*Completed manually during conversation — not via do-work run*

---
*Source: UR-034 — CI/CD slash commands*
