# GCP Setup Guide for samkirk.com v3

This guide walks through setting up Google Cloud Platform credentials and resources needed to run the smoke test (`npm run smoke:gcp`) and the full application.

---

## Setup Checklist

Use this checklist to track your progress:

### Prerequisites
- [x] gcloud CLI installed
- [x] Node.js installed (v18+ recommended)
- [ ] Google Cloud account with billing enabled

### Step 1: GCP Project Setup
- [ ] 1.1 Authenticated with `gcloud auth login`
- [ ] 1.2 Created or selected a GCP project
- [ ] 1.3 Billing enabled for the project
- [ ] 1.4 Enabled required APIs (Firestore, Storage, Vertex AI)

### Step 2: Firestore Database
- [ ] 2.1 Created Firestore database
- [ ] 2.2 Verified database exists

### Step 3: Cloud Storage Buckets
- [ ] 3.1 Created private bucket
- [ ] 3.2 Created public bucket with public access
- [ ] 3.3 Verified buckets exist

### Step 4: Application Default Credentials
- [ ] 4.1 Ran `gcloud auth application-default login`
- [ ] 4.2 Verified credentials with `print-access-token`

### Step 5: Environment Variables
- [ ] 5.1 Created `web/.env.local` file
- [ ] 5.2 Added all required variables

### Step 6: Smoke Test
- [ ] 6.1 Ran `npm run smoke:gcp`
- [ ] 6.2 All tests passed

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
