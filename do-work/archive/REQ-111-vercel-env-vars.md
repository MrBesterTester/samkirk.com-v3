---
id: REQ-111
title: "Configure environment variables in Vercel"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-16T20:02:00-08:00
route: A
completed_at: 2026-02-16T20:07:00-08:00
related: [REQ-110, REQ-112]
batch: "vercel-migration-phase-3"
source_step: "3.2"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Configure environment variables in Vercel (Step 3.2)

## What
Sam retrieves all secret values from GCP Secret Manager and adds all 13 env vars (5 plain text + 7 sensitive + 1 NEXT_PUBLIC) to the Vercel dashboard.

## Checklist
- [x] **[Sam]** Retrieve all secret values from GCP Secret Manager (6 secrets)
- [x] **[Sam]** Add all 13 env vars to Vercel dashboard (5 plain text + 7 sensitive + 1 NEXT_PUBLIC)
- [x] **[Sam]** Double-check: `GOOGLE_APPLICATION_CREDENTIALS_JSON` is the full JSON blob (not a file path)

## Blueprint Guidance

### Step 3.2: Configure environment variables in Vercel

```
Manual step (Sam in Vercel dashboard):

Go to Project Settings → Environment Variables.
Add all 13 variables (12 from spec + 1 NEXT_PUBLIC):

Plain text (all environments):
- GCP_PROJECT_ID = samkirk-v3
- GCS_PUBLIC_BUCKET = samkirk-v3-public
- GCS_PRIVATE_BUCKET = samkirk-v3-private
- VERTEX_AI_LOCATION = us-central1
- VERTEX_AI_MODEL = gemini-2.0-flash

Sensitive (all environments):
- RECAPTCHA_SITE_KEY = (copy from Secret Manager)
- RECAPTCHA_SECRET_KEY = (copy from Secret Manager)
- GOOGLE_OAUTH_CLIENT_ID = (copy from Secret Manager)
- GOOGLE_OAUTH_CLIENT_SECRET = (copy from Secret Manager)
- AUTH_SECRET = (copy from Secret Manager)
- ADMIN_ALLOWED_EMAIL = (copy from Secret Manager)
- GOOGLE_APPLICATION_CREDENTIALS_JSON = (paste full service account key JSON)

Build-time public:
- NEXT_PUBLIC_RECAPTCHA_SITE_KEY = (same value as RECAPTCHA_SITE_KEY)

To retrieve current secret values:
  gcloud secrets versions access latest --secret="google-oauth-client-id" --project=samkirk-v3
  gcloud secrets versions access latest --secret="google-oauth-client-secret" --project=samkirk-v3
  gcloud secrets versions access latest --secret="recaptcha-site-key" --project=samkirk-v3
  gcloud secrets versions access latest --secret="recaptcha-secret-key" --project=samkirk-v3
  gcloud secrets versions access latest --secret="auth-secret" --project=samkirk-v3
  gcloud secrets versions access latest --secret="admin-allowed-email" --project=samkirk-v3
```

## Context
- **Document set**: vercel-migration
- **Phase**: 3 — Vercel Project Setup (Dashboard + Git Integration)
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (dashboard action)

## Dependencies
Depends on REQ-110 (project must exist) and REQ-112 (SA key needed for one of the env vars).

---
*Source: docs/vercel-migration-TODO.md, Step 3.2*

---

## Triage

**Route: A** - Simple

**Reasoning:** Manual dashboard task — retrieve secrets via gcloud CLI, paste into Vercel dashboard.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Clear list of 13 env vars to add. CLI fetched all secret values, Sam pasted into Vercel.

*Skipped by work action*

## Implementation Summary

- Retrieved 6 secret values from GCP Secret Manager via `gcloud secrets versions access`
- Sam added all 13 env vars to Vercel dashboard (5 plain text + 7 sensitive + 1 NEXT_PUBLIC)
- GOOGLE_APPLICATION_CREDENTIALS_JSON set as full JSON blob from SA key

*Completed by work action (Route A) — gcloud CLI + manual step by Sam*

## Testing

**Tests run:** N/A
**Result:** Manual dashboard action — verification will occur during first deploy (REQ-113).

*Verified by work action*
