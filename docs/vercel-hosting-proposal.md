# Proposal: Migrate Website Hosting from Cloud Run to Vercel

## 1) Motivation

The current GCP Cloud Run deployment works but comes with significant operational overhead and a gap in edge-level cost protection:

**Operational pain:**
- Dockerfile maintenance (multi-stage build, Node.js version pinning, standalone output config)
- Cloud Build pipeline (`cloudbuild.yaml`, substitution variables, build logs)
- Artifact Registry (Docker image storage, cleanup)
- Secret Manager (6 secrets, IAM bindings to the Cloud Run service account)
- Cloud Run service account with 5+ IAM role bindings
- Manual deploys via `gcloud builds submit`

**Security gap:**
- No edge-level rate limiting or bot protection. Cloud Armor (Google's WAF) would close this gap but costs ~$18-20/month for the load balancer alone, plus per-policy and per-rule charges — disproportionate for a personal portfolio site.
- All traffic (legitimate or abusive) reaches the container and consumes compute resources, even when the app-level 4-layer defense rejects it.

**Comparison with photo-fun5 (Vercel):**
- photo-fun5 gets WAF rate limiting, bot protection, and AI bot blocking for free with Vercel's built-in security.
- Deploys happen automatically on `git push`.
- No Docker, no build pipeline, no service accounts, no Secret Manager.

## 2) Proposal

Move website hosting from Cloud Run to Vercel. Keep all backend services on GCP.

### What moves to Vercel
- **Website hosting** — Vercel runs the Next.js app natively (SSR, API routes, static assets)
- **Secrets** — move from GCP Secret Manager to Vercel environment variables (dashboard)
- **Edge security** — Vercel WAF rate limiting on tool routes, Bot Protection, AI Bot deny

### What stays on GCP (unchanged)
- **Firestore** — sessions, rate limits, spend tracking, resume index, submissions
- **Vertex AI** — LLM calls (Gemini) for all three tools
- **GCS** — resume storage (public + private buckets)
- **reCAPTCHA** — bot verification gate
- **GCP Billing Budget** — $20/month email alerts at 50/90/100% thresholds

### What gets dropped (no replacement needed)
- `web/Dockerfile`
- `web/.dockerignore`
- `cloudbuild.yaml`
- Artifact Registry repository (`us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3`)
- Cloud Run service (`samkirk-v3`)
- Cloud Run service account (`samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com`)
- Secret Manager secrets (migrated to Vercel env vars)
- Production deploy workflow in GitHub Actions (if any; Vercel replaces it)

## 3) Authentication Change

This is the only architectural change. Currently, Vertex AI and Firestore authenticate via **Application Default Credentials (ADC)** — the Cloud Run service account is automatically available to the SDKs. On Vercel, there is no GCP service account in the environment.

**Solution:** Create a GCP service account key (JSON) and store it as a single Vercel environment variable (`GOOGLE_APPLICATION_CREDENTIALS_JSON`). Both `@google-cloud/vertexai` and `@google-cloud/firestore` accept explicit credentials.

### Files that need credential changes

| File | Current auth | Change needed |
|------|-------------|---------------|
| `web/src/lib/firestore.ts` | `new Firestore({ projectId })` — implicit ADC | Pass `credentials` from parsed JSON env var |
| `web/src/lib/vertex-ai.ts` | `new VertexAI({ project, location })` — implicit ADC | Pass `googleAuthOptions.credentials` from parsed JSON env var |
| `web/src/lib/env.ts` | No credential env var in schema | Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` (optional in dev, required in prod) |

The credentials helper would be a small shared function (~10 lines) that parses the JSON env var when present and falls back to ADC when absent (preserving local dev behavior with `gcloud auth application-default login`).

### Service account permissions needed

One service account with these roles (same as the current Cloud Run service account):

| Role | Purpose |
|------|---------|
| `roles/datastore.user` | Firestore read/write |
| `roles/aiplatform.user` | Vertex AI API calls |
| `roles/storage.objectViewer` | GCS read (public bucket) |
| `roles/storage.objectAdmin` | GCS read/write (private bucket) |

## 4) Environment Variables on Vercel

All 11 values, set once in the Vercel dashboard:

| Variable | Source | Notes |
|----------|--------|-------|
| `GCP_PROJECT_ID` | `samkirk-v3` | Plain text |
| `GCS_PUBLIC_BUCKET` | `samkirk-v3-public` | Plain text |
| `GCS_PRIVATE_BUCKET` | `samkirk-v3-private` | Plain text |
| `VERTEX_AI_LOCATION` | `us-central1` | Plain text |
| `VERTEX_AI_MODEL` | `gemini-2.0-flash` | Plain text |
| `RECAPTCHA_SITE_KEY` | From Secret Manager | Sensitive |
| `RECAPTCHA_SECRET_KEY` | From Secret Manager | Sensitive |
| `GOOGLE_OAUTH_CLIENT_ID` | From Secret Manager | Sensitive |
| `GOOGLE_OAUTH_CLIENT_SECRET` | From Secret Manager | Sensitive |
| `AUTH_SECRET` | From Secret Manager | Sensitive |
| `ADMIN_ALLOWED_EMAIL` | From Secret Manager | Sensitive |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | New service account key | Sensitive, JSON blob |

## 5) Vercel Security Configuration

Replicate what photo-fun5 has, adapted for samkirk-v3's tool routes:

### WAF Rate Limiting

| Rule | Path | Window | Limit | Key |
|------|------|--------|-------|-----|
| Rate limit tools | `/api/tools/*` | 60 seconds | 20 requests | IP |

This complements (not replaces) the existing app-level rate limit (10 req / 10 min per session+IP).

### Bot Management

| Ruleset | Action |
|---------|--------|
| Bot Protection | Challenge (JS challenge for non-browser traffic) |
| AI Bots | Deny (block GPTBot, ClaudeBot, PerplexityBot, etc.) |

## 6) Function Timeout

Vercel serverless functions default to 10s (Hobby) or 60s (Pro). The LLM tool calls via Vertex AI can take 10-30 seconds. A `vercel.json` config would set the timeout for API routes:

```json
{
  "functions": {
    "app/api/tools/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

This requires a Vercel Pro plan ($20/month) for the 60s timeout. The Hobby plan's 10s limit would likely be too short for LLM calls.

## 7) What Doesn't Change

The entire app-level security stack is preserved — it's all application code, not infrastructure:

- **Session management** (`session.ts`) — cookie-based, Firestore-backed
- **CAPTCHA gate** (`captcha.ts`, `ReCaptcha.tsx`) — reCAPTCHA v2
- **Rate limiting** (`rate-limit.ts`) — 10 req / 10 min, Firestore-backed
- **Spend cap** (`spend-cap.ts`) — $20/month hard stop, Firestore-backed
- **`withToolProtection()` wrapper** (`tool-protection.ts`) — centralized 4-check enforcement
- **Cost estimation and tracking** — all Firestore-based, portable

## 8) Cost Comparison

| Item | Cloud Run (current) | Vercel (proposed) |
|------|--------------------|--------------------|
| **Hosting** | ~$0-5/month (Cloud Run free tier + overages) | $0 (Hobby) or $20/month (Pro) |
| **Edge security** | $0 (none configured) or ~$20+/month (Cloud Armor) | Included in plan |
| **Secrets** | ~$0.06/month (Secret Manager, 6 secrets) | Included in plan |
| **Docker registry** | ~$0.10/month (Artifact Registry storage) | N/A |
| **Build minutes** | ~$0 (Cloud Build free tier) | Included in plan |
| **Vertex AI** | Same | Same |
| **Firestore** | Same | Same |
| **GCS** | Same | Same |

On the **Hobby plan** ($0): You get hosting + basic WAF but 10s function timeout (too short for LLM calls). Would need to test whether streaming responses or other workarounds could make this work.

On the **Pro plan** ($20): You get 60s function timeout + full WAF + bot protection + analytics. The $20 is comparable to what Cloud Run + Cloud Armor would cost, with far less operational complexity.

## 9) Migration Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Vertex AI auth fails on Vercel | Medium | Test with service account key locally before deploying |
| Firestore auth fails on Vercel | Medium | Same key covers both; test locally first |
| Function timeout too short (Hobby) | High | Use Pro plan, or investigate streaming |
| Cold start latency | Low | Vercel's edge network typically handles this well for Next.js |
| Loss of Cloud Run logs | Low | Vercel has built-in logging; GCP logs still available for Firestore/Vertex AI |

## 10) Decision Needed

- **Vercel Hobby ($0) vs Pro ($20/month)?** — Pro is recommended for the 60s function timeout and full WAF capabilities. Hobby may work if LLM calls can be kept under 10s (unlikely for the interview tool's multi-turn flow).
- **Proceed with migration?** — If yes, this proposal should be developed into a full SPECIFICATION → BLUEPRINT → TODO cycle per the Dylan Davis methodology.
