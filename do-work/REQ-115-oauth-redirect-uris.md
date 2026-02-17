---
id: REQ-115
title: "Update Google OAuth redirect URIs"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-113, REQ-114, REQ-116]
batch: "vercel-migration-phase-4"
source_step: "4.3"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Update Google OAuth redirect URIs (Step 4.3)

## What
Add Vercel preview URL and production URL to Google OAuth authorized redirect URIs. Also check the codebase for hardcoded `NEXTAUTH_URL` (Vercel auto-sets this).

## Checklist
- [ ] **[Sam]** Add Vercel preview URL to OAuth authorized redirect URIs in Google Cloud Console
- [ ] **[Sam]** Add `https://samkirk.com/api/auth/callback/google` for production
- [ ] **[Sonnet 4] [AI]** Check codebase for hardcoded `NEXTAUTH_URL` — Vercel auto-sets this

## Blueprint Guidance

### Step 4.3: Update Google OAuth redirect URIs

```
Manual step (Sam in Google Cloud Console):

1. Go to APIs & Services → Credentials
2. Find the OAuth 2.0 Client ID used by the app
3. Add the Vercel preview URL to Authorized redirect URIs:
   - https://samkirk-v3.vercel.app/api/auth/callback/google
   - https://samkirk.com/api/auth/callback/google (for production)
4. Save

Also update NEXTAUTH_URL if it's hardcoded anywhere:
- Search the codebase for NEXTAUTH_URL
- On Vercel, NEXTAUTH_URL is auto-set by Vercel for production deployments
- For preview deployments, it uses VERCEL_URL automatically
```

## Context
- **Document set**: vercel-migration
- **Phase**: 4 — Deploy and Verify on Vercel Preview
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Sonnet 4 (advisory — AI portion is a quick codebase search)

## Dependencies
Depends on REQ-113 (need to know the Vercel preview URL). Needed before admin OAuth testing in REQ-114.

---
*Source: docs/vercel-migration-TODO.md, Step 4.3*
