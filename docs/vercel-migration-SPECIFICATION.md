# Vercel Hosting Migration — Specification

## 1) Summary

Migrate the samkirk.com Next.js application from **GCP Cloud Run** to **Vercel Pro** for hosting, while keeping all backend GCP services (Firestore, Vertex AI, GCS) unchanged. This replaces the Docker/Cloud Build/Cloud Run deployment pipeline with Vercel's native Next.js hosting and adds edge-level security (WAF, bot protection) that the current setup lacks.

## 2) Goals

- **Eliminate operational overhead**: Remove Dockerfile, Cloud Build pipeline, Artifact Registry, Cloud Run service, and Secret Manager in favor of Vercel's built-in deployment and environment variable management.
- **Add edge security**: Gain WAF rate limiting, bot protection, and AI bot blocking — capabilities that would cost ~$20+/month via Cloud Armor on GCP.
- **Preserve all application behavior**: The website, all three LLM tools, admin flows, guardrails, and data layer must work identically after migration.
- **Zero downtime for GCP backend**: Firestore, Vertex AI, GCS, reCAPTCHA, and GCP Billing Budget remain untouched.

## 3) Non-Goals

- Rewriting any application logic, UI, or tool flows.
- Migrating Firestore, GCS, or Vertex AI away from GCP.
- Changing the domain registrar or DNS provider (only DNS records change to point at Vercel).
- Adding new features — this is a pure infrastructure migration.
- Modifying the app-level security stack (sessions, CAPTCHA, rate limiting, spend cap).

## 4) Vercel Plan

**Vercel Pro ($20/month)** — required for 60-second serverless function timeout. LLM tool calls via Vertex AI routinely take 10–30 seconds, which exceeds the Hobby plan's 10-second limit.

## 5) What Moves to Vercel

| Component | Current (Cloud Run) | Target (Vercel) |
|-----------|-------------------|-----------------|
| **Website hosting** | Cloud Run container (Node.js + standalone Next.js) | Vercel native Next.js (SSR, API routes, static assets) |
| **Secrets** | GCP Secret Manager (6 secrets) | Vercel environment variables (dashboard) |
| **Build & deploy** | `cloudbuild.yaml` + Dockerfile + Artifact Registry + manual `gcloud builds submit` | Automatic on `git push` to connected repo |
| **Edge security** | None (Cloud Armor too expensive for personal site) | Vercel WAF rate limiting, Bot Protection, AI Bot deny |
| **Function timeout** | 300s (Cloud Run) | 60s (Vercel Pro) — sufficient for LLM calls |

## 6) What Stays on GCP (Unchanged)

- **Firestore** — sessions, rate limits, spend tracking, resume index, submissions.
- **Vertex AI** — Gemini LLM calls for all three tools.
- **GCS** — resume storage (public + private buckets).
- **reCAPTCHA** — bot verification gate.
- **GCP Billing Budget** — $20/month email alerts at 50/90/100% thresholds.

## 7) What Gets Dropped (No Replacement Needed)

- `web/Dockerfile`
- `web/.dockerignore`
- `cloudbuild.yaml`
- Artifact Registry repository (`us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3`)
- Cloud Run service (`samkirk-v3`)
- Cloud Run service account (`samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com`)
- Secret Manager secrets (migrated to Vercel env vars)
- GitHub Actions production deploy workflow (if any; Vercel replaces it)

## 8) Authentication Change

This is the only architectural change. Currently, Vertex AI, Firestore, and Cloud Storage authenticate via **Application Default Credentials (ADC)** — the Cloud Run service account is automatically injected into the container environment. On Vercel, there is no GCP service account context.

### Solution

Create a GCP service account key (JSON) and store it as a single Vercel environment variable (`GOOGLE_APPLICATION_CREDENTIALS_JSON`). Write a shared credential helper (~10 lines) that:

1. Parses the JSON env var when present (Vercel production/preview).
2. Falls back to ADC when absent (local dev with `gcloud auth application-default login`).
3. Passes the parsed credentials explicitly to the `Firestore`, `VertexAI`, and `Storage` constructors.

### Files That Need Credential Changes

| File | Current Auth | Change Needed |
|------|-------------|---------------|
| `web/src/lib/firestore.ts` | `new Firestore({ projectId })` — implicit ADC | Pass `credentials` from parsed JSON env var |
| `web/src/lib/vertex-ai.ts` | `new VertexAI({ project, location })` — implicit ADC | Pass `googleAuthOptions.credentials` from parsed JSON env var |
| `web/src/lib/storage.ts` | `new Storage({ projectId })` — implicit ADC | Pass `credentials` from parsed JSON env var |
| `web/src/lib/env.ts` | No credential env var in schema | Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` (optional in dev, required in prod) |

### Service Account Permissions

One service account with these roles (same as current Cloud Run SA):

| Role | Purpose |
|------|---------|
| `roles/datastore.user` | Firestore read/write |
| `roles/aiplatform.user` | Vertex AI API calls |
| `roles/storage.objectViewer` | GCS read (public bucket) |
| `roles/storage.objectAdmin` | GCS read/write (private bucket) |

## 9) Environment Variables on Vercel

All 12 values, set in the Vercel dashboard:

| Variable | Value/Source | Sensitive? |
|----------|-------------|------------|
| `GCP_PROJECT_ID` | `samkirk-v3` | No |
| `GCS_PUBLIC_BUCKET` | `samkirk-v3-public` | No |
| `GCS_PRIVATE_BUCKET` | `samkirk-v3-private` | No |
| `VERTEX_AI_LOCATION` | `us-central1` | No |
| `VERTEX_AI_MODEL` | `gemini-2.0-flash` | No |
| `RECAPTCHA_SITE_KEY` | From Secret Manager | Yes |
| `RECAPTCHA_SECRET_KEY` | From Secret Manager | Yes |
| `GOOGLE_OAUTH_CLIENT_ID` | From Secret Manager | Yes |
| `GOOGLE_OAUTH_CLIENT_SECRET` | From Secret Manager | Yes |
| `AUTH_SECRET` | From Secret Manager | Yes |
| `ADMIN_ALLOWED_EMAIL` | From Secret Manager | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | New service account key JSON | Yes |

The reCAPTCHA site key also needs to be available at build time as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (currently injected via Docker build arg).

## 10) Next.js Configuration Changes

- **Remove** `output: "standalone"` from `next.config.ts` — Vercel doesn't need standalone output and handles deployment natively.
- **Keep** the `www` → apex domain redirect (Vercel supports Next.js redirects natively).
- **Add** `vercel.json` for function timeout configuration:

```json
{
  "functions": {
    "app/api/tools/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

## 11) Vercel Security Configuration

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

## 12) DNS & Domain

- Point `samkirk.com` DNS records to Vercel.
- Configure the custom domain in Vercel project settings.
- Vercel provides automatic SSL/TLS certificates.

## 13) CI/CD Changes

- The existing `.github/workflows/ci.yml` (lint/test) remains unchanged.
- Remove any production deploy workflow that targets Cloud Run.
- Vercel's GitHub integration handles deployment automatically on push to `main`.

## 14) Preserved App-Level Security Stack

The entire application security stack is untouched — it's all application code, not infrastructure:

- **Session management** (`session.ts`) — cookie-based, Firestore-backed
- **CAPTCHA gate** (`captcha.ts`, `ReCaptcha.tsx`) — reCAPTCHA v2
- **Rate limiting** (`rate-limit.ts`) — 10 req / 10 min, Firestore-backed
- **Spend cap** (`spend-cap.ts`) — $20/month hard stop, Firestore-backed
- **`withToolProtection()` wrapper** (`tool-protection.ts`) — centralized 4-check enforcement
- **Cost estimation and tracking** — all Firestore-based, portable

## 15) Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| GCP auth fails on Vercel (Firestore, Vertex AI, GCS) | High | Test credential helper locally with explicit JSON before deploying |
| Signed URL generation fails | Medium | `getSignedUrl()` requires service account key (not ADC) — key-based auth resolves this |
| Function timeout too short for LLM calls | N/A | Pro plan provides 60s; current calls take 10–30s |
| Cold start latency | Low | Vercel edge network handles this well for Next.js |
| OAuth callback URL mismatch | Medium | Update Google OAuth authorized redirect URIs to Vercel URL |
| DNS propagation delay | Low | TTL management; test with Vercel preview URL first |

## 16) Rollback Plan

The Cloud Run service and all GCP infrastructure remain intact until the migration is verified:

1. Deploy to Vercel and test with preview URL.
2. Cut DNS to Vercel only after all tools pass E2E tests.
3. If issues arise, revert DNS to Cloud Run.
4. Only tear down Cloud Run/Artifact Registry/Secret Manager after stable period (~1 week).

## 17) Success Criteria

- All pages render correctly on Vercel (visual spot check).
- All three LLM tools work end-to-end (fit, resume, interview).
- Admin login and upload flows work.
- reCAPTCHA verification works.
- Rate limiting and spend cap enforcement work.
- Vercel WAF rules are active (rate limit on `/api/tools/*`, bot protection, AI bot deny).
- `samkirk.com` resolves to Vercel with valid SSL.
- Existing unit and E2E tests pass against Vercel deployment.
