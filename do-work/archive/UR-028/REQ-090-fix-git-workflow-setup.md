---
id: REQ-090
title: Fix workflow-setup rule missing global git commands
status: completed
created_at: 2026-02-16T12:00:00Z
user_request: UR-028
claimed_at: 2026-02-16T19:00:00Z
route: A
completed_at: 2026-02-16T19:01:00Z
---

# Fix workflow-setup rule missing global git commands

## What
Verify and fix the issue where the workflow-setup rule prohibits project-local git commands and requires global ones at `~/.cursor/commands/git-*.md`, but those global files may not exist. The commit that deleted the project-local versions didn't ensure the global versions were created, so users following CLAUDE.md line 91 ("See `~/.cursor/commands/git-*.md`") will find missing files, breaking the git workflow.

## Context
- Referenced files: `.cursor/rules/workflow-setup.mdc` lines 11-21 and `CLAUDE.md` lines 86-91
- The workflow-setup rule enforces that git commands exist globally but doesn't create them
- Need to verify the issue exists, then either create the missing global files or update the references to point to files that exist

---
*Source: "Verify this issue exists and fix it: The new workflow-setup rule prohibits project-local git commands and requires global ones to exist, but the commit deleted the project-local versions without establishing a way to create or verify the global versions exist."*

---

## Triage

**Route: A** - Simple

**Reasoning:** Verification task — check if referenced files exist. No code changes expected.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple verification of file existence. If files are missing, create them; if present, no action needed.

*Skipped by work action*

## Implementation Summary

**Issue does not exist.** Verification found that both required global git command files are present:

- `~/.cursor/commands/git-commit-local.md` — exists
- `~/.cursor/commands/git-remote-push-clean-with-squash.md` — exists

The workflow-setup rule (`.cursor/rules/workflow-setup.mdc` lines 18-21) correctly references these files and includes instructions to create them if missing. CLAUDE.md line 91 correctly points to `~/.cursor/commands/git-*.md`.

No changes were needed.

*Completed by work action (Route A)*

## Testing

**Tests run:** N/A
**Result:** Verification-only task — confirmed files exist at expected paths. No code changes made, no tests needed.

*Verified by work action*
