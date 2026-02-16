---
id: REQ-093
title: Add READMEs for standalone folders
status: pending
created_at: 2026-02-16T19:00:00Z
user_request: UR-029
related: [REQ-091, REQ-092]
batch: missing-readmes
---

# Add READMEs for standalone folders

## What
Create README.md files for five standalone folders that currently lack them:
- `.cursor/` — Cursor IDE commands and rules
- `REFERENCES/` — methodology study guides (Dylan Davis, Matt Maher)
- `web/data/` — resume data files
- `web/e2e/` — Playwright E2E tests (note: `web/e2e/fixtures/` already has a README)
- `web/scripts/` — build and test scripts

## Context
These folders serve distinct purposes and aren't part of a larger tree. REFERENCES/ contains the two HTML study guides that are central to the project methodology. .cursor/ has IDE-specific commands/rules. web/scripts/ has build tooling.

## Detailed Requirements
- Each README should explain the folder's purpose and list key contents
- `.cursor/` should explain the commands and rules structure, and note the `.claude/CURSOR-COMPATIBILITY.md` mapping
- `REFERENCES/` should briefly describe each study guide and its methodology
- `web/data/` should explain what resume data lives here and how it's used
- `web/e2e/` should explain the E2E test setup and how to run tests (don't duplicate the fixtures README)
- `web/scripts/` should list the available scripts and their purposes
- Follow existing README style — concise and practical

## Builder Guidance
- Certainty level: Firm on which folders; flexible on content
- Scope cues: Keep them brief — orientation-level docs

---
*Source: See UR-029/input.md for full verbatim input*
