# Verification Registry — samkirk-v3

> Authoritative registry of manual verification procedures. Each entry represents a human-performed check that cannot be fully automated. These verifications are printed as a checklist by the master test runner (`--release` flag) after all automated suites complete.

Metadata format follows `master-test-SPECIFICATION.md` section 5.3 (verification variant).

---

## Summary

| ID | Headline | Features | GCP Required |
|----|----------|----------|--------------|
| VER-001 | Visual inspect resume PDF layout | 8.2 (Resume Tool) | No |
| VER-002 | OAuth flow in fresh browser session | 9 (Admin Experience) | No |
| VER-003 | Cloud Run deployment serves traffic | 6 (Deployment & Hosting) | Yes |

---

## VER-001: Visual inspect resume PDF layout

| Field | Value |
|-------|-------|
| **ID** | VER-001 |
| **Headline** | Visual inspect resume PDF layout |
| **Description** | Verify that the Resume Tool produces a well-formatted, 2-page resume when printed or exported to PDF. Automated tests validate markdown output and citation presence, but visual layout concerns (page breaks, overflow, font rendering, whitespace) require human inspection. |
| **Type** | Verification (manual) |
| **Features covered** | 8.2 (Resume Tool — "Get a Custom Resume") |
| **Procedure** | 1. Start a local dev server (`npm run dev`) or use a live instance.<br>2. Navigate to the Resume Tool page.<br>3. Submit a real job posting URL (or paste job description text).<br>4. Wait for the tool to generate a tailored resume.<br>5. View the rendered HTML output in the browser.<br>6. Use the browser's Print dialog (Cmd+P / Ctrl+P) to preview as PDF.<br>7. Verify the resume fits within 2 pages.<br>8. Check that section headings, bullet points, and citations render correctly.<br>9. Confirm no text overflow, clipping, or orphaned sections across page breaks. |
| **Inputs** | Running instance (local dev server or deployed), a job posting URL or pasted job description |
| **Expected outputs** | Resume renders cleanly in browser. PDF export fits within 2 pages. Proper formatting with section headings, bullet lists, and citations visible. No overflow, clipping, or layout artifacts at page boundaries. |
| **GCP required** | No (can use local dev server; LLM calls go to Vertex AI but do not require GCP infrastructure verification) |

---

## VER-002: OAuth flow in fresh browser session

| Field | Value |
|-------|-------|
| **ID** | VER-002 |
| **Headline** | OAuth flow in fresh browser session |
| **Description** | Verify that Google OAuth login works end-to-end for the admin experience, restricted to the authorized identity (sam@samkirk.com). Automated tests cover the allowlist logic and unauthenticated redirect, but the full OAuth redirect flow with Google's consent screen requires manual verification in a real browser. |
| **Type** | Verification (manual) |
| **Features covered** | 9 (Admin Experience — Auth + Functions) |
| **Procedure** | 1. Open an incognito/private browser window (ensures no cached session).<br>2. Navigate to `/admin` on the running instance.<br>3. Confirm the browser redirects to Google OAuth consent screen.<br>4. Complete Google sign-in using the authorized identity (sam@samkirk.com).<br>5. Verify redirect back to the admin dashboard.<br>6. Confirm admin functions are accessible (resume upload, dance menu upload, recent submissions).<br>7. Reload the page and verify the session persists (no re-login required).<br>8. (Optional) Attempt login with an unauthorized Google account and verify access is denied. |
| **Inputs** | Running instance (local dev server or deployed), Google Workspace identity (sam@samkirk.com), incognito browser window |
| **Expected outputs** | OAuth redirect completes successfully. Admin dashboard loads after login. Admin functions (resume upload, dance menu upload, submissions view) are accessible. Session persists across page reload. Unauthorized accounts are rejected. |
| **GCP required** | No (OAuth works against Google's identity service regardless of hosting; local dev server is sufficient) |

---

## VER-003: Cloud Run deployment serves traffic

| Field | Value |
|-------|-------|
| **ID** | VER-003 |
| **Headline** | Cloud Run deployment serves traffic |
| **Description** | Verify that the production deployment on Cloud Run is healthy and serving traffic correctly. This covers canonical domain resolution, www redirect, page rendering, and tool request handling in the production environment. These are infrastructure-level checks that cannot be replicated in local development. |
| **Type** | Verification (manual) |
| **Features covered** | 6 (Deployment & Hosting) |
| **Procedure** | 1. Open a browser and navigate to `https://samkirk.com`.<br>2. Verify the home page loads successfully (no 500 errors, content renders).<br>3. Navigate to `https://www.samkirk.com` and verify it redirects to `https://samkirk.com`.<br>4. Navigate to the tools hub and submit a tool request (e.g., Fit Tool with a test job URL).<br>5. Verify the tool request completes without errors.<br>6. Check Cloud Run logs in GCP Console for any 500-level errors during the above steps.<br>7. (Optional) Verify DNS resolution: `samkirk.com` resolves to the Cloud Run service (DNS managed in Microsoft DNS). |
| **Inputs** | Production deployment at `samkirk.com`, access to GCP Console for Cloud Run logs |
| **Expected outputs** | Home page loads at `https://samkirk.com` with correct content. `https://www.samkirk.com` redirects (301/302) to `https://samkirk.com`. Tool requests complete successfully. No 500-level errors in Cloud Run logs. |
| **GCP required** | Yes (requires production Cloud Run deployment and GCP Console access for log verification) |

---

## Cross-references

- **Test catalog**: `docs/test-catalog.md` — Contains all 55 automated test entries (TEST-001 through TEST-682). Verifications in this registry complement but do not overlap with automated tests.
- **Feature-test matrix**: `docs/feature-test-matrix.md` — Maps features to tests and verifications. The Deployment Coverage Note (section 6) references VER-001 through VER-003 as the intended verification entries for deployment concerns.
- **Master test runner `--release` output**: `web/scripts/test-all.ts` (lines 867-873) — Hardcodes the VER checklist printed after automated suites complete:
  ```
  - [ ] VER-001: Visual inspect resume PDF layout
  - [ ] VER-002: OAuth flow in fresh browser session
  - [ ] VER-003: Cloud Run deployment serves traffic
  ```
- **Master test specification**: `docs/master-test-SPECIFICATION.md` section 5.3 — Defines the verification metadata format used in this registry. Section 5.5 defines the release gate that prints this checklist.
