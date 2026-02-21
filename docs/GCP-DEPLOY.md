# GCP Services & GitHub Setup Guide for samkirk.com v3

This guide covers GCP backend services setup, GitHub repository configuration, and the security scanning workflow. It assumes you've completed all steps in `docs/GCP-SETUP.md` (Steps 1-8).

> **Architecture:** The website is deployed to **Vercel** (see `README_dev_guide.md` → Deploying to Vercel). GCP provides backend services only: **Firestore** (data), **Cloud Storage** (buckets), and **Vertex AI** (LLM). Cloud Run was used for an earlier deployment and has been **decommissioned** (set to internal, public access removed).

> **Related documents:**
> - `docs/GCP-SETUP.md` — GCP resource setup (Firestore, Storage, OAuth, reCAPTCHA)
> - `docs/SEO.md` — SEO, Google Analytics 4, and Search Console setup
> - `README_dev_guide.md` → Deploying to Vercel — production website deployment
> - `docs/TODO.md` — Implementation checklist
> - `docs/SPECIFICATION.md` — Application requirements

## Table of Contents

- [Deployment Checklist](#deployment-checklist)
- [Step 2: Pre-Push Security Scan](#step-2-pre-push-security-scan)
- [Step 3: Push to GitHub](#step-3-push-to-github)
- [Step 4: GitHub Actions CI](#step-4-github-actions-ci)
- [Step 5: Artifact Registry (decommissioned)](#step-5-artifact-registry-cloud-run-legacy--decommissioned)
- [Step 6: Service Account & IAM](#step-6-service-account--iam)
- [Step 7: Secret Manager](#step-7-secret-manager)
- [Step 8: Deploy to Cloud Run (decommissioned)](#step-8-deploy-to-cloud-run-decommissioned)
- [Step 9: Custom Domain (superseded by Vercel)](#step-9-custom-domain-superseded-by-vercel)
- [Step 10: Cloud Scheduler](#step-10-cloud-scheduler)
- [Step 11: Billing Budget](#step-11-billing-budget)
- [Step 12: Google Analytics 4 & SEO](#step-12-google-analytics-4--seo)
- [Troubleshooting](#troubleshooting)
- [Quick Reference Commands](#quick-reference-commands)
- [Execution Evidence](#execution-evidence)

---

## Deployment Checklist

### Prerequisites

- [x] Application code complete (Phases 0-10.1)
- [x] GCP-SETUP.md Steps 1-8 complete
- [x] Smoke tests pass (`npm run smoke:gcp`)
- [x] E2E tests pass (`npm run test:e2e`)

### Step 1: Infrastructure Files (Code) — retained for Vercel

- [x] 1.1 Health check endpoint created (`web/src/app/api/health/route.ts`)
- [x] 1.2 Dockerfile created (`web/Dockerfile`) — Cloud Run legacy, retained for reference
- [x] 1.3 .dockerignore created (`web/.dockerignore`) — Cloud Run legacy, retained for reference
- [x] 1.4 next.config.ts updated (standalone output + www redirect)
- [x] 1.5 cloudbuild.yaml created (repo root) — Cloud Run legacy, retained for reference

### Step 2: Pre-Push Security Scan

- [x] 2.1 Install gitleaks
- [x] 2.2 Scan git history for secrets
- [x] 2.3 Scan working directory for secrets

### Step 3: Push to GitHub

- [x] 3.1 Scrub sensitive GCP identifiers from history (`git-filter-repo`)
- [x] 3.2 Re-add origin remote
- [x] 3.3 Force push full history to GitHub
- [x] 3.4 Make repository public
- [x] 3.5 Verify: GitHub shows full commit history, no sensitive identifiers

### Step 4: GitHub Actions CI

- [x] 4.1 Create `.github/workflows/ci.yml`
- [x] 4.2 Push and verify both jobs pass green

### Step 5: Artifact Registry — Cloud Run legacy (decommissioned)

- [x] 5.1 Create Artifact Registry repository

### Step 6: Service Account & IAM — still active for GCP backend services

- [x] 6.1 Create Cloud Run service account
- [x] 6.2 Grant roles/datastore.user (Firestore access)
- [x] 6.3 Grant roles/storage.objectAdmin (GCS access)
- [x] 6.4 Grant roles/aiplatform.user (Vertex AI access)
- [x] 6.5 Grant roles/secretmanager.secretAccessor (Secret Manager access)

### Step 7: Secret Manager — still active (secrets used by Vercel via env vars)

- [x] 7.1 Create google-oauth-client-id secret
- [x] 7.2 Create google-oauth-client-secret secret
- [x] 7.3 Create recaptcha-site-key secret
- [x] 7.4 Create recaptcha-secret-key secret
- [x] 7.5 Create auth-secret secret
- [x] 7.6 Create admin-allowed-email secret

### Step 8: Deploy to Cloud Run — decommissioned (site now on Vercel)

- [x] 8.1 Build and push Docker image
- [x] 8.2 Deploy Cloud Run service
- [x] 8.3 Verify health endpoint returns 200
- [x] 8.4 **Decommissioned** — public access removed, ingress set to internal

### Step 9: Custom Domain — superseded by Vercel domain config

- [x] ~~9.1 Add samkirk.com as custom domain in Cloud Run~~ — N/A, domain now on Vercel
- [x] ~~9.2 Configure DNS A record in Microsoft DNS~~ — DNS points to Vercel
- [x] ~~9.3 Wait for SSL certificate provisioning~~ — Vercel handles SSL
- [x] ~~9.4 Verify www.samkirk.com redirects to samkirk.com~~ — Vercel handles redirect

### Step 10: Cloud Scheduler — pending review

- [ ] 10.1 Create retention-cleanup job (daily at 3 AM UTC) — needs Vercel-compatible endpoint URL

### Step 11: Billing Budget

- [x] 11.1 Create $20/month budget for samkirk-v3
- [x] 11.2 Configure email alerts to sam@samkirk.com (50%, 90%, 100% thresholds)

### Step 12: Google Analytics 4

- [x] 12.1 Create GA4 property for samkirk.com under account 376572742
- [x] 12.2 Get measurement ID (`G-QPGLH8V5MM`) and update `web/src/lib/seo.ts`
- [x] 12.3 Deploy and verify gtag.js loads in browser Network tab

### Final Verification

- [ ] Health endpoint returns 200 on Vercel (`curl https://samkirk.com/api/health`)
- [ ] Public pages load correctly on Vercel
- [ ] Admin login works (Google OAuth → Vercel)
- [ ] Tool pages show captcha gate
- [ ] www.samkirk.com redirects to samkirk.com (Vercel)
- [ ] GCP backend services accessible from Vercel (Firestore, Storage, Vertex AI)
- [ ] Billing budget email notification tested

---

## Step 2: Pre-Push Security Scan

Before pushing to GitHub (especially before making the repo public), scan for any secrets that may have been committed to the git history.

### 2.1 Install gitleaks

```bash
brew install gitleaks
```

### 2.2 Scan Git History

```bash
# Scan all commits in the git history
gitleaks detect --source . --verbose
```

This scans every commit for patterns matching API keys, tokens, passwords, etc. All findings must be resolved before proceeding.

### 2.3 Scan Working Directory

```bash
# Scan the current working directory (no git history)
gitleaks detect --source . --no-git --verbose
```

This catches any secrets in untracked or uncommitted files.

> **Both scans must pass clean before proceeding to Step 3.**

---

## Step 3: Push to GitHub

The local repo has 272 commits of development history. A one-time `git-filter-repo` scrub (Step 3.1) removed sensitive GCP identifiers (billing account ID, project number) from the history before going public. For ongoing pushes, gitleaks serves as the pre-push gate and CI runs gitleaks + CodeQL as a second gate on every push. No squashing or filtering is needed for routine work.

### 3.1 Scrub Sensitive Identifiers (Completed)

Sensitive GCP identifiers were removed from all commits using `git-filter-repo`:

```bash
# Install git-filter-repo
brew install git-filter-repo

# Back up before filtering
git tag pre-filter

# Replace sensitive values across all history
git filter-repo --replace-text <(printf '014330-8720B9-7BC6ED==>REDACTED\n663797195570==>REDACTED\n') --force

# Verify: both should return 0 hits
git log --all -S '014330-8720B9-7BC6ED' --oneline | wc -l
git log --all -S '663797195570' --oneline | wc -l
```

> **Note:** `git-filter-repo` removes the origin remote as a safety measure. Re-add it in Step 3.2.

### 3.2 Re-add Origin Remote

```bash
git remote add origin https://github.com/MrBesterTester/samkirk.com-v3.git
```

### 3.3 Force Push Full History to GitHub

```bash
# Force push required because filter-repo rewrote commit hashes
git push origin main --force
```

### 3.4 Make Repository Public

```bash
gh repo edit --visibility public
```

### 3.5 Verify

```bash
# GitHub should show 272 commits
gh api repos/MrBesterTester/samkirk.com-v3/commits --jq 'length'

# Verify no sensitive identifiers in remote history
gh api repos/MrBesterTester/samkirk.com-v3/search/code?q=014330 2>&1 | head -5
```

---

## Step 4: GitHub Actions CI

### 4.1 Create CI Workflow

The workflow file has already been created at `.github/workflows/ci.yml`. It defines two parallel jobs:

**build-and-test:**
- Checks out code, sets up Node 20
- `npm ci` (with `web/package-lock.json` cache)
- `npx tsc --noEmit` (type checking)
- `npm run lint` (ESLint)
- `npm run build` (Next.js production build)
- Uploads `.next/standalone/` as artifact

**security-scan:**
- gitleaks (full history scan via `fetch-depth: 0`)
- `npm audit` (non-blocking, `continue-on-error: true`)
- CodeQL static analysis (JavaScript)

All Node commands use `working-directory: web` for the monorepo layout.

> **Note:** Unit and E2E tests are not included in CI — they require GCP services (Firestore emulator, Vertex AI). The combination of type checking + linting + production build catches most issues. Tests can be added later with GCP emulator setup.

### 4.2 Push and Verify

```bash
# Stage and commit the workflow file
git add .github/workflows/ci.yml
git commit -m "Add GitHub Actions CI workflow"
git push origin main

# Watch the CI run
gh run watch

# Or check status
gh run list --limit 5
```

Both jobs should pass green. If gitleaks flags anything, resolve it before continuing.

---

## Step 5: Artifact Registry (Cloud Run legacy — decommissioned)

> Cloud Run has been decommissioned. Artifact Registry was used for Docker images. This section is retained for historical reference only.

```bash
# Enable Artifact Registry API (if not already enabled)
gcloud services enable artifactregistry.googleapis.com

# Create the repository
gcloud artifacts repositories create samkirk-v3 \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for samkirk.com v3"

# Verify creation
gcloud artifacts repositories list --location=us-central1
```

---

## Step 6: Service Account & IAM

> Still active — the service account provides access to Firestore, Cloud Storage, and Vertex AI. These GCP services are called from the Vercel-hosted application using Application Default Credentials (ADC) in development and service account credentials in production.

### 6.1 Create Service Account

```bash
# Create the service account
gcloud iam service-accounts create samkirk-v3-cloudrun \
  --display-name="samkirk-v3 Cloud Run Service Account" \
  --description="Service account for samkirk-v3 Cloud Run deployment"

# Verify creation
gcloud iam service-accounts list --filter="email:samkirk-v3-cloudrun"
```

### 6.2-6.5 Grant IAM Roles

```bash
# Define the service account email
SA_EMAIL="samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com"

# Grant Firestore access
gcloud projects add-iam-policy-binding samkirk-v3 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"

# Grant Cloud Storage access
gcloud projects add-iam-policy-binding samkirk-v3 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"

# Grant Vertex AI access
gcloud projects add-iam-policy-binding samkirk-v3 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding samkirk-v3 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

# Verify roles
gcloud projects get-iam-policy samkirk-v3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SA_EMAIL}" \
  --format="table(bindings.role)"
```

---

## Step 7: Secret Manager

### Enable Secret Manager API

```bash
gcloud services enable secretmanager.googleapis.com
```

### Create Secrets

> **Important:** Replace the placeholder values with your actual secrets from `web/.env.local`.

```bash
# Get values from your .env.local file and create secrets
# DO NOT commit these values to git!

# 7.1 Google OAuth Client ID
echo -n "YOUR_GOOGLE_OAUTH_CLIENT_ID" | \
  gcloud secrets create google-oauth-client-id --data-file=-

# 7.2 Google OAuth Client Secret
echo -n "YOUR_GOOGLE_OAUTH_CLIENT_SECRET" | \
  gcloud secrets create google-oauth-client-secret --data-file=-

# 7.3 reCAPTCHA Site Key
echo -n "YOUR_RECAPTCHA_SITE_KEY" | \
  gcloud secrets create recaptcha-site-key --data-file=-

# 7.4 reCAPTCHA Secret Key
echo -n "YOUR_RECAPTCHA_SECRET_KEY" | \
  gcloud secrets create recaptcha-secret-key --data-file=-

# 7.5 Auth Secret (NextAuth.js)
echo -n "YOUR_AUTH_SECRET" | \
  gcloud secrets create auth-secret --data-file=-

# 7.6 Admin Allowed Email
echo -n "sam@samkirk.com" | \
  gcloud secrets create admin-allowed-email --data-file=-
```

### Verify Secrets

```bash
gcloud secrets list
```

---

## Step 8: Deploy to Cloud Run (decommissioned)

> **Cloud Run has been decommissioned.** The website is now deployed to Vercel (see `README_dev_guide.md` → Deploying to Vercel). Public access was removed and ingress set to internal:
>
> ```bash
> gcloud run services update samkirk-v3 --region=us-central1 --ingress=internal
> gcloud run services remove-iam-policy-binding samkirk-v3 --region=us-central1 \
>   --member="allUsers" --role="roles/run.invoker"
> ```

<details>
<summary>Original Cloud Run deployment instructions (historical reference)</summary>

### Option A: Using Cloud Build (Recommended)

```bash
# From the repo root directory
gcloud builds submit --config=cloudbuild.yaml
```

This will:
1. Build the Docker image
2. Push to Artifact Registry
3. Deploy to Cloud Run with all environment variables and secrets

### Option B: Manual Deployment

```bash
# Build the Docker image locally
cd web
docker build -t us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3/web:latest .

# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push the image
docker push us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3/web:latest

# Deploy to Cloud Run
gcloud run deploy samkirk-v3 \
  --image=us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3/web:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --service-account=samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com \
  --set-env-vars="GCP_PROJECT_ID=samkirk-v3,GCS_PRIVATE_BUCKET=samkirk-v3-private,GCS_PUBLIC_BUCKET=samkirk-v3-public,VERTEX_AI_LOCATION=us-central1,VERTEX_AI_MODEL=gemini-2.0-flash" \
  --set-secrets="GOOGLE_OAUTH_CLIENT_ID=google-oauth-client-id:latest,GOOGLE_OAUTH_CLIENT_SECRET=google-oauth-client-secret:latest,RECAPTCHA_SITE_KEY=recaptcha-site-key:latest,RECAPTCHA_SECRET_KEY=recaptcha-secret-key:latest,AUTH_SECRET=auth-secret:latest,ADMIN_ALLOWED_EMAIL=admin-allowed-email:latest" \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --min-instances=0 \
  --max-instances=10
```

### Verify Health Endpoint

```bash
CLOUD_RUN_URL=$(gcloud run services describe samkirk-v3 --region=us-central1 --format='value(status.url)')
curl "${CLOUD_RUN_URL}/api/health"
```

</details>

---

## Step 9: Custom Domain (superseded by Vercel)

> Domain configuration is now managed in Vercel. DNS was updated at the **Microsoft 365 admin center** (admin.microsoft.com) on 2026-02-17 per REQ-120.

### Current DNS records (samkirk.com → Vercel)

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | `@` | `216.198.79.1` | Vercel (apex domain) |
| CNAME | `www` | `972b3d2e641c184d.vercel-dns-017.com` | Vercel (www redirect) |

Both verified as "Valid Configuration" on the Vercel dashboard. SSL auto-provisioned by Vercel.

> **Note:** The blueprint's generic values (`76.76.21.21` and `cname.vercel-dns.com`) were replaced with project-specific values provided by Vercel during domain setup.

### DNS cleanup (2026-02-17)

Four legacy Network Solutions records were removed during the Vercel cutover:

| Deleted Record | Reason |
|---------------|--------|
| A `*` → 206.188.192.158 | Wildcard to Network Solutions hosting — no longer needed |
| CNAME `mail` → mail.samkirk.com.netsolmail.net | Legacy email routing — Microsoft 365 handles email |
| CNAME `smtp` → smtp.samkirk.com.netsolmail.net | Legacy SMTP — no longer in use |
| SRV `_autodiscover._tcp` → autodiscover.hostingplatform.com | Legacy autodiscover — Microsoft 365 has its own |

**Remaining custom records (all valid):** A `@` (Vercel), TXT `@` (Microsoft 365 verification + Google site verification), CNAME `lyncdiscover`/`sip` (Microsoft 365), CNAME `photo-fun` (Vercel), A `www.tensor-logic` (Replit), CNAME `www` (Vercel), SRV records (Microsoft 365). Microsoft Exchange records (MX, TXT SPF, CNAME autodiscover) unaffected.

For full details, see `do-work/archive/REQ-120-update-dns-records.md`.

---

## Step 10: Cloud Scheduler

Create a scheduled job to trigger the retention cleanup endpoint daily.

```bash
# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Create the scheduler job
gcloud scheduler jobs create http retention-cleanup \
  --schedule="0 3 * * *" \
  --uri="https://samkirk.com/api/maintenance/retention" \
  --http-method=POST \
  --oidc-service-account-email="samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com" \
  --oidc-token-audience="https://samkirk.com" \
  --location=us-central1 \
  --description="Daily cleanup of expired submissions (90-day retention)"

# Verify creation
gcloud scheduler jobs list --location=us-central1

# Test the job manually
gcloud scheduler jobs run retention-cleanup --location=us-central1
```

---

## Step 11: Billing Budget

### 11.1-11.2 Create Budget with Email Alerts

```bash
# Open Billing Budgets console
open "https://console.cloud.google.com/billing/budgets?project=samkirk-v3"
```

In the console:
1. Click **"Create Budget"**
2. **Name:** `samkirk-v3-monthly`
3. **Projects:** Select `samkirk-v3`
4. **Amount:** $20.00
5. **Thresholds:**
   - 50% of budget (actual)
   - 90% of budget (actual)
   - 100% of budget (actual)
6. **Notifications:**
   - Email to: `sam@samkirk.com`
   - Check "Email alerts to billing admins and users"
7. Click **"Finish"**

---

## Step 12: Google Analytics 4 & SEO

> Full setup instructions and checklist are in **`docs/SEO.md`**. This step covers GA4 property creation, Search Console verification, and post-deploy SEO checks.

---

## Troubleshooting

### GCP Service Access from Vercel

**Error:** `Permission denied` on Firestore, Storage, or Vertex AI

**Solution:** Ensure the service account has the required roles (Step 6) and that the correct credentials are configured in Vercel environment variables.

### Secret Manager Access

**Error:** `Permission denied on secret`

**Solution:** Ensure the service account has `roles/secretmanager.secretAccessor`:
```bash
gcloud secrets add-iam-policy-binding YOUR_SECRET_NAME \
  --member="serviceAccount:samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### OAuth Redirect Error in Production

**Error:** `redirect_uri_mismatch`

**Solution:** Add production URLs to OAuth client:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 client
3. Add:
   - Authorized JavaScript origins: `https://samkirk.com`
   - Authorized redirect URIs: `https://samkirk.com/api/auth/callback/google`

### GitHub Actions CI Fails

**gitleaks failure:** A secret was detected in the commit history. Remove it using `git-filter-repo` with a targeted replacement, then force push.

**CodeQL failure:** Review the security alerts in the GitHub Security tab and fix the flagged code.

**Build failure:** Run `npm run build` locally in the `web/` directory to reproduce and fix.

---

## Quick Reference Commands

```bash
# Pre-push secret scan
gitleaks detect --source .

# Update a GCP secret
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-

# Check service account roles
SA_EMAIL="samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com"
gcloud projects get-iam-policy samkirk-v3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SA_EMAIL}" \
  --format="table(bindings.role)"

# Check GitHub Actions status
gh run list --limit 5

# Watch a CI run
gh run watch
```

---

## Execution Evidence

_Record completed steps here with dates._

### Step 1: Infrastructure Files (2026-02-04)

- Created `web/src/app/api/health/route.ts` - Health check endpoint
- Created `web/Dockerfile` - Multi-stage build with standalone output
- Created `web/.dockerignore` - Excludes dev files
- Updated `web/next.config.ts` - Added `output: 'standalone'` and www redirect
- Created `cloudbuild.yaml` - Cloud Build configuration
- Fixed pre-existing type issues uncovered by production build:
  - `Buffer` to `Uint8Array` conversion for Response body
  - `JSX.Element` → `React.ReactElement`
  - `level` → `type` in LOCATION_PATTERNS
  - Added missing `totalTokens` to mock usage
  - Fixed pdf-parse dynamic import typing
  - Added explicit type for `merged` variable
  - Added `renderMarkdownSync` to test mock

```bash
# Build verification
$ npm run build
✓ Compiled successfully
✓ Generating static pages (32/32)
✓ Standalone output created at .next/standalone/

# Test verification
$ npm test
✓ 37 test files passed
✓ 1224 tests passed

$ npm run lint
✓ No lint errors
```

### Steps 2-11: (To be completed)

_Document execution results here as steps are completed._
