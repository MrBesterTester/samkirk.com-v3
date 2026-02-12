# Fix Duplicative Work on Hire-Me Tools

## Context

When a hiring manager uses multiple tools under `/hire-me` (fit analysis, custom resume, interview), they face redundant work:
1. **Captcha solved per tool** — `ToolGate` always shows the captcha after session init, never checking if the session already has `captchaPassedAt` set. Navigating fit → resume forces re-verification.
2. **Job description re-entered per tool** — Fit and Resume both have independent `JobInputForm` components with no shared state.

---

## Fix 1: Skip Captcha if Already Passed

The session already stores `captchaPassedAt` in Firestore (`SessionDoc.captchaPassedAt`). The fix is to surface this to the client.

- [ ] **`web/src/app/api/session/init/route.ts`** — When returning an existing valid session (`isNew: false`), fetch the session doc via `getSession()` from `lib/session.ts` and check if `captchaPassedAt` is set. Add `captchaPassed: boolean` to `SessionInitResponse`. For new sessions, `captchaPassed: false`; for existing sessions, read from Firestore.
- [ ] **`web/src/components/ToolGate.tsx`** — Parse `captchaPassed` from the session init response. If `captchaPassed` is true, skip straight to `"ready"` status instead of `"captcha"`.

---

## Fix 2: Share Job Description Across Tools

Use `sessionStorage` (browser-only, clears on tab close) to persist the job description text client-side. No server changes needed.

Stored shape: `{ mode: "paste"|"url", text?: string, url?: string }`

- [ ] **`web/src/app/hire-me/fit/page.tsx`** — In `JobInputForm`, on successful submit save the job text/URL to `sessionStorage` under key `hire-me-job-input`. On mount, pre-populate from `sessionStorage` if available.
- [ ] **`web/src/app/hire-me/resume/page.tsx`** — Same: pre-populate from `sessionStorage` on mount, save to `sessionStorage` on successful submit.

---

## Verification

- [ ] Build and run dev server
- [ ] Navigate to `/hire-me/fit`, solve captcha, submit a job description
- [ ] Navigate to `/hire-me/resume` — captcha should be skipped, job text should be pre-populated
- [ ] Navigate to `/hire-me/interview` — captcha should be skipped (no JD needed here)
- [ ] Run existing tests: `npm test` and check `ToolGate.test.tsx` still passes
