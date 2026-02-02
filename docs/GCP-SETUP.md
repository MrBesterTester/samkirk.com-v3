# GCP Setup Guide for samkirk.com v3

This guide walks through setting up Google Cloud Platform credentials and resources needed to run the smoke test (`npm run smoke:gcp`) and the full application.

---

## Setup Checklist

Use this checklist to track your progress:

### Prerequisites
- [x] gcloud CLI installed
- [x] Node.js installed (v18+ recommended)
- [x] Google Cloud account with billing enabled

### Step 1: GCP Project Setup
- [x] 1.1 Authenticated with `gcloud auth login`
- [x] 1.2 Created or selected a GCP project
- [x] 1.3 Billing enabled for the project
- [x] 1.4 Enabled required APIs (Firestore, Storage, Vertex AI)

### Step 2: Firestore Database
- [x] 2.1 Created Firestore database
- [x] 2.2 Verified database exists

### Step 3: Cloud Storage Buckets
- [x] 3.1 Created private bucket
- [x] 3.2 Created public bucket (public access pending org policy)
- [x] 3.3 Verified buckets exist

### Step 4: Application Default Credentials
- [x] 4.1 Ran `gcloud auth application-default login`
- [x] 4.2 Verified credentials with `print-access-token`

### Step 5: Environment Variables
- [x] 5.1 Created `web/.env.local` file
- [x] 5.2 Added all required variables

### Step 6: Smoke Test
- [x] 6.1 Ran `npm run smoke:gcp`
- [x] 6.2 All tests passed

---

## Prerequisites

Before starting, ensure you have:

- **gcloud CLI** installed
- **Node.js** installed (v18+ recommended)
- A **Google Cloud account** with billing enabled

### Verify gcloud CLI Installation

```bash
gcloud --version
```

If not installed, follow the [official installation guide](https://cloud.google.com/sdk/docs/install).

### Verify Node.js Installation

```bash
node --version
npm --version
```

---

## Step 1: GCP Project Setup

### 1.1 Authenticate with gcloud

```bash
gcloud auth login
```

This opens a browser for Google account authentication.

### 1.2 Create or Select a Project

**Option A: Create a new project**
```bash
gcloud projects create samkirk-v3 --name="samkirk.com v3"
gcloud config set project samkirk-v3
```

**Option B: Use an existing project**
```bash
# List your projects
gcloud projects list

# Set the project
gcloud config set project YOUR_PROJECT_ID
```

### 1.3 Enable Billing

Ensure billing is enabled for your project in the [Google Cloud Console](https://console.cloud.google.com/billing).

### 1.4 Enable Required APIs

```bash
# Enable Firestore API
gcloud services enable firestore.googleapis.com

# Enable Cloud Storage API
gcloud services enable storage.googleapis.com

# Enable Vertex AI API (for future LLM features)
gcloud services enable aiplatform.googleapis.com
```

---

## Step 2: Create Firestore Database

### 2.1 Create the Database

```bash
gcloud firestore databases create --location=us-central1
```

> **Note:** Choose a location close to your Cloud Run deployment. Common options:
> - `us-central1` (Iowa)
> - `us-east1` (South Carolina)
> - `europe-west1` (Belgium)

### 2.2 Verify Database Creation

```bash
gcloud firestore databases list
```

---

## Step 3: Create Cloud Storage Buckets

### 3.1 Create the Private Bucket

This bucket stores the master resume, user submissions, and generated artifacts.

```bash
# Replace YOUR_PROJECT_ID with your actual project ID
gcloud storage buckets create gs://YOUR_PROJECT_ID-private \
  --location=us-central1 \
  --uniform-bucket-level-access
```

### 3.2 Create the Public Bucket

This bucket stores the published Dance Menu and public assets.

```bash
gcloud storage buckets create gs://YOUR_PROJECT_ID-public \
  --location=us-central1 \
  --uniform-bucket-level-access

# Make the bucket publicly readable
gcloud storage buckets add-iam-policy-binding gs://YOUR_PROJECT_ID-public \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

### 3.3 Verify Buckets

```bash
gcloud storage buckets list
```

---

## Step 4: Set Up Application Default Credentials

The application uses Application Default Credentials (ADC) for authentication.

```bash
gcloud auth application-default login
```

This opens a browser for authentication and stores credentials at:
- macOS/Linux: `~/.config/gcloud/application_default_credentials.json`
- Windows: `%APPDATA%\gcloud\application_default_credentials.json`

### Verify Credentials

```bash
gcloud auth application-default print-access-token
```

If this prints a token, your credentials are configured correctly.

---

## Step 5: Configure Environment Variables

### 5.1 Create the Environment File

Create a `.env.local` file in the `web/` directory:

```bash
cd web
touch .env.local
```

### 5.2 Add Required Variables

Edit `web/.env.local` with the following content:

```bash
# === GCP Core ===
GCP_PROJECT_ID=YOUR_PROJECT_ID

# === Cloud Storage Buckets ===
GCS_PUBLIC_BUCKET=YOUR_PROJECT_ID-public
GCS_PRIVATE_BUCKET=YOUR_PROJECT_ID-private

# === Vertex AI (placeholders for smoke test) ===
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-1.5-pro

# === reCAPTCHA (placeholders for smoke test) ===
# Get real keys at: https://www.google.com/recaptcha/admin
RECAPTCHA_SITE_KEY=placeholder-site-key
RECAPTCHA_SECRET_KEY=placeholder-secret-key

# === Google OAuth (placeholders for smoke test) ===
# Get real credentials at: https://console.cloud.google.com/apis/credentials
GOOGLE_OAUTH_CLIENT_ID=placeholder-client-id
GOOGLE_OAUTH_CLIENT_SECRET=placeholder-client-secret
```

> **Important:** Replace `YOUR_PROJECT_ID` with your actual GCP project ID.

### 5.3 Variables Reference

| Variable | Required for Smoke Test | Description |
|----------|------------------------|-------------|
| `GCP_PROJECT_ID` | Yes | Your GCP project ID |
| `GCS_PRIVATE_BUCKET` | Yes | Private bucket for submissions/artifacts |
| `GCS_PUBLIC_BUCKET` | No (placeholder OK) | Public bucket for Dance Menu |
| `VERTEX_AI_LOCATION` | No (placeholder OK) | Vertex AI region |
| `VERTEX_AI_MODEL` | No (placeholder OK) | Gemini model name |
| `RECAPTCHA_SITE_KEY` | No (placeholder OK) | reCAPTCHA v2 site key |
| `RECAPTCHA_SECRET_KEY` | No (placeholder OK) | reCAPTCHA v2 secret key |
| `GOOGLE_OAUTH_CLIENT_ID` | No (placeholder OK) | OAuth client ID for admin auth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | No (placeholder OK) | OAuth client secret |

---

## Step 6: Run the Smoke Test

### 6.1 Execute the Test

```bash
cd web
npm run smoke:gcp
```

### 6.2 Expected Output

```
=== GCP Smoke Test ===

→ Checking environment variables...
✓ Environment variables validated
→   Project: YOUR_PROJECT_ID
→   Private bucket: YOUR_PROJECT_ID-private

--- Cloud Storage Test ---

→ Writing to _smoke_test/test-file.txt...
✓ Write successful
→ Reading from _smoke_test/test-file.txt...
✓ Read successful, content matches
→ Cleaning up _smoke_test/test-file.txt...
✓ Cleanup successful

--- Firestore Test ---

→ Writing to _smoke_test/test-doc...
✓ Write successful
→ Reading from _smoke_test/test-doc...
✓ Read successful, data matches
→ Cleaning up _smoke_test/test-doc...
✓ Cleanup successful

=== All smoke tests passed! ===
```

---

## Troubleshooting

### Authentication Errors

**Error:** `Could not load the default credentials`

**Solution:**
```bash
gcloud auth application-default login
```

### Permission Denied Errors

**Error:** `403 Forbidden` or `Permission denied`

**Solution:** Ensure your account has the required IAM roles:
```bash
# Grant Storage Admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/storage.admin"

# Grant Firestore User role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/datastore.user"
```

### Bucket Does Not Exist

**Error:** `The specified bucket does not exist`

**Solution:** Create the bucket (see Step 3) or verify the bucket name in `.env.local` matches exactly.

### Firestore Not Initialized

**Error:** `NOT_FOUND: Database not found`

**Solution:** Create the Firestore database (see Step 2).

### API Not Enabled

**Error:** `API has not been used in project` or `PERMISSION_DENIED: Cloud Firestore API has not been used`

**Solution:**
```bash
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
```

---

## Next Steps

After the smoke test passes:

1. **Set up real reCAPTCHA keys** at https://www.google.com/recaptcha/admin
2. **Create OAuth credentials** at https://console.cloud.google.com/apis/credentials
3. **Configure Vertex AI** for LLM features
4. **Set up Cloud Run** for deployment

---

## Quick Reference Commands

```bash
# Check current project
gcloud config get-value project

# List projects
gcloud projects list

# Switch projects
gcloud config set project PROJECT_ID

# Re-authenticate
gcloud auth login
gcloud auth application-default login

# List buckets
gcloud storage buckets list

# Check Firestore databases
gcloud firestore databases list

# List enabled APIs
gcloud services list --enabled
```

---

## Execution Evidence (2026-02-02)

This section documents the actual commands executed and their results.

### Prerequisites Verification

```bash
$ gcloud --version
Google Cloud SDK 551.0.0
alpha 2026.01.02
beta 2026.01.02
bq 2.1.26
core 2026.01.02

$ gcloud auth list
     Credentialed Accounts
ACTIVE  ACCOUNT
*       sam@samkirk.com
```

### Billing Account Creation

Created new billing account via Google Cloud Console:
- **Name:** `samkirk-com-billing`
- **Account ID:** `REDACTED`
- **Status:** Open

```bash
$ gcloud billing accounts list
ACCOUNT_ID            NAME                  OPEN   MASTER_ACCOUNT_ID
REDACTED  samkirk-com-billing   True
```

### Step 1: Project Creation

```bash
$ gcloud projects create samkirk-v3 --name="samkirk-com v3"
Create in progress for [https://cloudresourcemanager.googleapis.com/v1/projects/samkirk-v3].
Waiting for [operations/create_project.global.8695432174497738446] to finish...done.
Enabling service [cloudapis.googleapis.com] on project [samkirk-v3]...
Operation finished successfully.

$ gcloud config set project samkirk-v3
Updated property [core/project].

$ gcloud billing projects link samkirk-v3 --billing-account=REDACTED
billingAccountName: billingAccounts/REDACTED
billingEnabled: true
name: projects/samkirk-v3/billingInfo
projectId: samkirk-v3

$ gcloud services enable firestore.googleapis.com storage.googleapis.com aiplatform.googleapis.com
Operation finished successfully.
```

### Step 2: Firestore Database

```bash
$ gcloud firestore databases create --location=us-central1
response:
  '@type': type.googleapis.com/google.firestore.admin.v1.Database
  concurrencyMode: PESSIMISTIC
  createTime: '2026-02-02T20:16:57.511209Z'
  databaseEdition: STANDARD
  freeTier: true
  locationId: us-central1
  name: projects/samkirk-v3/databases/(default)
  type: FIRESTORE_NATIVE
  uid: 654708d6-bac2-4caa-a925-e582ec2cc723
```

### Step 3: Cloud Storage Buckets

```bash
$ gcloud storage buckets create gs://samkirk-v3-private \
    --location=us-central1 \
    --uniform-bucket-level-access
Creating gs://samkirk-v3-private/...

$ gcloud storage buckets create gs://samkirk-v3-public \
    --location=us-central1 \
    --uniform-bucket-level-access
Creating gs://samkirk-v3-public/...

$ gcloud storage buckets list --project=samkirk-v3
name: samkirk-v3-private
location: US-CENTRAL1
storage_url: gs://samkirk-v3-private/
uniform_bucket_level_access: true

name: samkirk-v3-public
location: US-CENTRAL1
storage_url: gs://samkirk-v3-public/
uniform_bucket_level_access: true
```

> **Note:** Public access binding for `samkirk-v3-public` failed due to organization-level public access prevention policy. This will be addressed separately when needed for Dance Menu publishing.

### Step 4: Application Default Credentials

```bash
$ gcloud auth application-default login
Your browser has been opened to visit: https://accounts.google.com/o/oauth2/auth?...

Credentials saved to file: [/Users/sam/.config/gcloud/application_default_credentials.json]

Quota project "samkirk-v3" was added to ADC which can be used by Google client libraries for billing and quota.
```

### Step 5: Environment Variables

Created `web/.env.local` with:

```bash
GCP_PROJECT_ID=samkirk-v3
GCS_PUBLIC_BUCKET=samkirk-v3-public
GCS_PRIVATE_BUCKET=samkirk-v3-private
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-1.5-pro
RECAPTCHA_SITE_KEY=placeholder-site-key
RECAPTCHA_SECRET_KEY=placeholder-secret-key
GOOGLE_OAUTH_CLIENT_ID=placeholder-client-id
GOOGLE_OAUTH_CLIENT_SECRET=placeholder-client-secret
```

### Step 6: Smoke Test Results

```bash
$ cd web && npm run smoke:gcp

=== GCP Smoke Test ===

→ Checking environment variables...
✓ Environment variables validated
→   Project: samkirk-v3
→   Private bucket: samkirk-v3-private

--- Cloud Storage Test ---

→ Writing to _smoke_test/test-file.txt...
✓ Write successful
→ Reading from _smoke_test/test-file.txt...
✓ Read successful, content matches
→ Cleaning up _smoke_test/test-file.txt...
✓ Cleanup successful

--- Firestore Test ---

→ Writing to _smoke_test/test-doc...
✓ Write successful
→ Reading from _smoke_test/test-doc...
✓ Read successful, data matches
→ Cleaning up _smoke_test/test-doc...
✓ Cleanup successful

=== All smoke tests passed! ===
```

### Resource Summary

| Resource | Value |
|----------|-------|
| **Project ID** | `samkirk-v3` |
| **Project Number** | `REDACTED` |
| **Billing Account** | `samkirk-com-billing` (REDACTED) |
| **Region** | `us-central1` |
| **Firestore Database** | `(default)` - Native mode |
| **Private Bucket** | `gs://samkirk-v3-private` |
| **Public Bucket** | `gs://samkirk-v3-public` |
| **ADC Location** | `~/.config/gcloud/application_default_credentials.json` |
