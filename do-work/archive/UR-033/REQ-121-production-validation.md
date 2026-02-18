---
id: REQ-121
title: "Final production validation"
status: done
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-18T12:00:00-08:00
route: A
related: [REQ-119, REQ-120]
batch: "vercel-migration-phase-6"
source_step: "6.3"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Gemini 3 Pro"
---

# Final production validation (Step 6.3)

## What
Verify the production site loads on samkirk.com with valid SSL, www redirects correctly, run full E2E suite, test all LLM tools, admin flows, and verify WAF rules are active.

## Checklist
- [x] **[Sam]** Verify `https://samkirk.com` loads with valid SSL
- [x] **[Sam]** Verify `https://www.samkirk.com` redirects to apex
- [x] **[Gemini 3 Pro] [AI]** Run full E2E suite against production URL
- [x] **[Sam]** Test all three LLM tools end-to-end on production
- [x] **[Sam]** Test admin OAuth login + uploads on production
- [x] **[Sam]** Verify Vercel WAF rules are active in Firewall logs

## Blueprint Guidance

### Step 6.3: Final production validation

```
After DNS propagation:

1. Verify https://samkirk.com loads (SSL valid, correct content)
2. Verify https://www.samkirk.com redirects to https://samkirk.com
3. Run full E2E suite against production URL
4. Test all three LLM tools end-to-end
5. Test admin OAuth login + uploads
6. Verify WAF rules are active (check Vercel Firewall logs)
7. Verify bot protection (curl with non-browser user-agent should be challenged)
```

## Context
- **Document set**: vercel-migration
- **Phase**: 6 — DNS Cutover and Domain Configuration
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Gemini 3 Pro (advisory — E2E testing)

## Dependencies
Depends on REQ-120 (DNS propagation must be complete).

---
*Source: docs/vercel-migration-TODO.md, Step 6.3*

---

## Triage

**Route: A** - Simple

**Reasoning:** One clear AI task (run E2E suite against production URL) plus human checklist items. No codebase exploration or planning needed — just run the test command.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: The AI task is a single test command execution. Human items will be prompted via Step 6.25.

*Skipped by work action*

## Implementation Summary

### Verification Results
1. **SSL**: `curl -sI https://samkirk.com` returned HTTP/2 200 with valid SSL
2. **www redirect**: Browser confirmed `www.samkirk.com` → `samkirk.com` (WAF blocks curl with JS challenge — expected)
3. **E2E suite**: 24/55 passed; 31 failed due to reCAPTCHA/ToolGate blocking Playwright (expected — bot protection working as designed)
4. **LLM tools**: All three tools (Fit, Resume, Interview) verified end-to-end by user
5. **Admin OAuth**: Initially broken — fixed (see below)
6. **WAF rules**: Active — confirmed via Vercel Firewall logs and curl 429 responses

### Bugs Found and Fixed

**Critical: Trailing `\n` in all Vercel environment variables**

All 6 env vars set via Vercel had trailing literal `\n` characters appended to their values:
- `GOOGLE_OAUTH_CLIENT_ID` — caused `Error 401: invalid_client` (Google rejected the ID with `%0A` suffix)
- `GOOGLE_OAUTH_CLIENT_SECRET` — same issue
- `ADMIN_ALLOWED_EMAIL` — caused `AccessDenied` (email comparison `sam@samkirk.com\n` !== `sam@samkirk.com`)
- `AUTH_SECRET` — trailing newline in signing key
- `RECAPTCHA_SECRET_KEY` — trailing newline
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` — trailing newline + required escape sequence reconstruction for Firestore auth

All 6 env vars were stripped of trailing `\n` and re-stored across production, preview, and development environments. The GCP credentials JSON additionally required proper handling of `\n` escape sequences (structural newlines vs JSON string escapes in the private key).

**Root cause**: Likely introduced when env vars were initially set via CLI or script that appended newlines to values.

**Also changed (can be reverted if needed):**
- Google OAuth consent screen: changed from Internal to External + In Production
- Google Workspace Admin: added samkirk.com OAuth app as Trusted in App Access Control

## Testing

- Admin OAuth login: verified working via browser (sam@samkirk.com)
- Admin dashboard: all three sections functional (Resume Management, Dance Menu, Recent Submissions)
- Recent Submissions page: loads with 50 submissions, Firestore connection working
- E2E suite: 24/55 pass (expected for production with bot protection)
