---
id: REQ-122
title: "Remove Cloud Run and build infrastructure"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-123, REQ-124]
batch: "vercel-migration-phase-7"
source_step: "7.1"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Remove Cloud Run and build infrastructure (Step 7.1)

## What
After Vercel has been stable for ~1 week, Sam deletes the Cloud Run service, Artifact Registry images/repository, Secret Manager secrets, and optionally the old service account.

## Checklist
- [ ] **[Sam]** Delete Cloud Run service: `gcloud run services delete samkirk-v3 --region=us-central1`
- [ ] **[Sam]** Delete Artifact Registry images and repository
- [ ] **[Sam]** Delete Secret Manager secrets (after confirming all values are in Vercel)
- [ ] **[Sam]** Optionally: remove old Cloud Run service account (if using dedicated Vercel SA)

## Blueprint Guidance

### Step 7.1: Remove Cloud Run and build infrastructure

```
After confirming Vercel is stable (wait ~1 week):

# Delete Cloud Run service
gcloud run services delete samkirk-v3 --region=us-central1 --project=samkirk-v3

# Delete Artifact Registry images
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3/web --delete-tags --project=samkirk-v3

# Optionally delete Artifact Registry repository
gcloud artifacts repositories delete samkirk-v3 --location=us-central1 --project=samkirk-v3

# Delete Secret Manager secrets (after verifying all values are in Vercel)
for secret in google-oauth-client-id google-oauth-client-secret recaptcha-site-key recaptcha-secret-key auth-secret admin-allowed-email; do
  gcloud secrets delete $secret --project=samkirk-v3
done

# Optionally: remove Cloud Run service account (if not creating a dedicated Vercel SA)
# Only if you created a dedicated samkirk-v3-vercel SA instead
```

## Context
- **Document set**: vercel-migration
- **Phase**: 7 — Cleanup Old Infrastructure
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (GCP CLI actions — destructive, only after stable period)

## Dependencies
Only proceed after Vercel has been stable in production for at least 1 week (after REQ-121).

---
*Source: docs/vercel-migration-TODO.md, Step 7.1*
