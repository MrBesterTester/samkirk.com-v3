---
id: REQ-106
title: "Local validation with explicit credentials"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-103, REQ-104, REQ-105]
batch: "vercel-migration-phase-1"
source_step: "1.4"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Local validation with explicit credentials (Step 1.4)

## What
Manual testing step for Sam. Create a GCP service account key, set it as `GOOGLE_APPLICATION_CREDENTIALS_JSON`, verify all GCP services work with explicit credentials, then verify ADC fallback still works without it.

## Checklist
- [ ] **[Sam]** Create GCP service account key: `gcloud iam service-accounts keys create /tmp/sa-key.json --iam-account=samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com`
- [ ] **[Sam]** Set `GOOGLE_APPLICATION_CREDENTIALS_JSON=$(cat /tmp/sa-key.json)` and run `npm run dev`
- [ ] **[Sam]** Smoke test: visit a tool page, verify Firestore + Vertex AI + GCS work with explicit credentials
- [ ] **[Sam]** Unset env var, run `npm run dev` again, verify ADC fallback still works
- [ ] **[Sam]** Delete the local key file: `rm /tmp/sa-key.json`

## Blueprint Guidance

### Step 1.4: Local validation with explicit credentials

Test the credential helper end-to-end locally before deploying to Vercel.

```
This is a manual/local testing step:

1. Create a GCP service account key (if not already done):
   gcloud iam service-accounts keys create /tmp/sa-key.json \
     --iam-account=samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com

2. Set the env var locally:
   export GOOGLE_APPLICATION_CREDENTIALS_JSON=$(cat /tmp/sa-key.json)

3. Run the dev server: npm run dev
4. Test: Visit a tool page (e.g. /tools/fit) and verify Firestore session creation works
5. Test: Submit a job URL and verify Vertex AI call works
6. Test: Check admin page to verify GCS access works

7. Unset the env var:
   unset GOOGLE_APPLICATION_CREDENTIALS_JSON

8. Run npm run dev again — verify ADC fallback still works (same tests)

9. Clean up: rm /tmp/sa-key.json

If using an existing or new service account, ensure it has the 4 roles listed in the spec:
- roles/datastore.user
- roles/aiplatform.user
- roles/storage.objectViewer
- roles/storage.objectAdmin
```

## Context
- **Document set**: vercel-migration
- **Phase**: 1 — GCP Credential Plumbing (Code Changes)
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory)
- **Owner**: Sam (manual testing step)

## Dependencies
Depends on REQ-105 (all code changes must be complete). Blocks Phase 2 work proceeding to deployment.

---
*Source: docs/vercel-migration-TODO.md, Step 1.4*
