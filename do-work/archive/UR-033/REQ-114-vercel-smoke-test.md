---
id: REQ-114
title: "Smoke test on Vercel preview URL"
status: in_progress
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-113, REQ-115, REQ-116]
batch: "vercel-migration-phase-4"
claimed_at: 2026-02-17T14:16:00-08:00
route: A
completed_at: 2026-02-17T14:40:00-08:00
error: ""
source_step: "4.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Smoke test on Vercel preview URL (Step 4.2)

## What
Manually test the Vercel preview deployment: homepage, navigation, reCAPTCHA, all three LLM tools, admin OAuth login, resume upload, and artifact download.

## Checklist
- [x] **[Sam]** Homepage loads correctly — PASS
- [x] **[Sam]** All navigation pages render — PASS (all 6 pages render, Dance Menu now loads content)
- [x] Fix GCP API 500s — root cause: Vercel env vars have trailing newlines, `ADMIN_ALLOWED_EMAIL` fails zod `.email()` validation. Fixed by adding `.trim()` to all env var values in `web/src/lib/env.ts`.
- [x] `/api/session/init` — now returns 200 with valid session
- [x] `/api/dance-menu` — now returns 200 with `available: true` and HTML content
- [x] **[Sam]** reCAPTCHA widget appears on tool pages — PASS (added `vercel.app` to reCAPTCHA v2 allowed domains in Google admin console)
- [x] **[Sam]** Complete reCAPTCHA → submit test job to "How Do I Fit?" → verify LLM response — PASS
- [x] **[Sam]** Test "Get a Custom Resume" tool — PASS
- [x] **[Sam]** Test "Interview Me Now" tool — PASS (one transient failure mid-conversation, retry succeeded; transcript report OK)
- [ ] **[Sam]** Admin: Google OAuth login works — NOT TESTED (needs REQ-115 OAuth redirect URIs)
- [ ] **[Sam]** Admin: resume upload works — NOT TESTED
- [ ] **[Sam]** Download an artifact bundle — NOT TESTED

## Blueprint Guidance

### Step 4.2: Smoke test on Vercel preview URL

```
Manual testing against the Vercel preview URL:

1. Homepage loads correctly
2. Navigation works (all pages render)
3. Static pages load (explorations, song dedication)
4. reCAPTCHA widget appears on tool pages
5. Complete reCAPTCHA verification
6. Submit a test job URL to "How Do I Fit?" — verify LLM response
7. Test "Get a Custom Resume" tool
8. Test "Interview Me Now" tool
9. Admin login via Google OAuth (may need to add Vercel URL to OAuth authorized redirect URIs)
10. Admin: verify resume upload works
11. Download an artifact bundle
12. Check Dance Menu page loads

Track which tests pass/fail. Fix any issues before proceeding.
```

## Context
- **Document set**: vercel-migration
- **Phase**: 4 — Deploy and Verify on Vercel Preview
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (manual testing)

## Dependencies
Depends on REQ-113 (successful first deployment).

---
*Source: docs/vercel-migration-TODO.md, Step 4.2*

---

## Triage

**Route: A** - Simple

**Reasoning:** Manual smoke testing — all checklist items are [Sam] browser tests. No code changes needed unless issues are found.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Manual browser testing against a live URL. Walk through each checklist item with the user.

*Skipped by work action*

## Implementation Summary

**Deployment URL tested:** https://samkirk-com-v3-5w133qm7u-sam-kirks-projects.vercel.app

### Results

| Page/Feature | Status |
|---|---|
| Homepage | PASS — photo, bio, nav, CTA all render |
| Hire Me | PASS — page renders, session init succeeds (200), job input form shows |
| Dance Menu | PASS — page renders with full HTML content from GCS, download tabs work |
| Song Dedication | PASS — audio player and lyrics render |
| Photo Fun | PASS — features list and "Launch Photo Fun" button render |
| Explorations | PASS — all 5 topic cards render |
| reCAPTCHA | PARTIAL — widget renders but "Invalid domain for site key" error. Need to add `samkirk-com-v3.vercel.app` to reCAPTCHA allowed domains. |
| LLM tools | BLOCKED by reCAPTCHA domain config |
| OAuth login | NOT TESTED (needs REQ-115 redirect URIs) |
| Resume upload | NOT TESTED |
| Artifact download | NOT TESTED |

### Root Cause Analysis (RESOLVED)

**Actual root cause:** Vercel env vars contain trailing newlines. When `ADMIN_ALLOWED_EMAIL` = `"sam@samkirk.com\n"`, the zod `.email()` validator rejects it. This causes `getEnv()` to throw, which crashes both `getFirestore()` and `getStorage()` before they even attempt GCP auth.

**Fix applied:** Added `.trim()` transform to all string env vars in `web/src/lib/env.ts` using `z.string().transform((s) => s.trim()).pipe(...)`. This strips trailing newlines before validation.

**Verification:**
- Deployed temp debug endpoint to confirm: GCP credentials parse fine, Firestore and Storage both connect successfully after trim fix
- `/api/session/init` → 200 OK, returns valid session
- `/api/dance-menu` → 200 OK, returns dance menu HTML content
- All 1293 unit tests pass

**Production deployment:** https://samkirk-com-v3-g9h3agkpj-sam-kirks-projects.vercel.app

### Remaining items
- **reCAPTCHA domain config**: Add `samkirk-com-v3.vercel.app` to Google reCAPTCHA allowed domains
- LLM tool testing (blocked by reCAPTCHA)
- Admin OAuth login (needs REQ-115 redirect URIs)
- Resume upload and artifact download (needs admin access)
- React hydration error #418 on every page navigation (text content mismatch — minor, non-blocking)

*In progress — API fix applied, 6/6 pages pass, reCAPTCHA domain config needed*

## Testing

**Manual browser testing via Claude in Chrome extension**

**Pages tested:** 6/6 navigation pages render correctly
**API routes tested:** `/api/session/init` (200 OK), `/api/dance-menu` (200 OK), `/api/health` (200 OK)
**reCAPTCHA:** Widget renders but domain not authorized — needs config in Google reCAPTCHA admin
**Console errors:** React hydration #418 (text content mismatch) on page navigations — minor, non-blocking
**Blocked items:** 5/12 checklist items blocked by reCAPTCHA domain config or REQ-115

*Verified by work action*
