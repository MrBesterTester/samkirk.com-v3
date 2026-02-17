# Vercel Hosting Migration — Blueprint

This document is the "how" plan for implementing `docs/vercel-migration-SPECIFICATION.md`. It breaks the migration into small, testable steps with embedded prompts for a code-generation LLM.

> **Methodology note:** Per `docs/Dylan-Davis-50plus-method.md`, the recommended model for Blueprint/Architecture work is **Claude Opus 4.5**.

## Guiding Principles

- **Incremental & reversible**: Each step can be tested independently. Cloud Run stays running until Vercel is fully verified.
- **Local dev unaffected**: ADC fallback ensures `npm run dev` works without a service account key.
- **Test before cutting DNS**: Use Vercel preview deployments to validate everything before touching the live domain.
- **Minimal code changes**: Only touch auth plumbing + config. No application logic changes.

## Current Codebase Reality (Starting Point)

- Next.js (App Router) lives in `web/`.
- Three GCP SDK singletons use implicit ADC: `firestore.ts`, `vertex-ai.ts`, `storage.ts`.
- `env.ts` validates 11 required env vars via Zod schema.
- `next.config.ts` has `output: "standalone"` for Docker deployment.
- `Dockerfile` + `cloudbuild.yaml` define the current build/deploy pipeline.
- `reCAPTCHA` site key is injected as a Docker build arg (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`).
- Unit tests via Vitest, E2E tests via Playwright.

---

## Phase 1 — GCP Credential Plumbing (Code Changes)

This phase makes the app work with explicit service account credentials while preserving local dev ADC behavior.

### Step 1.1: Create GCP credential helper

Create a shared utility that parses `GOOGLE_APPLICATION_CREDENTIALS_JSON` when present and returns typed credentials, or returns `undefined` to fall back to ADC.

```
Read web/src/lib/env.ts to understand the current Zod schema.

Create web/src/lib/gcp-credentials.ts:
- Export a function `getGcpCredentials()` that:
  1. Reads `process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON`
  2. If set: parses the JSON string, validates it has `client_email` and `private_key` fields, and returns the parsed object typed as `{ client_email: string; private_key: string; [key: string]: unknown }`
  3. If not set: returns `undefined` (signals ADC fallback)
- Add `import "server-only"` at the top
- Cache the result in a module-level variable (same singleton pattern as other lib files)
- Keep it under 20 lines

Write a unit test in web/src/lib/gcp-credentials.test.ts:
- Test: returns parsed credentials when env var is set with valid JSON
- Test: returns undefined when env var is not set
- Test: throws descriptive error when env var is set but JSON is malformed
- Test: throws when JSON is valid but missing required fields (client_email, private_key)

Run: npm test -- gcp-credentials
```

### Step 1.2: Update env.ts schema

Add the new credential env var to the Zod schema as optional (required in production, absent in local dev).

```
Read web/src/lib/env.ts.

Add GOOGLE_APPLICATION_CREDENTIALS_JSON to the Zod schema:
- Type: z.string().optional()
- It should NOT be .min(1) — it's legitimately absent in local dev
- Do NOT change any existing env vars

Update existing env.test.ts if it validates the schema:
- Ensure tests still pass with the new optional field
- Add a test that the schema accepts a valid env with GOOGLE_APPLICATION_CREDENTIALS_JSON present
- Add a test that the schema accepts a valid env without GOOGLE_APPLICATION_CREDENTIALS_JSON

Run: npm test -- env
```

### Step 1.3: Wire credentials into Firestore, Vertex AI, and Storage singletons

Update the three GCP SDK singleton constructors to pass explicit credentials when available.

```
Read web/src/lib/gcp-credentials.ts (just created in 1.1).
Read web/src/lib/firestore.ts, web/src/lib/vertex-ai.ts, web/src/lib/storage.ts.

Update web/src/lib/firestore.ts:
- Import getGcpCredentials from ./gcp-credentials
- In getFirestore(), call getGcpCredentials()
- If credentials are defined, pass them: new Firestore({ projectId, credentials })
- If undefined, keep current behavior: new Firestore({ projectId }) — ADC kicks in

Update web/src/lib/storage.ts:
- Same pattern: import getGcpCredentials, pass credentials to new Storage({ projectId, credentials }) when defined

Update web/src/lib/vertex-ai.ts:
- Import getGcpCredentials
- In getVertexAI(), call getGcpCredentials()
- If credentials are defined, pass: new VertexAI({ project, location, googleAuthOptions: { credentials } })
- If undefined, keep current behavior: new VertexAI({ project, location })

IMPORTANT: Do not change any other logic in these files. Only the constructor calls change.

Run: npm test (full suite — ensure nothing breaks)
Run: npm run dev (verify local dev still works with ADC)
```

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

---

## Phase 2 — Next.js Configuration for Vercel

### Step 2.1: Update next.config.ts

Remove Docker-specific config and prepare for Vercel deployment.

```
Read web/next.config.ts.

Update web/next.config.ts:
- REMOVE the `output: "standalone"` line (Vercel handles deployment natively; standalone is Docker-only)
- KEEP the `devIndicators: false` setting
- KEEP the www → apex redirect (Vercel supports Next.js redirects natively)
- Update the comment from "Enable standalone output for Docker deployment" to remove Docker reference

The file should look like:
  const nextConfig: NextConfig = {
    devIndicators: false,
    async redirects() { ... same as before ... },
  };

Run: npm run build (verify build succeeds without standalone output)
Run: npm run dev (verify dev server still works)
```

### Step 2.2: Create vercel.json

Configure function timeouts for LLM tool routes.

```
Create web/vercel.json (in the web/ directory, next to package.json):

{
  "functions": {
    "app/api/tools/**/*.ts": {
      "maxDuration": 60
    }
  }
}

This sets a 60-second timeout for all tool API routes (fit, resume, interview) where LLM calls happen. All other routes use the default timeout.

No test needed — this is validated during Vercel deployment.
```

### Step 2.3: Handle NEXT_PUBLIC_RECAPTCHA_SITE_KEY for Vercel builds

Currently, the reCAPTCHA site key is injected as a Docker build arg. On Vercel, it needs to be a `NEXT_PUBLIC_` env var available at build time.

```
Check how NEXT_PUBLIC_RECAPTCHA_SITE_KEY is currently used in the codebase:
- Search for NEXT_PUBLIC_RECAPTCHA_SITE_KEY in web/src/

On Vercel, NEXT_PUBLIC_ env vars set in the dashboard are automatically available at build time. No code changes needed — just ensure it's set in the Vercel dashboard as NEXT_PUBLIC_RECAPTCHA_SITE_KEY.

Document this in the Vercel env var setup step (Phase 4).
```

---

## Phase 3 — Vercel Project Setup (Dashboard + Git Integration)

### Step 3.1: Create Vercel project and connect repository

```
Manual step (Sam in Vercel dashboard):

1. Go to vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import the samkirk-v3 GitHub repository
4. Set the Root Directory to "web" (since Next.js lives in web/)
5. Framework Preset: Next.js (should be auto-detected)
6. Do NOT deploy yet — we need env vars first
7. Note the project URL (e.g., samkirk-v3.vercel.app)
```

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

---

## Phase 4 — Deploy and Verify on Vercel Preview

### Step 4.1: Trigger first Vercel deployment

```
Push the code changes from Phases 1–2 to the main branch (or a feature branch).

If Vercel GitHub integration is connected, it will auto-deploy.
Otherwise, manually trigger from the Vercel dashboard.

Watch the build logs for:
- Successful Next.js build
- No env var errors (the Zod schema validation runs at build time for server components)
- No import errors

Note the preview URL from the deployment.
```

### Step 4.2: Smoke test on Vercel preview URL

```
Manual testing against the Vercel preview URL:

1. Homepage loads correctly
2. Navigation works (all pages render)
3. Static pages load (explorations, song dedication)
4. reCAPTCHA widget appears on tool pages
5. Complete reCAPTCHA verification
6. Submit a test job URL to "How Do I Fit?" — verify LLM response
7. Test "Get a Custom Resume" tool
8. Test "Interview Me Now" tool
9. Admin login via Google OAuth (may need to add Vercel URL to OAuth authorized redirect URIs)
10. Admin: verify resume upload works
11. Download an artifact bundle
12. Check Dance Menu page loads

Track which tests pass/fail. Fix any issues before proceeding.
```

### Step 4.3: Update Google OAuth redirect URIs

```
Manual step (Sam in Google Cloud Console):

1. Go to APIs & Services → Credentials
2. Find the OAuth 2.0 Client ID used by the app
3. Add the Vercel preview URL to Authorized redirect URIs:
   - https://samkirk-v3.vercel.app/api/auth/callback/google
   - https://samkirk.com/api/auth/callback/google (for production)
4. Save

Also update NEXTAUTH_URL if it's hardcoded anywhere:
- Search the codebase for NEXTAUTH_URL
- On Vercel, NEXTAUTH_URL is auto-set by Vercel for production deployments
- For preview deployments, it uses VERCEL_URL automatically
```

### Step 4.4: Run E2E tests against Vercel preview

```
Run the existing E2E test suite against the Vercel preview URL:

  PLAYWRIGHT_BASE_URL=https://samkirk-v3.vercel.app npx playwright test

If tests reference localhost:3000, update the Playwright config to support an env override for the base URL.

Fix any failures before proceeding to DNS cutover.
```

---

## Phase 5 — Vercel Security Configuration

### Step 5.1: Configure WAF rate limiting

```
Manual step (Sam in Vercel dashboard):

1. Go to Project → Settings → Firewall
2. Add rule:
   - Name: "Rate limit tool API routes"
   - Path: /api/tools/*
   - Rate limit: 20 requests per 60 seconds per IP
   - Action: Block (with 429 response)
3. Enable the rule
```

### Step 5.2: Configure bot protection

```
Manual step (Sam in Vercel dashboard):

1. Go to Project → Settings → Firewall
2. Enable Bot Protection:
   - Action: Challenge (JS challenge for non-browser traffic)
3. Enable AI Bot blocking:
   - Action: Deny
   - This blocks: GPTBot, ClaudeBot, PerplexityBot, Bytespider, etc.
```

---

## Phase 6 — DNS Cutover and Domain Configuration

### Step 6.1: Add custom domain to Vercel

```
Manual step (Sam in Vercel dashboard):

1. Go to Project → Settings → Domains
2. Add "samkirk.com"
3. Vercel will provide DNS records to configure
4. Also add "www.samkirk.com" (Vercel will auto-redirect to apex via Next.js config)
```

### Step 6.2: Update DNS records

```
Manual step (Sam at domain registrar):

1. Update DNS A/CNAME records per Vercel's instructions
2. Typical setup:
   - A record: samkirk.com → 76.76.21.21 (Vercel IP)
   - CNAME: www.samkirk.com → cname.vercel-dns.com
3. Wait for DNS propagation (can take up to 48h, usually minutes)
4. Vercel auto-provisions SSL certificate once DNS resolves
```

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

---

## Phase 7 — Cleanup Old Infrastructure

Only proceed after Vercel has been stable in production for at least a few days.

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

### Step 7.2: Remove Docker and Cloud Build files from repo

```
Delete these files from the repository:
- web/Dockerfile
- web/.dockerignore
- cloudbuild.yaml

Remove any Cloud Run deploy workflow from .github/workflows/ (if it exists beyond ci.yml).

Update CLAUDE.md:
- Remove references to Cloud Run deployment
- Update hosting references to Vercel
- Add Vercel-specific troubleshooting notes

Update README.md:
- Update deployment section to reference Vercel
- Remove Docker/Cloud Run instructions

Commit and push these cleanup changes.
```

### Step 7.3: Update CLAUDE.md and project docs

```
Update CLAUDE.md with:
- Hosting: Vercel Pro (was Cloud Run)
- Deploy: automatic on push to main (was manual gcloud builds submit)
- Secrets: Vercel environment variables (was GCP Secret Manager)
- Add note about GOOGLE_APPLICATION_CREDENTIALS_JSON for GCP auth from Vercel

Update docs/vercel-migration-SPECIFICATION.md: mark as completed.

Update the "Current prefixed set" in CLAUDE.md to reference vercel-migration if needed.
```

---

## Summary of Changes by File

### New files
| File | Purpose |
|------|---------|
| `web/src/lib/gcp-credentials.ts` | Shared GCP credential helper (parse JSON or ADC fallback) |
| `web/src/lib/gcp-credentials.test.ts` | Tests for credential helper |
| `web/vercel.json` | Vercel function timeout config |

### Modified files
| File | Change |
|------|--------|
| `web/src/lib/env.ts` | Add optional `GOOGLE_APPLICATION_CREDENTIALS_JSON` to Zod schema |
| `web/src/lib/firestore.ts` | Pass explicit credentials to Firestore constructor |
| `web/src/lib/vertex-ai.ts` | Pass explicit credentials to VertexAI constructor |
| `web/src/lib/storage.ts` | Pass explicit credentials to Storage constructor |
| `web/next.config.ts` | Remove `output: "standalone"` |

### Deleted files (Phase 7)
| File | Reason |
|------|--------|
| `web/Dockerfile` | Vercel handles deployment |
| `web/.dockerignore` | No Docker |
| `cloudbuild.yaml` | No Cloud Build |
