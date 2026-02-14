---
id: UR-009
title: Fix smoke test clobbering resumeIndex/current doc
created_at: 2026-02-14T09:40:00Z
requests: [REQ-068]
word_count: 67
---

# Fix smoke test clobbering resumeIndex/current doc

## Full Verbatim Input

Fix the problem with the smoke test clobbering the resumeIndex/current doc. The smoke:gcp test (npm run smoke:gcp) deletes the resumeIndex/current Firestore doc but doesn't restore it after the test runs. This causes getCurrentChunks() in src/lib/resume-chunker.ts to return empty, which makes the interview chat show "No resume data available." Root cause is in the smoke test scripts under web/scripts/ - the resume chunking test section creates a test resumeIndex, then says "Test resume index deleted" but never restores the original resumeIndex/current document. The fix should ensure the original resumeIndex/current doc is saved before the test and restored after.

---
*Captured: 2026-02-14T09:40:00Z*
