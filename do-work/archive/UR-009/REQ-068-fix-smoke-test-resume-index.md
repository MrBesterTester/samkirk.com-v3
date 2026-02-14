---
id: REQ-068
title: Fix smoke test clobbering resumeIndex/current doc
status: completed
created_at: 2026-02-14T09:40:00Z
user_request: UR-009
claimed_at: 2026-02-14T13:30:00Z
route: A
completed_at: 2026-02-14T13:30:00Z
---

# Fix smoke test clobbering resumeIndex/current doc

## What
The `npm run smoke:gcp` test deletes the `resumeIndex/current` Firestore doc during the resume chunking test section but does not restore it afterward. This leaves the production resume data inaccessible, causing the interview chat to show "No resume data available."

## Context
- `getCurrentChunks()` in `src/lib/resume-chunker.ts:545` reads `resumeIndex/current` first — if it doesn't exist, returns empty array
- The smoke test log shows "Test resume index deleted" but no corresponding restore
- Smoke test scripts are under `web/scripts/`
- The resume upload test (Section 4) correctly restores original state, but the chunking test (Section 5) deletes the test resume index without restoring the original
- Fix: save the original `resumeIndex/current` doc before the chunking test, then restore it after cleanup

---
*Source: Fix the problem with the smoke test clobbering the resumeIndex/current doc.*

---

## Triage

**Route: A** - Simple

**Reasoning:** Already resolved by REQ-078 which fixed the same save/restore issue across all smoke test sections.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Already implemented as part of REQ-078.

*Skipped by work action*

## Implementation Summary

Superseded by REQ-078 (commit `5bca485`), which fixed save/restore of `resumeIndex/current` in smoke-gcp.ts sections 5, 11, and 12.

*Completed by work action (Route A)*

## Testing

**Tests run:** Covered by REQ-078 testing
**Result:** All passing

*Verified by work action*
