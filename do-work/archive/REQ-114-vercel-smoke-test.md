---
id: REQ-114
title: "Smoke test on Vercel preview URL"
status: failed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-113, REQ-115, REQ-116]
batch: "vercel-migration-phase-4"
claimed_at: 2026-02-17T14:16:00-08:00
route: A
completed_at: 2026-02-17T14:40:00-08:00
error: "GCP API routes return 500 — /api/session/init and /api/dance-menu fail. Likely GOOGLE_APPLICATION_CREDENTIALS_JSON issue on Vercel."
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
- [x] **[Sam]** All navigation pages render — PASS (Home, Hire Me, Song Dedication, Photo Fun, Explorations). Dance Menu page renders but content fails (API 500).
- [ ] **[Sam]** reCAPTCHA widget appears on tool pages — BLOCKED (session init fails before reCAPTCHA loads)
- [ ] **[Sam]** Complete reCAPTCHA → submit test job to "How Do I Fit?" → verify LLM response — BLOCKED
- [ ] **[Sam]** Test "Get a Custom Resume" tool — BLOCKED
- [ ] **[Sam]** Test "Interview Me Now" tool — BLOCKED
- [ ] **[Sam]** Admin: Google OAuth login works — NOT TESTED (also needs REQ-115 OAuth redirect URIs)
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
| Hire Me | FAIL — page renders but `/api/session/init` returns 500, "Failed to initialize session" |
| Dance Menu | FAIL — page renders but `/api/dance-menu` returns 500, "Failed to fetch menu" |
| Song Dedication | PASS — audio player and content render |
| Photo Fun | PASS — features list and "Launch Photo Fun" button render |
| Explorations | PASS — all 5 topic cards render |
| reCAPTCHA | BLOCKED by session init failure |
| LLM tools | BLOCKED by session init failure |
| OAuth login | NOT TESTED (needs REQ-115 redirect URIs) |
| Resume upload | NOT TESTED |
| Artifact download | NOT TESTED |

### Root Cause Analysis

Both failing endpoints depend on GCP services:
- `/api/session/init` → Firestore (`@google-cloud/firestore`)
- `/api/dance-menu` → Cloud Storage (`@google-cloud/storage`)

Both use `getGcpCredentials()` from `web/src/lib/gcp-credentials.ts` which reads `GOOGLE_APPLICATION_CREDENTIALS_JSON`. The env var IS set on Vercel (confirmed via `vercel env ls`), but the serverless functions still return 500.

**Likely causes:**
1. SA key JSON may have formatting issues (escaped newlines in private_key)
2. The service account may lack Firestore/Storage IAM permissions
3. The env var value may need to be re-set with proper escaping

**Console errors observed:**
- React hydration error #418 (text content mismatch — minor, separate issue)

### Next Steps
- Debug the GCP credentials on Vercel (check SA permissions, JSON format)
- Fix the 500s, then re-run this smoke test

*Failed — work action (Route A)*

## Testing

**Manual browser testing via Claude in Chrome extension**

**Pages tested:** 6/6 navigation pages rendered (2 had API failures)
**API routes tested:** `/api/session/init` (500), `/api/dance-menu` (500), `/api/health` (200 OK)
**Blocked items:** 7/9 checklist items blocked or not tested due to GCP API failures

*Verified by work action*
