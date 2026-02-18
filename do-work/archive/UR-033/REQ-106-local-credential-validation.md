---
id: REQ-106
title: "Local validation with explicit credentials"
status: completed
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-033
claimed_at: 2026-02-17T11:30:00-08:00
route: A
completed_at: 2026-02-17T12:00:00-08:00
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
- [x] **[Sam]** SA key reused from Vercel (REQ-112) — pulled via `vercel env pull`
- [x] **[Sam]** Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` in `.env.local` and ran `npm run dev`
- [x] **[Sam]** Smoke test: uploaded resume at /hire-me, ran Analyze Fit, downloaded PDF report — Firestore + Vertex AI + GCS all working
- [x] **[Sam]** Unset env var, restarted `npm run dev` — ADC fallback works, same flow passes
- [x] **[Sam]** Cleaned up temp files (`/tmp/.env.vercel`, `/tmp/sa-key-oneline.json`)

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

## Triage

**Route: A** - Simple

**Reasoning:** All checklist items are tagged `[Sam]` — this is a manual local testing step requiring human execution (GCP key creation, dev server smoke testing, ADC fallback verification). Cannot be automated.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: Manual testing step that cannot be automated by an agent.

*Skipped by work action*

## Implementation Summary

- Pulled SA key from Vercel via `vercel env pull` (reused key from REQ-112)
- Fixed JSON encoding issue: Vercel's `\n` escaping broke dotenv parsing — resolved by compacting to single-line JSON with `json.dumps`
- Tested explicit credentials: uploaded resume, ran full Analyze Fit flow, downloaded PDF — Firestore, Vertex AI, GCS all confirmed working
- Tested ADC fallback: removed env var, restarted dev server, repeated same flow — all services still working via ADC

*Completed manually by Sam with agent assistance*

## Testing

**Explicit credentials test:** Upload resume → Analyze Fit → Download PDF — all GCP services working
**ADC fallback test:** Same flow without env var — all GCP services working via ADC
**Result:** Both credential paths confirmed working

---
*Source: docs/vercel-migration-TODO.md, Step 1.4*
