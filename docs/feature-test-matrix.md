# Feature-Test Matrix — samkirk-v3

> Maps every feature from SPECIFICATION.md (sections 7-15) to its automated tests and/or manual verifications. Follows the format rules in master-test-SPECIFICATION.md section 5.4.

## Rules (from master-test-SPECIFICATION.md 5.4)

- Every feature row must have at least one test OR verification. Empty rows are gaps.
- A test or verification can appear in multiple feature rows (many-to-many).
- The "Coverage Notes" column explains why the listed tests are sufficient.

---

## Coverage Summary

| Feature ID | Feature Name | Test IDs | Coverage Status | Coverage Notes |
|------------|-------------|----------|-----------------|----------------|
| 7 | LLM Provider (Vertex AI / Gemini) | TEST-024, TEST-610, TEST-620, TEST-632, TEST-650, TEST-651, TEST-652, TEST-679, TEST-680, TEST-681 | Covered | Vertex AI error classes tested in unit (TEST-024). Real LLM integration tested end-to-end for all three tools (TEST-650/651/652). GCP smoke tests verify connectivity and response structure (TEST-679/680/681). E2E browser tests exercise LLM calls in-situ (TEST-610/620/632). |
| 8.1 | Fit Tool ("How Do I Fit?") | TEST-010, TEST-011, TEST-012, TEST-610, TEST-611, TEST-650, TEST-678, TEST-679 | Covered | Job ingestion pipeline (TEST-010) covers paste/URL/file inputs and validation. Fit flow state machine (TEST-011) covers multi-turn behavior, follow-ups (up to 5), location rules, seniority extraction. Fit report generation (TEST-012) covers scoring (Well/Average/Poorly), rationale, unknowns. E2E happy path (TEST-610) and error handling (TEST-611) cover browser flow. Real LLM (TEST-650) validates full pipeline with Vertex AI. GCP smoke covers URL fetch (TEST-678) and Gemini fit analysis (TEST-679). |
| 8.2 | Resume Tool ("Get a Custom Resume") | TEST-013, TEST-014, TEST-015, TEST-016, TEST-620, TEST-621, TEST-651, TEST-673, TEST-674, TEST-680 | Covered | Resume RAG context (TEST-013) covers chunk retrieval and citation generation. Resume generation (TEST-014) covers prompt construction, 2-page constraint, markdown output, factual-only validation. Resume upload validation (TEST-015) covers file types and admin upload. Chunking (TEST-016) covers markdown parsing and indexing. E2E happy path (TEST-620) and errors (TEST-621) cover browser flow. Real LLM (TEST-651) validates full pipeline. GCP smoke covers upload (TEST-673), chunking (TEST-674), and generation (TEST-680). |
| 8.3 | Interview Tool ("Interview Me Now") | TEST-017, TEST-018, TEST-630, TEST-631, TEST-632, TEST-652, TEST-681 | Covered | Interview chat module (TEST-017) covers multi-turn conversation, turn limits, transcript generation. Guardrails (TEST-018) covers 147 message samples across allowed/disallowed categories, prompt injection resistance, and redirect responses. E2E UI (TEST-630), input behavior (TEST-631), and conversation (TEST-632) cover browser flow. Real LLM (TEST-652) validates full pipeline. GCP smoke (TEST-681) verifies career-focused guardrails with real Vertex AI. |
| 8.4 | Citations (All Tools) | TEST-012, TEST-013, TEST-021, TEST-610, TEST-620, TEST-650, TEST-651, TEST-652 | Covered | Fit report (TEST-012) tests citation generation from chunk references. Resume context (TEST-013) tests citation map creation and referenced chunk citations. Markdown renderer (TEST-021) tests citation HTML/markdown rendering and append functions. E2E fit (TEST-610) and resume (TEST-620) verify citations appear in browser output. All three real LLM tests (TEST-650/651/652) validate citations in real responses. |
| 8.5 | Dance Menu | TEST-022, TEST-600, TEST-675 | Covered | Dance menu upload validation (TEST-022) covers bundle validation (md/txt/html), file types, size limits. E2E public pages (TEST-600) verifies dance menu page renders. GCP smoke (TEST-675) verifies upload pipeline to public bucket. |
| 8.6 | Static Pages | TEST-600, TEST-601, TEST-603, TEST-606 | Covered | E2E public pages (TEST-600) verifies home, tools hub, dance menu, song dedication, explorations hub. Exploration pages (TEST-601) verifies category theory, pocket flow, dance instruction, uber-level AI skills. Navigation (TEST-603) verifies links between pages. Accessibility (TEST-606) verifies heading structure and landmarks. |
| 9 | Admin Experience (Auth + Functions) | TEST-002, TEST-602 | Partial — Gap | Admin email allowlist (TEST-002) covers authentication logic (case-insensitive matching, attack resistance). E2E admin auth (TEST-602) verifies redirect-to-login for unauthenticated users. **Gap: No automated tests for admin functions (resume upload trigger, dance menu upload workflow, recent submissions dashboard). These require manual verification or additional E2E tests.** |
| 10.1 | CAPTCHA | TEST-001, TEST-004, TEST-604, TEST-672 | Covered | Session module (TEST-001) covers session cookie and ID management that gates CAPTCHA state. CAPTCHA verification helpers (TEST-004) cover reCAPTCHA request/response handling and error codes. E2E API health (TEST-604) verifies session init endpoint. GCP smoke session (TEST-672) verifies session lifecycle in Firestore. |
| 10.2 | Rate Limiting | TEST-005 | Partial — Gap | Rate limit module (TEST-005) has 50 unit tests covering constants, IP extraction, key derivation, sliding window, counter increment, and error messages. **Gap: No E2E or integration test verifies that rate limiting actually blocks requests after the 10-request threshold. No test verifies the "contact sam@samkirk.com" messaging is displayed.** |
| 10.3 | Monthly Spend Cap | TEST-006, TEST-677 | Covered | Spend cap module (TEST-006) has 60 unit tests covering cost estimation, cap logic, month boundaries, and integration flows. GCP smoke (TEST-677) verifies Firestore-backed spend tracking with real GCP. |
| 11 | Data Storage & Retention | TEST-007, TEST-008, TEST-019, TEST-020, TEST-023, TEST-025, TEST-604, TEST-650, TEST-651, TEST-652, TEST-670, TEST-671, TEST-672, TEST-673, TEST-674, TEST-675, TEST-676, TEST-677, TEST-682 | Covered | Firestore paths (TEST-007) and storage paths (TEST-008) cover path construction. Submission module (TEST-019) covers ID generation, TTL, expiration. Retention cleanup (TEST-020) covers 90-day auto-delete logic. Artifact bundler (TEST-023) covers bundle creation per tool. Public proxy (TEST-025) covers GCS file serving. GCP smoke tests verify Cloud Storage (TEST-670), Firestore (TEST-671), session (TEST-672), resume upload (TEST-673), chunking (TEST-674), dance menu (TEST-675), submission/artifact (TEST-676), spend cap (TEST-677), and retention cleanup (TEST-682). Real LLM tests (TEST-650/651/652) verify artifact storage. E2E API (TEST-604) verifies retention endpoint. |
| 12 | Job URL Handling | TEST-010, TEST-678 | Covered | Job ingestion pipeline (TEST-010) covers URL ingestion including HTML fetch, content-type handling, error cases, and real-world HTML examples. The test explicitly covers the fallback behavior when URL fetch fails. GCP smoke URL fetch (TEST-678) verifies real URL ingestion against a live web page. |
| 13 | Reliability & UX Requirements | TEST-009, TEST-605, TEST-611, TEST-621 | Partial — Gap | API error handling framework (TEST-009) has 107 unit tests covering error codes, correlation IDs, sanitization, and structured responses. E2E 404 handling (TEST-605) verifies non-existent pages/API routes. Fit error handling (TEST-611) and resume error handling (TEST-621) verify UI error states. **Gap: No test verifies the "friendly messaging + contact guidance" when rate limit or spend cap is reached at the UI level. No test verifies the "temporarily unavailable" messaging on tool pages when spend cap is exceeded.** |
| 14 | Technical Constraints | TEST-003, TEST-009, TEST-024 | Covered | Environment parsing (TEST-003) verifies strict Zod-based env validation (TypeScript strict mode). API error handling (TEST-009) enforces structured error responses. Vertex AI error classes (TEST-024) verify Gemini-specific error handling. TypeScript strict mode is enforced by the build system and all 1,149 unit tests compile under strict mode. |
| 15 | Acceptance Criteria | TEST-600, TEST-601, TEST-602, TEST-603, TEST-606, TEST-610, TEST-611, TEST-620, TEST-621, TEST-630, TEST-631, TEST-632, TEST-650, TEST-651, TEST-652 | Covered | This is a cross-cutting section that summarizes acceptance for all features. Coverage is provided by the E2E suite: public pages (TEST-600/601/603/606), admin auth (TEST-602), fit tool (TEST-610/611), resume tool (TEST-620/621), interview tool (TEST-630/631/632), and all three real LLM tests (TEST-650/651/652) which validate the full pipeline. Individual acceptance items trace back to their respective feature rows above. |

---

## Deployment Coverage Note

**Section 6 (Deployment & Hosting)** is referenced in the test catalog Feature Coverage Reference as "Verifications only." No automated tests exist for deployment-specific concerns (canonical domain, www redirect, Cloud Run serving, DNS). These are inherently manual/infrastructure verifications. A future `docs/verification-registry.md` should contain entries such as:
- VER-001: Verify `samkirk.com` serves the application
- VER-002: Verify `www.samkirk.com` redirects to `samkirk.com`
- VER-003: Verify Cloud Run deployment is healthy

This is not tracked as a gap in the matrix because deployment verification is outside the scope of automated testing, per the traceability model (section 5.2 of master-test-SPECIFICATION.md).

---

## Test-to-Feature Reverse Index

Every test from the test catalog (55 entries) must appear in at least one feature row above. The following reverse index confirms complete coverage:

| Test ID | Headline | Feature Rows |
|---------|----------|-------------|
| TEST-001 | Session module | 10.1 |
| TEST-002 | Admin email allowlist | 9 |
| TEST-003 | Environment parsing | 14 |
| TEST-004 | CAPTCHA verification helpers | 10.1 |
| TEST-005 | Rate limit module | 10.2 |
| TEST-006 | Monthly spend cap module | 10.3 |
| TEST-007 | Firestore path helpers | 11 |
| TEST-008 | Storage path helpers | 11 |
| TEST-009 | API error handling framework | 13, 14 |
| TEST-010 | Job ingestion pipeline | 8.1, 12 |
| TEST-011 | Fit tool flow state machine | 8.1 |
| TEST-012 | Fit report generation | 8.1, 8.4 |
| TEST-013 | Resume RAG context assembly | 8.2, 8.4 |
| TEST-014 | Resume generation logic | 8.2 |
| TEST-015 | Resume upload validation | 8.2 |
| TEST-016 | Resume markdown chunking | 8.2 |
| TEST-017 | Interview chat module | 8.3 |
| TEST-018 | Interview guardrails classification | 8.3 |
| TEST-019 | Submission management | 11 |
| TEST-020 | Retention cleanup module | 11 |
| TEST-021 | Markdown renderer | 8.4 |
| TEST-022 | Dance menu upload validation | 8.5 |
| TEST-023 | Artifact bundler | 11 |
| TEST-024 | Vertex AI error classes | 7, 14 |
| TEST-025 | Public proxy API route | 11 |
| TEST-600 | Full app — Public pages | 8.5, 8.6, 15 |
| TEST-601 | Full app — Exploration pages | 8.6, 15 |
| TEST-602 | Full app — Admin auth required | 9, 15 |
| TEST-603 | Full app — Navigation | 8.6, 15 |
| TEST-604 | Full app — API health | 10.1, 11 |
| TEST-605 | Full app — Error handling | 13 |
| TEST-606 | Full app — Accessibility | 8.6, 15 |
| TEST-610 | Fit tool — Happy path | 7, 8.1, 8.4, 15 |
| TEST-611 | Fit tool — Error handling | 8.1, 13, 15 |
| TEST-620 | Resume tool — Happy path | 7, 8.2, 8.4, 15 |
| TEST-621 | Resume tool — Error handling | 8.2, 13, 15 |
| TEST-630 | Interview tool — UI | 8.3, 15 |
| TEST-631 | Interview tool — Input behavior | 8.3, 15 |
| TEST-632 | Interview tool — Conversation | 7, 8.3, 15 |
| TEST-650 | Real LLM — Fit tool | 7, 8.1, 8.4, 11, 15 |
| TEST-651 | Real LLM — Resume tool | 7, 8.2, 8.4, 11, 15 |
| TEST-652 | Real LLM — Interview tool | 7, 8.3, 8.4, 11, 15 |
| TEST-670 | Smoke — Cloud Storage | 11 |
| TEST-671 | Smoke — Firestore | 11 |
| TEST-672 | Smoke — Session | 10.1, 11 |
| TEST-673 | Smoke — Resume Upload | 8.2, 11 |
| TEST-674 | Smoke — Resume Chunking | 8.2, 11 |
| TEST-675 | Smoke — Dance Menu Upload | 8.5, 11 |
| TEST-676 | Smoke — Submission & Artifact Bundle | 11 |
| TEST-677 | Smoke — Spend Cap | 10.3, 11 |
| TEST-678 | Smoke — Job Ingestion URL Fetch | 8.1, 12 |
| TEST-679 | Smoke — Vertex AI Gemini | 7, 8.1 |
| TEST-680 | Smoke — Resume Generation | 7, 8.2 |
| TEST-681 | Smoke — Interview Chat | 7, 8.3 |
| TEST-682 | Smoke — Retention Cleanup | 11 |

**All 55 test catalog entries appear in at least one feature row.** No orphaned tests.

---

## Coverage Gap Analysis

### Identified Gaps

| Gap ID | Feature | Gap Description | Severity | Recommended Action |
|--------|---------|----------------|----------|-------------------|
| GAP-001 | 9 (Admin Experience) | No automated tests for admin functions: resume upload trigger (immediate RAG re-index), dance menu upload workflow, or recent submissions dashboard. Only auth gating is tested. | Medium | Add E2E tests for admin upload flows (requires authenticated session setup). Alternatively, add to verification registry as manual verification procedures. |
| GAP-002 | 10.2 (Rate Limiting) | No integration or E2E test verifies that requests are actually blocked after 10 requests/10 minutes. Unit tests cover the module logic but not the middleware/API integration. No test verifies the "contact sam@samkirk.com" UI message. | Medium | Add an E2E or integration test that sends 11 rapid requests and verifies the 11th is blocked with the correct message. |
| GAP-003 | 13 (Reliability & UX) | No test verifies the "temporarily unavailable" messaging when the spend cap is exceeded, or the "friendly messaging + contact guidance" when rate limited. UI-level degradation is untested. | Low | Add E2E tests that mock a rate-limited or spend-cap-exceeded state and verify the user-facing messaging. |
| GAP-004 | 6 (Deployment) | No automated tests for deployment concerns (domain serving, www redirect, Cloud Run health). | Low | Not a gap in the automated test matrix per se; these are infrastructure verifications. Create `docs/verification-registry.md` with manual verification procedures (VER-001 through VER-003). |
| GAP-005 | 10.1 (CAPTCHA) | No test verifies the full reCAPTCHA v2 widget interaction in a browser (clicking the checkbox, verifying the token flow). Unit tests cover the server-side verification logic only. | Low | reCAPTCHA v2 widget testing is inherently difficult to automate (Google's anti-bot system). Document as a manual verification in the verification registry. |

### Coverage Statistics

| Metric | Value |
|--------|-------|
| Total features (sections 7-15) | 16 |
| Features with full automated coverage | 13 |
| Features with partial coverage (gaps noted) | 3 (sections 9, 10.2, 13) |
| Features requiring manual verification only | 1 (section 6, deployment) |
| Total test catalog entries | 55 |
| Test entries mapped to features | 55 (100%) |
| Total identified gaps | 5 |
| High severity gaps | 0 |
| Medium severity gaps | 2 |
| Low severity gaps | 3 |
