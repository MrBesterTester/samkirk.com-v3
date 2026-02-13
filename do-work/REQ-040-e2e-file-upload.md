---
id: REQ-040
title: E2E tests for file upload input mode
status: pending
created_at: 2026-02-12T20:00:00Z
user_request: UR-005
related: [REQ-039, REQ-041]
batch: e2e-modality-gaps
---

# E2E Tests for File Upload Input Mode

## What
Add Playwright E2E tests that exercise the file upload input mode end-to-end for both the fit tool and resume tool. Currently, E2E tests only verify upload mode is available in the UI but never select a file, submit it, and verify results.

## Detailed Requirements
- Gap 2 from docs/hire-me-tests.md "Input/Output Modality Coverage" section
- Fit tool (web/e2e/fit-tool.spec.ts): select a test job description file via file input, click analyze, and verify results render
- Resume tool (web/e2e/resume-tool.spec.ts): select a test job description file via file input, click generate, and verify results render
- Use Playwright's `setInputFiles` or equivalent to programmatically attach a file
- A test fixture file (e.g., a .txt or .pdf job description) should be created in the test fixtures directory if one doesn't already exist
- Unit tests already validate file metadata/content (TEST-010); this is about the browser UI flow

## Context
- Existing E2E tests: web/e2e/fit-tool.spec.ts (TEST-610, TEST-611), web/e2e/resume-tool.spec.ts (TEST-620, TEST-621)
- Unit coverage: TEST-010 covers file metadata validation (size limits, extension filtering, MIME type checks, text extraction)
- The gap is specifically that no E2E test selects a file and submits it through the full flow

---
*Source: fix the Gaps as given in the section "Input/Output Modality Coverage" in docs/hire-me-tests.md — Gap #2*
