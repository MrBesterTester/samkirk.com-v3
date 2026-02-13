---
id: UR-006
title: Fix radio button click in E2E tests
created_at: 2026-02-13T12:50:00Z
requests: [REQ-042]
word_count: 52
---

# Fix radio button click in E2E tests

## Full Verbatim Input

fix the radio button click in fit-tool.spec.ts URL-mode test — the sr-only input is blocked by a styled span overlay. Use label click or force:true. Same issue exists in the paste-mode and file-upload tests but only triggers when the LLM generates radio-button follow-up questions. See line 243 and the equivalent spots in the other full-flow tests.

---
*Captured: 2026-02-13T12:50:00Z*
