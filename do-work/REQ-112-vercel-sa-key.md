---
id: REQ-112
title: "Create service account key for Vercel"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
related: [REQ-110, REQ-111]
batch: "vercel-migration-phase-3"
source_step: "3.3"
source_doc: "docs/vercel-migration-TODO.md"
blueprint_ref: "docs/vercel-migration-BLUEPRINT.md"
model_hint: ""
---

# Create service account key for Vercel (Step 3.3)

## What
Sam decides whether to reuse the existing Cloud Run SA or create a dedicated Vercel SA, generates a key JSON, pastes it into Vercel as `GOOGLE_APPLICATION_CREDENTIALS_JSON`, and deletes the local key file.

## Checklist
- [ ] **[Sam]** Decide: reuse existing Cloud Run SA or create dedicated `samkirk-v3-vercel` SA
- [ ] **[Sam]** If new SA: create it and grant 4 IAM roles (datastore.user, aiplatform.user, storage.objectViewer, storage.objectAdmin)
- [ ] **[Sam]** Generate key JSON and paste into Vercel as `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- [ ] **[Sam]** Delete local key file after pasting

## Blueprint Guidance

### Step 3.3: Create service account key for Vercel

```
Manual step (Sam in GCP console or CLI):

Option A — Reuse existing service account:
  gcloud iam service-accounts keys create ~/vercel-sa-key.json \
    --iam-account=samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com

Option B — Create a dedicated Vercel service account:
  gcloud iam service-accounts create samkirk-v3-vercel \
    --display-name="samkirk-v3 Vercel runtime" \
    --project=samkirk-v3

  # Grant roles:
  for role in roles/datastore.user roles/aiplatform.user roles/storage.objectViewer roles/storage.objectAdmin; do
    gcloud projects add-iam-policy-binding samkirk-v3 \
      --member="serviceAccount:samkirk-v3-vercel@samkirk-v3.iam.gserviceaccount.com" \
      --role="$role"
  done

  gcloud iam service-accounts keys create ~/vercel-sa-key.json \
    --iam-account=samkirk-v3-vercel@samkirk-v3.iam.gserviceaccount.com

Then paste the contents of ~/vercel-sa-key.json as GOOGLE_APPLICATION_CREDENTIALS_JSON in Vercel.

IMPORTANT: Delete the local key file after pasting:
  rm ~/vercel-sa-key.json
```

## Context
- **Document set**: vercel-migration
- **Phase**: 3 — Vercel Project Setup (Dashboard + Git Integration)
- **Specification**: See docs/vercel-migration-SPECIFICATION.md for full requirements
- **Owner**: Sam (GCP CLI + dashboard action)

## Dependencies
Depends on REQ-110 (project must exist). REQ-111 needs this key value for env var setup.

---
*Source: docs/vercel-migration-TODO.md, Step 3.3*
