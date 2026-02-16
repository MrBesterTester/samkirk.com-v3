---
id: UR-028
title: Fix workflow-setup rule missing global git commands
created_at: 2026-02-16T12:00:00Z
requests: [REQ-090]
word_count: 68
---

# Fix workflow-setup rule missing global git commands

## Full Verbatim Input

Verify this issue exists and fix it:

The new workflow-setup rule prohibits project-local git commands and requires global ones to exist, but the commit deleted the project-local versions without establishing a way to create or verify the global versions exist. Users following `CLAUDE.md` line 91 to "See `~/.cursor/commands/git-*.md`" will find missing files if the global versions weren't pre-created, breaking the git workflow. @.cursor/rules/workflow-setup.mdc:11-21 @CLAUDE.md:86-91

---
*Captured: 2026-02-16T12:00:00Z*
