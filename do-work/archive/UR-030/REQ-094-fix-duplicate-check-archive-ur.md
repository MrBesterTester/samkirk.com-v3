---
id: REQ-094
title: Fix Step 2 duplicate check to include archive/UR-* folders
status: completed
created_at: 2026-02-16T12:00:00Z
user_request: UR-030
claimed_at: 2026-02-16T12:01:00Z
route: A
completed_at: 2026-02-16T12:02:00Z
---

# Fix Step 2 Duplicate Check to Include archive/UR-* Folders

## What
Update Step 2 ("Check for Existing Requests") in `do.md` to also check inside `do-work/archive/UR-*/` folders when scanning for duplicate/similar requests. Currently it only checks `do-work/working/` and `do-work/archive/` top-level, but all archived REQs live inside UR subfolders.

## Why
The current instruction misses every archived REQ because the work action archives them into `archive/UR-NNN/` subfolders — there are no loose REQ files at the `archive/` top level. This is inconsistent with the REQ numbering instructions (line 121) which correctly specify checking `archive/UR-*/`.

## Context
- Affected file: `.claude/skills/do-work/actions/do.md`, lines 390-391
- The fix should mirror the pattern already used at line 121: `do-work/archive/` (and inside `archive/UR-*/`)
- This is a one-line text fix in the skill documentation

---
*Source: "Step 2 instructs agents to check for duplicate requests by listing filenames in `do-work/working/` and `do-work/archive/`, but omits checking inside `archive/UR-*/` folders..."*

---

## Triage

**Route: A** - Simple

**Reasoning:** One-line text fix in a documentation file with exact location specified. No code changes.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple text fix in a markdown file at a known location. No architectural decisions needed.

*Skipped by work action*

## Implementation Summary

- Updated `.claude/skills/do-work/actions/do.md` line 391: added `(including inside `archive/UR-*/`)` to the Step 2 duplicate check instruction
- Bumped version to 0.12.5 in `actions/version.md`
- Added changelog entry in `CHANGELOG.md`

*Completed by work action (Route A)*

## Testing

**Tests run:** N/A
**Result:** Documentation-only change to skill markdown files. No testing infrastructure applies.

*Verified by work action*
