---
id: REQ-041
title: E2E tests for download actions
status: pending
created_at: 2026-02-12T20:00:00Z
user_request: UR-005
related: [REQ-039, REQ-040]
batch: e2e-modality-gaps
---

# E2E Tests for Download Actions

## What
Add Playwright E2E tests that click download buttons and verify the downloaded file content for all three hire-me tools. Currently: fit report has no download test at all, resume download button is only checked for visibility, and interview transcript download clicks the button but never verifies the file content.

## Detailed Requirements
- Gaps 3, 4, and 5 from docs/hire-me-tests.md "Input/Output Modality Coverage" section
- **Fit report download** (Gap 3): after completing a fit analysis, click the download button, verify a file is downloaded, and check it contains expected content (score, recommendation, categories)
- **Resume download** (Gap 4): after generating a resume, click the download button (currently only checked for visibility), verify a file is downloaded, and check it contains expected content (header, summary, skills, experience)
- **Interview transcript download** (Gap 5): after a conversation, click the download transcript button (already tested), AND verify the downloaded file content matches expectations (role labels, message content, formatting)
- Use Playwright's download handling (`page.waitForEvent('download')` or equivalent) to capture and inspect downloaded files
- Verify file format (HTML, markdown, or PDF — whichever the tools produce) and key content markers

## Context
- Existing E2E tests: web/e2e/fit-tool.spec.ts, web/e2e/resume-tool.spec.ts, web/e2e/interview-tool.spec.ts
- Unit coverage: TEST-021 (markdown renderer, 56 tests), TEST-023 (artifact bundler, 30 tests), TEST-014 (resume generation, 62 tests)
- TEST-632 already clicks the transcript download button and saves a fixture, but doesn't verify the file content/format

---
*Source: fix the Gaps as given in the section "Input/Output Modality Coverage" in docs/hire-me-tests.md — Gaps #3, #4, #5*
