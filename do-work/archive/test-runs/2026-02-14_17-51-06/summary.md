---
timestamp: 2026-02-14T17:58:00-08:00
gcp_available: true
suites_run: [unit, e2e, gcp-smoke, e2e-real-llm]
overall: pass
trigger: REQ-089
---

# Test Run: 2026-02-14 17:58:00 PST

## Summary

| Suite | Status | Passed | Failed | Duration |
|-------|--------|--------|--------|----------|
| Unit Tests (Vitest) | PASSED | 1255 tests | 0 | 21s |
| E2E Tests (Playwright) | PASSED | 55 tests | 0 | 51.5s |
| GCP Smoke Tests | PASSED | 13 sections | 0 | ~60s |
| Real LLM E2E | PASSED | 3 tool flows | 0 | ~14s |

**Totals**: 1310 automated tests + 13 GCP integration sections + 3 real-LLM tool flows = **1326 checkpoints, 0 failures**

## Fixes Applied (REQ-089)

The page heading on `/hire-me` was changed from "Hire Me" to "Interview me NOW" and the home-page CTA from "Try Hire Me Tools" to "Interview me NOW" but tests were not updated.

| File | Change |
|------|--------|
| `web/src/app/page.test.tsx` | Updated CTA link matcher: `/try hire me tools/i` -> `/interview me now/i` |
| `web/e2e/fit-tool.spec.ts` | Updated 7 heading matchers: `"Hire Me"` -> `"Interview me NOW"` |
| `web/e2e/resume-tool.spec.ts` | Updated 5 heading matchers |
| `web/e2e/full-app.spec.ts` | Updated 1 heading matcher + comment |
| `web/e2e/download-buttons.spec.ts` | Updated 1 heading matcher |
| `web/e2e/interview-tool.spec.ts` | Updated 1 heading matcher |

## GCP Smoke Test Sections

All 13 sections passed:
1. Cloud Storage - read/write/delete
2. Firestore - read/write/delete
3. Session - create/read/TTL/cleanup
4. Resume Upload - write/read/restore
5. Resume Chunking - chunk/write/verify/restore
6. Dance Menu Upload - write/verify/list/cleanup
7. Submission & Artifact Bundle - create/verify/update/cleanup
8. Spend Cap - create/increment/cap-detect/cleanup
9. Job Ingestion URL Fetch - httpbin.org + example.com
10. Vertex AI Gemini - content generation + structured JSON + spend recording
11. Resume Generation - chunk/generate/markdown/artifacts/cleanup
12. Interview Chat - multi-turn conversation + off-topic redirection + transcript
13. Retention Cleanup - expired deletion + active preservation + idempotency

## Real LLM E2E Results

| Tool | Status | LLM Response Time | Tokens (in/out) | Cost |
|------|--------|-------------------|------------------|------|
| Fit Tool | PASSED | 3.5s | 8495/463 | $0.012 |
| Resume Tool | PASSED | 7.5s | 8992/1230 | $0.016 |
| Interview Tool | PASSED | 1.4s + 1.5s (2 turns) | 8275+8437/154+144 | ~$0.005 |

## Notes

- All four test suites ran and passed with zero failures.
- Unit test count: 1255 (up from 1232 on 2026-02-13).
- E2E test count: 55 (up from 51 on 2026-02-13), including the previously flaky resume-tool flow which passed this run.
- GCP smoke tests verified all 13 infrastructure integration points.
- Real LLM E2E verified end-to-end Vertex AI flows for all three tools.

## Cross-references

- REQ: do-work/REQ-089-run-fix-tests.md
- Commit: `Fix tests to match renamed Hire Me page heading`
- Raw logs: unit-tests.log, e2e-tests.log (gitignored, local only)
