# Cloud Run Deployment Guide for samkirk.com v3

This guide walks through deploying the application to Google Cloud Run. It assumes you've completed all steps in `docs/GCP-SETUP.md` (Steps 1-8).

> **Related documents:**
> - `docs/GCP-SETUP.md` — GCP resource setup (Firestore, Storage, OAuth, reCAPTCHA)
> - `docs/TODO.md` — Implementation checklist (references this guide for Step 10.2)
> - `docs/SPECIFICATION.md` — Application requirements

---

## Deployment Checklist

### Prerequisites

- [x] Application code complete (Phases 0-10.1)
- [x] GCP-SETUP.md Steps 1-8 complete
- [x] Smoke tests pass (`npm run smoke:gcp`)
- [x] E2E tests pass (`npm run test:e2e`)

### Step 1: Infrastructure Files (Code)

- [x] 1.1 Health check endpoint created (`web/src/app/api/health/route.ts`)
- [x] 1.2 Dockerfile created (`web/Dockerfile`)
- [x] 1.3 .dockerignore created (`web/.dockerignore`)
- [x] 1.4 next.config.ts updated (standalone output + www redirect)
- [x] 1.5 cloudbuild.yaml created (repo root)

### Step 2: Artifact Registry

- [ ] 2.1 Create Artifact Registry repository

### Step 3: Service Account & IAM

- [ ] 3.1 Create Cloud Run service account
- [ ] 3.2 Grant roles/datastore.user (Firestore access)
- [ ] 3.3 Grant roles/storage.objectAdmin (GCS access)
- [ ] 3.4 Grant roles/aiplatform.user (Vertex AI access)
- [ ] 3.5 Grant roles/secretmanager.secretAccessor (Secret Manager access)

### Step 4: Secret Manager

- [ ] 4.1 Create google-oauth-client-id secret
- [ ] 4.2 Create google-oauth-client-secret secret
- [ ] 4.3 Create recaptcha-site-key secret
- [ ] 4.4 Create recaptcha-secret-key secret
- [ ] 4.5 Create auth-secret secret
- [ ] 4.6 Create admin-allowed-email secret

### Step 5: Deploy to Cloud Run

- [ ] 5.1 Build and push Docker image
- [ ] 5.2 Deploy Cloud Run service
- [ ] 5.3 Verify health endpoint returns 200

### Step 6: Custom Domain

- [ ] 6.1 Add samkirk.com as custom domain in Cloud Run
- [ ] 6.2 Configure DNS A record in Microsoft DNS
- [ ] 6.3 Wait for SSL certificate provisioning
- [ ] 6.4 Verify www.samkirk.com redirects to samkirk.com

### Step 7: Cloud Scheduler

- [ ] 7.1 Create retention-cleanup job (daily at 3 AM UTC)

### Step 8: Billing Budget

- [ ] 8.1 Create $20/month budget for samkirk-v3
- [ ] 8.2 Configure email alerts to sam@samkirk.com (50%, 90%, 100% thresholds)

### Final Verification

- [ ] Health endpoint returns 200 (`curl https://samkirk.com/api/health`)
- [ ] Public pages load correctly
- [ ] Admin login works (Google OAuth)
- [ ] Tool pages show captcha gate
- [ ] www.samkirk.com redirects to samkirk.com
- [ ] Cloud Scheduler job visible in GCP Console
- [ ] Billing budget email notification tested

---

## Step 2: Create Artifact Registry Repository

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

## Step 3: Service Account & IAM

### 3.1 Create Cloud Run Service Account

```bash
# Create the service account
gcloud iam service-accounts create samkirk-v3-cloudrun \
  --display-name="samkirk-v3 Cloud Run Service Account" \
  --description="Service account for samkirk-v3 Cloud Run deployment"

# Verify creation
gcloud iam service-accounts list --filter="email:samkirk-v3-cloudrun"
```

### 3.2-3.5 Grant IAM Roles

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

## Step 4: Secret Manager

### Enable Secret Manager API

```bash
gcloud services enable secretmanager.googleapis.com
```

### Create Secrets

> **Important:** Replace the placeholder values with your actual secrets from `web/.env.local`.

```bash
# Get values from your .env.local file and create secrets
# DO NOT commit these values to git!

# 4.1 Google OAuth Client ID
echo -n "YOUR_GOOGLE_OAUTH_CLIENT_ID" | \
  gcloud secrets create google-oauth-client-id --data-file=-

# 4.2 Google OAuth Client Secret
echo -n "YOUR_GOOGLE_OAUTH_CLIENT_SECRET" | \
  gcloud secrets create google-oauth-client-secret --data-file=-

# 4.3 reCAPTCHA Site Key
echo -n "YOUR_RECAPTCHA_SITE_KEY" | \
  gcloud secrets create recaptcha-site-key --data-file=-

# 4.4 reCAPTCHA Secret Key
echo -n "YOUR_RECAPTCHA_SECRET_KEY" | \
  gcloud secrets create recaptcha-secret-key --data-file=-

# 4.5 Auth Secret (NextAuth.js)
echo -n "YOUR_AUTH_SECRET" | \
  gcloud secrets create auth-secret --data-file=-

# 4.6 Admin Allowed Email
echo -n "sam@samkirk.com" | \
  gcloud secrets create admin-allowed-email --data-file=-
```

### Verify Secrets

```bash
gcloud secrets list
```

---

## Step 5: Deploy to Cloud Run

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

If you prefer manual control:

```bash
# 5.1 Build the Docker image locally
cd web
docker build -t us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3/web:latest .

# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push the image
docker push us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3/web:latest

# 5.2 Deploy to Cloud Run
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

### 5.3 Verify Health Endpoint

```bash
# Get the Cloud Run URL
CLOUD_RUN_URL=$(gcloud run services describe samkirk-v3 --region=us-central1 --format='value(status.url)')

# Test health endpoint
curl "${CLOUD_RUN_URL}/api/health"
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Step 6: Custom Domain

### 6.1 Add Custom Domain in Cloud Run

```bash
# Open Cloud Run console to add domain mapping
open "https://console.cloud.google.com/run/domains?project=samkirk-v3"
```

In the console:
1. Click **"Add Mapping"**
2. Select service: `samkirk-v3`
3. Enter domain: `samkirk.com`
4. Click **"Continue"**
5. Copy the provided DNS records

### 6.2 Configure DNS in Microsoft DNS

Add these records in your Microsoft DNS management console:

| Type | Name | Value |
|------|------|-------|
| A | @ | (IP address from Cloud Run) |
| AAAA | @ | (IPv6 address from Cloud Run) |
| CNAME | www | samkirk.com |

> **Note:** DNS propagation can take up to 48 hours.

### 6.3-6.4 Verify SSL and Redirect

```bash
# Wait for SSL certificate (may take 15-30 minutes)
# Check certificate status in Cloud Run console

# Once ready, verify:
curl -I https://samkirk.com/api/health
curl -I https://www.samkirk.com/
# www should redirect (301) to samkirk.com
```

---

## Step 7: Cloud Scheduler

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

## Step 8: Billing Budget

### 8.1-8.2 Create Budget with Email Alerts

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

## Troubleshooting

### Cloud Run Deployment Fails

**Error:** `Permission denied on secret`

**Solution:** Ensure the service account has `roles/secretmanager.secretAccessor`:
```bash
gcloud secrets add-iam-policy-binding YOUR_SECRET_NAME \
  --member="serviceAccount:samkirk-v3-cloudrun@samkirk-v3.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Health Check Fails

**Error:** Cloud Run reports unhealthy

**Solution:** Check Cloud Run logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=samkirk-v3" --limit=50
```

### Custom Domain SSL Pending

**Issue:** Certificate shows "Provisioning" for more than 1 hour

**Solution:**
1. Verify DNS records are correct
2. Check that no CAA records block Google's CA
3. Wait up to 24 hours for propagation

### OAuth Redirect Error in Production

**Error:** `redirect_uri_mismatch`

**Solution:** Add production URLs to OAuth client:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 client
3. Add:
   - Authorized JavaScript origins: `https://samkirk.com`
   - Authorized redirect URIs: `https://samkirk.com/api/auth/callback/google`

---

## Quick Reference Commands

```bash
# View Cloud Run service
gcloud run services describe samkirk-v3 --region=us-central1

# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=samkirk-v3" --limit=20

# Redeploy with latest image
gcloud run deploy samkirk-v3 --image=us-central1-docker.pkg.dev/samkirk-v3/samkirk-v3/web:latest --region=us-central1

# Update a secret
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=-

# Check scheduler job status
gcloud scheduler jobs describe retention-cleanup --location=us-central1

# Manual retention cleanup
curl -X POST https://samkirk.com/api/maintenance/retention
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

### Step 2-8: (To be completed)

_Document execution results here as steps are completed._
