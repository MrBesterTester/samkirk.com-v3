---
id: REQ-069
title: Remove citations and references from ALL zip downloads
status: completed
created_at: 2026-02-14T09:45:00Z
user_request: UR-010
claimed_at: 2026-02-14T17:30:00Z
route: B
completed_at: 2026-02-14T18:00:00Z
---

# Remove citations and references from ALL zip downloads

## What
Citations and references should not appear in any downloaded artifacts — not in the resume, fit report, interview transcript, or as a separate `citations/` folder in the zip. Citations are for internal backend tracking only.

## Context
- The resume HTML (`resume.html`) had citations appended — fixed in v1 by removing `appendCitationsToMarkdown()`
- The fit report had the same issue — also fixed in v1
- However, v1 was incomplete: the `citations/` folder was still bundled into every zip download, and interview transcripts still included a "Sources Referenced" section

---
*Source: It's obvious that the citations are cluttering up the resume itself and should be moved to a separate file in the zip package that's downloaded. [Updated: ALL downloads, not just resume]*

---

## Triage

**Route: B** - Medium

## Implementation Summary

### v1 (original fix)
- Removed `appendCitationsToMarkdown()` call from `resume-generator.ts`
- Removed `appendCitationsToMarkdown()` call from `fit-report.ts`
- Added `citations/citations.html` to zip bundle (was a step in the wrong direction)

### v2 (corrected — remove citations from ALL downloads)

Three changes to eliminate citations from all download artifacts:

1. **`web/src/app/api/submissions/[id]/download/route.ts`**: Changed `includeCitations: true` → `includeCitations: false` — the `citations/` folder (json, md, html) is no longer bundled into any zip download (fit, resume, or interview)

2. **`web/src/lib/interview-chat.ts`**: Removed the "Sources Referenced" citations section from `generateTranscript()`. Removed the `citations` parameter from both `generateTranscript()` and `saveTranscript()` since it's no longer used. Updated all 3 callers of `saveTranscript()`.

3. **`web/src/lib/interview-chat.test.ts`**: Updated all `generateTranscript()` calls to remove the `citations` parameter. Replaced 2 tests that asserted citations presence with 1 test asserting citations absence.

*Completed by work action (Route B)*

## Testing

**Unit tests:** `vitest run interview-chat.test.ts artifact-bundler.test.ts` — ✓ 96 tests passing
**TypeScript compilation:** `npx tsc --noEmit` — ✓ clean (pre-existing errors in unrelated test files only)

*Verified by work action*
