---
id: REQ-115
title: "Update Google OAuth redirect URIs"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-17T12:00:00-08:00
route: A
completed_at: 2026-02-17T12:15:00-08:00
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
- [x] **[Sam]** Add Vercel preview URL to OAuth authorized redirect URIs in Google Cloud Console
- [x] **[Sam]** Add `https://samkirk.com/api/auth/callback/google` for production
- [x] **[Sonnet 4] [AI]** Check codebase for hardcoded `NEXTAUTH_URL` — Vercel auto-sets this

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

---

## Triage

**Route: A** - Simple

**Reasoning:** The AI portion is a simple codebase search for hardcoded `NEXTAUTH_URL`. The OAuth redirect URI updates are manual (Sam in Google Cloud Console). No complex implementation needed.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Simple codebase grep for hardcoded NEXTAUTH_URL values. No architectural decisions needed.

*Skipped by work action*

## Implementation Summary

- Searched entire codebase for hardcoded `NEXTAUTH_URL` — **none found**
- Only references exist in documentation files (BLUEPRINT, TODO, UR input)
- No source code, config files, or env files reference `NEXTAUTH_URL`
- Vercel's auto-set behavior will work without any codebase changes
- Added OAuth redirect URIs in Google Cloud Console (sam@samkirk.com, project samkirk-v3):
  - **Authorized JavaScript origins:** added `https://samkirk-v3.vercel.app` and `https://samkirk.com`
  - **Authorized redirect URIs:** added `https://samkirk-v3.vercel.app/api/auth/callback/google` and `https://samkirk.com/api/auth/callback/google`

*Completed by work action (Route A)*

## Testing

**Tests run:** N/A
**Result:** Codebase search task only — no code changes made, no tests needed.

*Verified by work action*
