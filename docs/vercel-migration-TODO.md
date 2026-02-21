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

- [x] **[Codex/Opus] [AI]** Create `web/src/lib/gcp-credentials.ts` — shared function that parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` or returns `undefined` for ADC fallback
- [x] **[Codex/Opus] [AI]** Write unit tests in `web/src/lib/gcp-credentials.test.ts` (valid JSON, missing env var, malformed JSON, missing required fields)
- [x] **[Codex/Opus] [AI]** TEST: Run `npm test -- gcp-credentials` — all pass

### 1.2 Update env.ts schema

- [x] **[Codex/Opus] [AI]** Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` as `z.string().optional()` to Zod schema in `web/src/lib/env.ts`
- [x] **[Codex/Opus] [AI]** Update `web/src/lib/env.test.ts` — add tests for schema with/without the new optional field
- [x] **[Codex/Opus] [AI]** TEST: Run `npm test -- env` — all pass

### 1.3 Wire credentials into GCP SDK singletons

- [x] **[Codex/Opus] [AI]** Update `web/src/lib/firestore.ts` — import `getGcpCredentials`, pass `credentials` to `new Firestore()` when defined
- [x] **[Codex/Opus] [AI]** Update `web/src/lib/storage.ts` — same pattern for `new Storage()`
- [x] **[Codex/Opus] [AI]** Update `web/src/lib/vertex-ai.ts` — pass `googleAuthOptions: { credentials }` to `new VertexAI()` when defined
- [x] **[Codex/Opus] [AI]** TEST: Run `npm test` (full suite) — all pass, no regressions
- [x] **[Codex/Opus] [AI]** TEST: Run `npm run dev` — verify local dev still works with ADC

### 1.4 Local validation with explicit credentials

- [x] **[Sam]** Create GCP service account key: `gcloud iam service-accounts keys create /tmp/sa-key.json --iam-account=samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com`
- [x] **[Sam]** Set `GOOGLE_APPLICATION_CREDENTIALS_JSON=$(cat /tmp/sa-key.json)` and run `npm run dev`
- [x] **[Sam]** Smoke test: visit a tool page, verify Firestore + Vertex AI + GCS work with explicit credentials
- [x] **[Sam]** Unset env var, run `npm run dev` again, verify ADC fallback still works
- [x] **[Sam]** Delete the local key file: `rm /tmp/sa-key.json`

---

## Phase 2 — Next.js Configuration for Vercel

### 2.1 Update next.config.ts

- [x] **[Codex/Opus] [AI]** Remove `output: "standalone"` from `web/next.config.ts`
- [x] **[Codex/Opus] [AI]** Update comment (remove Docker reference)
- [x] **[Codex/Opus] [AI]** TEST: Run `npm run build` — build succeeds
- [x] **[Codex/Opus] [AI]** TEST: Run `npm run dev` — dev server works

### 2.2 Create vercel.json

- [x] **[Codex/Opus] [AI]** Create `web/vercel.json` with `maxDuration: 60` for `app/api/tools/**/*.ts`

### 2.3 Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY

- [x] **[Sonnet 4] [AI]** Verify how `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is used in the codebase (search for references)
- [x] **[Sonnet 4] [AI]** Document: on Vercel, set as `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` env var in dashboard (auto-available at build time)

---

## Phase 3 — Vercel Project Setup (Dashboard + Git Integration)

### 3.1 Create Vercel project and connect repository

- [x] **[Sam]** Create new project in Vercel dashboard
- [x] **[Sam]** Import samkirk-v3 GitHub repository
- [x] **[Sam]** Set Root Directory to `web`
- [x] **[Sam]** Framework Preset: Next.js
- [x] **[Sam]** Do NOT deploy yet (env vars needed first)

### 3.2 Configure environment variables in Vercel

- [x] **[Sam]** Retrieve all secret values from GCP Secret Manager (6 secrets)
- [x] **[Sam]** Add all 13 env vars to Vercel dashboard (5 plain text + 7 sensitive + 1 NEXT_PUBLIC)
- [x] **[Sam]** Double-check: `GOOGLE_APPLICATION_CREDENTIALS_JSON` is the full JSON blob (not a file path)

### 3.3 Create service account key for Vercel

- [x] **[Sam]** Decide: reuse existing Cloud Run SA or create dedicated `samkirk-v3-vercel` SA
- [x] **[Sam]** If new SA: create it and grant 4 IAM roles (datastore.user, aiplatform.user, storage.objectViewer, storage.objectAdmin)
- [x] **[Sam]** Generate key JSON and paste into Vercel as `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- [x] **[Sam]** Delete local key file after pasting

---

## Phase 4 — Deploy and Verify on Vercel Preview

### 4.1 Trigger first Vercel deployment

- [x] **[Sam]** Push code changes from Phases 1–2 to main (or feature branch)
- [x] **[Sam]** Watch Vercel build logs — confirm successful build, no env errors

### 4.2 Smoke test on Vercel preview URL

- [x] **[Sam]** Homepage loads correctly
- [x] **[Sam]** All navigation pages render
- [x] **[Sam]** reCAPTCHA widget appears on tool pages
- [x] **[Sam]** Complete reCAPTCHA → submit test job to "How Do I Fit?" → verify LLM response
- [x] **[Sam]** Test "Get a Custom Resume" tool
- [x] **[Sam]** Test "Interview Me Now" tool
- [x] **[Sam]** Admin: Google OAuth login works
- [x] **[Sam]** Admin: resume upload works
- [x] **[Sam]** Download an artifact bundle

### 4.3 Update Google OAuth redirect URIs

- [x] **[Sam]** Add Vercel preview URL to OAuth authorized redirect URIs in Google Cloud Console
- [x] **[Sam]** Add `https://samkirk.com/api/auth/callback/google` for production
- [x] **[Sonnet 4] [AI]** Check codebase for hardcoded `NEXTAUTH_URL` — Vercel auto-sets this

### 4.4 Run E2E tests against Vercel preview

- [x] **[Gemini 3 Pro] [AI]** Run Playwright E2E tests with `PLAYWRIGHT_BASE_URL` set to Vercel preview URL
- [x] **[Gemini 3 Pro] [AI]** Fix any E2E failures specific to Vercel deployment

---

## Phase 5 — Vercel Security Configuration

### 5.1 Configure WAF rate limiting

- [x] **[Sam]** Add WAF rule in Vercel: rate limit `/api/tools/*` — 20 req/60s per IP

### 5.2 Configure bot protection

- [x] **[Sam]** Enable Bot Protection: Challenge (JS challenge for non-browser traffic)
- [x] **[Sam]** Enable AI Bot blocking: Deny (GPTBot, ClaudeBot, PerplexityBot, etc.)

---

## Phase 6 — DNS Cutover and Domain Configuration

### 6.1 Add custom domain to Vercel

- [x] **[Sam]** Add `samkirk.com` and `www.samkirk.com` to Vercel project domains

### 6.2 Update DNS records

- [x] **[Sam]** Update DNS A/CNAME records per Vercel instructions
- [x] **[Sam]** Wait for DNS propagation
- [x] **[Sam]** Verify SSL certificate auto-provisioned by Vercel

### 6.3 Final production validation

- [x] **[Sam]** Verify `https://samkirk.com` loads with valid SSL
- [x] **[Sam]** Verify `https://www.samkirk.com` redirects to apex
- [x] **[Gemini 3 Pro] [AI]** Run full E2E suite against production URL
- [x] **[Sam]** Test all three LLM tools end-to-end on production
- [x] **[Sam]** Test admin OAuth login + uploads on production
- [x] **[Sam]** Verify Vercel WAF rules are active in Firewall logs

---

## Phase 7 — Cleanup Old Infrastructure

> Only proceed after Vercel has been stable in production for at least 1 week.

### 7.1 Remove Cloud Run and build infrastructure

- [x] **[Sam]** Delete Cloud Run service: `gcloud run services delete samkirk-v3 --region=us-central1`
- [x] **[Sam]** Delete Artifact Registry images and repository
- [x] **[Sam]** Delete Secret Manager secrets (after confirming all values are in Vercel)
- [x] **[Sam]** Optionally: remove old Cloud Run service account (if using dedicated Vercel SA)

### 7.2 Remove Docker and Cloud Build files from repo

- [x] **[Codex/Opus] [AI]** Delete `web/Dockerfile`
- [x] **[Codex/Opus] [AI]** Delete `web/.dockerignore`
- [x] **[Codex/Opus] [AI]** Delete `cloudbuild.yaml`
- [x] **[Codex/Opus] [AI]** Remove any Cloud Run deploy workflow from `.github/workflows/`
- [x] **[Sonnet 4] [AI]** TEST: Run `npm test` and `npm run build` — all still pass

### 7.3 Update CLAUDE.md and project docs

- [x] **[Sonnet 4] [AI]** Update CLAUDE.md — hosting: Vercel Pro, deploy: auto on push, secrets: Vercel env vars
- [x] **[Sonnet 4] [AI]** Update README.md — deployment section references Vercel instead of Cloud Run
- [x] **[Sonnet 4] [AI]** Commit all cleanup changes

---

## Summary

| Phase | Steps | Owner | Description |
|-------|-------|-------|-------------|
| 1. Credential Plumbing | 1.1–1.4 | AI + Sam | Code changes for explicit GCP auth |
| 2. Next.js Config | 2.1–2.3 | AI | Remove Docker config, add Vercel config |
| 3. Vercel Setup | 3.1–3.3 | Sam | Dashboard: project, env vars, SA key |
| 4. Deploy & Verify | 4.1–4.4 | Sam + AI | First deploy, smoke test, E2E |
| 5. Security | 5.1–5.2 | Sam | WAF rules, bot protection |
| 6. DNS Cutover | 6.1–6.3 | Sam + AI | Custom domain, DNS, production validation |
| 7. Cleanup | 7.1–7.3 | Sam + AI | Remove old infrastructure + update docs |
