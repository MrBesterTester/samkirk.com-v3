---
id: REQ-091
title: Add READMEs for do-work/ tree
status: pending
created_at: 2026-02-16T19:00:00Z
user_request: UR-029
related: [REQ-092, REQ-093]
batch: missing-readmes
---

# Add READMEs for do-work/ tree

## What
Create README.md files for the four do-work folders that currently lack them:
- `do-work/` (root) — the autonomous work queue system
- `do-work/archive/` — completed and on-hold REQs
- `do-work/user-requests/` — incoming UR folders with verbatim input
- `do-work/working/` — currently processing REQs

## Context
The project has READMEs in 9 key folders (root, .claude/, docs/, web/, web/e2e/fixtures/, web/test-fixtures/ and its three sub-fixtures). The do-work system is central to the project's autonomous workflow but has no READMEs explaining the folder structure, file naming conventions, or lifecycle.

## Detailed Requirements
- Each README should explain the folder's purpose, what files live there, and how they flow through the system
- Reference the do-work skill documentation (`.claude/skills/do-work/`) for accurate descriptions
- Follow the style of existing READMEs in the project (concise, practical, not over-documented)
- The root `do-work/README.md` should explain the overall queue system and link to subfolders
- Keep READMEs short — these are orientation guides, not full documentation

## Builder Guidance
- Certainty level: Firm on which folders need READMEs; flexible on exact content
- Scope cues: Keep it simple — short, useful orientation docs

---
*Source: See UR-029/input.md for full verbatim input*
