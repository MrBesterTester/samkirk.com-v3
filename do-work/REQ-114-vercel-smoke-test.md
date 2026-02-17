---
id: REQ-114
title: "Smoke test on Vercel preview URL"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-113, REQ-115, REQ-116]
batch: "vercel-migration-phase-4"
source_step: "4.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Smoke test on Vercel preview URL (Step 4.2)

## What
Manually test the Vercel preview deployment: homepage, navigation, reCAPTCHA, all three LLM tools, admin OAuth login, resume upload, and artifact download.

## Checklist
- [ ] **[Sam]** Homepage loads correctly
- [ ] **[Sam]** All navigation pages render
- [ ] **[Sam]** reCAPTCHA widget appears on tool pages
- [ ] **[Sam]** Complete reCAPTCHA → submit test job to "How Do I Fit?" → verify LLM response
- [ ] **[Sam]** Test "Get a Custom Resume" tool
- [ ] **[Sam]** Test "Interview Me Now" tool
- [ ] **[Sam]** Admin: Google OAuth login works
- [ ] **[Sam]** Admin: resume upload works
- [ ] **[Sam]** Download an artifact bundle

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
