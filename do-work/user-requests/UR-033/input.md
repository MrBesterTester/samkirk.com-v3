---
id: UR-033
title: "Ingest: vercel-migration TODO (22 steps)"
created_at: 2026-02-16T12:00:00-08:00
requests: [REQ-103, REQ-104, REQ-105, REQ-106, REQ-107, REQ-108, REQ-109, REQ-110, REQ-111, REQ-112, REQ-113, REQ-114, REQ-115, REQ-116, REQ-117, REQ-118, REQ-119, REQ-120, REQ-121, REQ-122, REQ-123, REQ-124]
word_count: 1842
---

# Ingest: vercel-migration TODO

## Summary
Ingested 22 unchecked steps from docs/vercel-migration-TODO.md into do-work REQ files.
Document set: vercel-migration-SPECIFICATION.md, vercel-migration-BLUEPRINT.md, vercel-migration-TODO.md.

## Extracted Requests

| ID | Step | Title | Model Hint | Owner |
|----|------|-------|------------|-------|
| REQ-103 | 1.1 | Create GCP credential helper | Codex/Opus | AI |
| REQ-104 | 1.2 | Update env.ts schema | Codex/Opus | AI |
| REQ-105 | 1.3 | Wire credentials into GCP SDK singletons | Codex/Opus | AI |
| REQ-106 | 1.4 | Local validation with explicit credentials | Codex/Opus | Sam |
| REQ-107 | 2.1 | Update next.config.ts | Codex/Opus | AI |
| REQ-108 | 2.2 | Create vercel.json | Codex/Opus | AI |
| REQ-109 | 2.3 | Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY | Sonnet 4 | AI |
| REQ-110 | 3.1 | Create Vercel project and connect repository | — | Sam |
| REQ-111 | 3.2 | Configure environment variables in Vercel | — | Sam |
| REQ-112 | 3.3 | Create service account key for Vercel | — | Sam |
| REQ-113 | 4.1 | Trigger first Vercel deployment | — | Sam |
| REQ-114 | 4.2 | Smoke test on Vercel preview URL | — | Sam |
| REQ-115 | 4.3 | Update Google OAuth redirect URIs | Sonnet 4 | Sam + AI |
| REQ-116 | 4.4 | Run E2E tests against Vercel preview | Gemini 3 Pro | AI |
| REQ-117 | 5.1 | Configure WAF rate limiting | — | Sam |
| REQ-118 | 5.2 | Configure bot protection | — | Sam |
| REQ-119 | 6.1 | Add custom domain to Vercel | — | Sam |
| REQ-120 | 6.2 | Update DNS records | — | Sam |
| REQ-121 | 6.3 | Final production validation | Gemini 3 Pro | Sam + AI |
| REQ-122 | 7.1 | Remove Cloud Run and build infrastructure | — | Sam |
| REQ-123 | 7.2 | Remove Docker and Cloud Build files from repo | Codex/Opus | AI |
| REQ-124 | 7.3 | Update CLAUDE.md and project docs | Sonnet 4 | AI |

## Full Verbatim Input

# Vercel Hosting Migration — TODO

> Generated from `docs/vercel-migration-BLUEPRINT.md` per the Dylan Davis methodology.
>
> **Model labels** follow the heuristics:
> - **[Codex/Opus]** — Backend logic, APIs, credential plumbing
> - **[Opus 4.5]** — Config/architecture decisions
> - **[Sonnet 4]** — Quick fixes, minor tweaks
> - **[Gemini 3 Pro]** — Visual testing, E2E debugging
>
> **Owner tags:**
> - **[AI]** — Work the assistant can do in the IDE
> - **[Sam]** — Requires Sam to perform an action (dashboard, GCP console, DNS)

---

## Phase 1 — GCP Credential Plumbing (Code Changes)

### 1.1 Create GCP credential helper

- [ ] **[Codex/Opus] [AI]** Create `web/src/lib/gcp-credentials.ts` — shared function that parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` or returns `undefined` for ADC fallback
- [ ] **[Codex/Opus] [AI]** Write unit tests in `web/src/lib/gcp-credentials.test.ts` (valid JSON, missing env var, malformed JSON, missing required fields)
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm test -- gcp-credentials` — all pass

### 1.2 Update env.ts schema

- [ ] **[Codex/Opus] [AI]** Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` as `z.string().optional()` to Zod schema in `web/src/lib/env.ts`
- [ ] **[Codex/Opus] [AI]** Update `web/src/lib/env.test.ts` — add tests for schema with/without the new optional field
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm test -- env` — all pass

### 1.3 Wire credentials into GCP SDK singletons

- [ ] **[Codex/Opus] [AI]** Update `web/src/lib/firestore.ts` — import `getGcpCredentials`, pass `credentials` to `new Firestore()` when defined
- [ ] **[Codex/Opus] [AI]** Update `web/src/lib/storage.ts` — same pattern for `new Storage()`
- [ ] **[Codex/Opus] [AI]** Update `web/src/lib/vertex-ai.ts` — pass `googleAuthOptions: { credentials }` to `new VertexAI()` when defined
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm test` (full suite) — all pass, no regressions
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm run dev` — verify local dev still works with ADC

### 1.4 Local validation with explicit credentials

- [ ] **[Sam]** Create GCP service account key: `gcloud iam service-accounts keys create /tmp/sa-key.json --iam-account=samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com`
- [ ] **[Sam]** Set `GOOGLE_APPLICATION_CREDENTIALS_JSON=$(cat /tmp/sa-key.json)` and run `npm run dev`
- [ ] **[Sam]** Smoke test: visit a tool page, verify Firestore + Vertex AI + GCS work with explicit credentials
- [ ] **[Sam]** Unset env var, run `npm run dev` again, verify ADC fallback still works
- [ ] **[Sam]** Delete the local key file: `rm /tmp/sa-key.json`

---

## Phase 2 — Next.js Configuration for Vercel

### 2.1 Update next.config.ts

- [ ] **[Codex/Opus] [AI]** Remove `output: "standalone"` from `web/next.config.ts`
- [ ] **[Codex/Opus] [AI]** Update comment (remove Docker reference)
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm run build` — build succeeds
- [ ] **[Codex/Opus] [AI]** TEST: Run `npm run dev` — dev server works

### 2.2 Create vercel.json

- [ ] **[Codex/Opus] [AI]** Create `web/vercel.json` with `maxDuration: 60` for `app/api/tools/**/*.ts`

### 2.3 Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY

- [ ] **[Sonnet 4] [AI]** Verify how `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is used in the codebase (search for references)
- [ ] **[Sonnet 4] [AI]** Document: on Vercel, set as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` env var in dashboard (auto-available at build time)

---

## Phase 3 — Vercel Project Setup (Dashboard + Git Integration)

### 3.1 Create Vercel project and connect repository

- [ ] **[Sam]** Create new project in Vercel dashboard
- [ ] **[Sam]** Import samkirk-v3 GitHub repository
- [ ] **[Sam]** Set Root Directory to `web`
- [ ] **[Sam]** Framework Preset: Next.js
- [ ] **[Sam]** Do NOT deploy yet (env vars needed first)

### 3.2 Configure environment variables in Vercel

- [ ] **[Sam]** Retrieve all secret values from GCP Secret Manager (6 secrets)
- [ ] **[Sam]** Add all 13 env vars to Vercel dashboard (5 plain text + 7 sensitive + 1 NEXT_PUBLIC)
- [ ] **[Sam]** Double-check: `GOOGLE_APPLICATION_CREDENTIALS_JSON` is the full JSON blob (not a file path)

### 3.3 Create service account key for Vercel

- [ ] **[Sam]** Decide: reuse existing Cloud Run SA or create dedicated `samkirk-v3-vercel` SA
- [ ] **[Sam]** If new SA: create it and grant 4 IAM roles (datastore.user, aiplatform.user, storage.objectViewer, storage.objectAdmin)
- [ ] **[Sam]** Generate key JSON and paste into Vercel as `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- [ ] **[Sam]** Delete local key file after pasting

---

## Phase 4 — Deploy and Verify on Vercel Preview

### 4.1 Trigger first Vercel deployment

- [ ] **[Sam]** Push code changes from Phases 1–2 to main (or feature branch)
- [ ] **[Sam]** Watch Vercel build logs — confirm successful build, no env errors

### 4.2 Smoke test on Vercel preview URL

- [ ] **[Sam]** Homepage loads correctly
- [ ] **[Sam]** All navigation pages render
- [ ] **[Sam]** reCAPTCHA widget appears on tool pages
- [ ] **[Sam]** Complete reCAPTCHA → submit test job to "How Do I Fit?" → verify LLM response
- [ ] **[Sam]** Test "Get a Custom Resume" tool
- [ ] **[Sam]** Test "Interview Me Now" tool
- [ ] **[Sam]** Admin: Google OAuth login works
- [ ] **[Sam]** Admin: resume upload works
- [ ] **[Sam]** Download an artifact bundle

### 4.3 Update Google OAuth redirect URIs

- [ ] **[Sam]** Add Vercel preview URL to OAuth authorized redirect URIs in Google Cloud Console
- [ ] **[Sam]** Add `https://samkirk.com/api/auth/callback/google` for production
- [ ] **[Sonnet 4] [AI]** Check codebase for hardcoded `NEXTAUTH_URL` — Vercel auto-sets this

### 4.4 Run E2E tests against Vercel preview

- [ ] **[Gemini 3 Pro] [AI]** Run Playwright E2E tests with `PLAYWRIGHT_BASE_URL` set to Vercel preview URL
- [ ] **[Gemini 3 Pro] [AI]** Fix any E2E failures specific to Vercel deployment

---

## Phase 5 — Vercel Security Configuration

### 5.1 Configure WAF rate limiting

- [ ] **[Sam]** Add WAF rule in Vercel: rate limit `/api/tools/*` — 20 req/60s per IP

### 5.2 Configure bot protection

- [ ] **[Sam]** Enable Bot Protection: Challenge (JS challenge for non-browser traffic)
- [ ] **[Sam]** Enable AI Bot blocking: Deny (GPTBot, ClaudeBot, PerplexityBot, etc.)

---

## Phase 6 — DNS Cutover and Domain Configuration

### 6.1 Add custom domain to Vercel

- [ ] **[Sam]** Add `samkirk.com` and `www.samkirk.com` to Vercel project domains

### 6.2 Update DNS records

- [ ] **[Sam]** Update DNS A/CNAME records per Vercel instructions
- [ ] **[Sam]** Wait for DNS propagation
- [ ] **[Sam]** Verify SSL certificate auto-provisioned by Vercel

### 6.3 Final production validation

- [ ] **[Sam]** Verify `https://samkirk.com` loads with valid SSL
- [ ] **[Sam]** Verify `https://www.samkirk.com` redirects to apex
- [ ] **[Gemini 3 Pro] [AI]** Run full E2E suite against production URL
- [ ] **[Sam]** Test all three LLM tools end-to-end on production
- [ ] **[Sam]** Test admin OAuth login + uploads on production
- [ ] **[Sam]** Verify Vercel WAF rules are active in Firewall logs

---

## Phase 7 — Cleanup Old Infrastructure

> Only proceed after Vercel has been stable in production for at least 1 week.

### 7.1 Remove Cloud Run and build infrastructure

- [ ] **[Sam]** Delete Cloud Run service: `gcloud run services delete samkirk-v3 --region=us-central1`
- [ ] **[Sam]** Delete Artifact Registry images and repository
- [ ] **[Sam]** Delete Secret Manager secrets (after confirming all values are in Vercel)
- [ ] **[Sam]** Optionally: remove old Cloud Run service account (if using dedicated Vercel SA)

### 7.2 Remove Docker and Cloud Build files from repo

- [ ] **[Codex/Opus] [AI]** Delete `web/Dockerfile`
- [ ] **[Codex/Opus] [AI]** Delete `web/.dockerignore`
- [ ] **[Codex/Opus] [AI]** Delete `cloudbuild.yaml`
- [ ] **[Codex/Opus] [AI]** Remove any Cloud Run deploy workflow from `.github/workflows/`
- [ ] **[Sonnet 4] [AI]** TEST: Run `npm test` and `npm run build` — all still pass

### 7.3 Update CLAUDE.md and project docs

- [ ] **[Sonnet 4] [AI]** Update CLAUDE.md — hosting: Vercel Pro, deploy: auto on push, secrets: Vercel env vars
- [ ] **[Sonnet 4] [AI]** Update README.md — deployment section references Vercel instead of Cloud Run
- [ ] **[Sonnet 4] [AI]** Commit all cleanup changes

---

*Captured: 2026-02-16T12:00:00-08:00*
