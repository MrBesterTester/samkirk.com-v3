# GCP Setup Guide for samkirk.com v3

This guide walks through setting up Google Cloud Platform credentials and resources needed to run the smoke test (`npm run smoke:gcp`) and the full application.

---

## Table of Contents

- [GCP Setup Guide for samkirk.com v3](#gcp-setup-guide-for-samkirkcom-v3)
  - [Table of Contents](#table-of-contents)
  - [Setup Checklist](#setup-checklist)
    - [Prerequisites](#prerequisites)
    - [Step 1: GCP Project Setup](#step-1-gcp-project-setup)
    - [Step 2: Firestore Database](#step-2-firestore-database)
    - [Step 3: Cloud Storage Buckets](#step-3-cloud-storage-buckets)
    - [Step 4: Application Default Credentials](#step-4-application-default-credentials)
    - [Step 5: Environment Variables](#step-5-environment-variables)
    - [Step 6: Smoke Test](#step-6-smoke-test)
    - [Step 7: Google OAuth for Admin Auth](#step-7-google-oauth-for-admin-auth)
    - [Step 8: reCAPTCHA v2 Setup](#step-8-recaptcha-v2-setup)
  - [Prerequisites](#prerequisites-1)
    - [Verify gcloud CLI Installation](#verify-gcloud-cli-installation)
    - [Verify Node.js Installation](#verify-nodejs-installation)
  - [Step 1: GCP Project Setup](#step-1-gcp-project-setup-1)
    - [1.1 Authenticate with gcloud](#11-authenticate-with-gcloud)
    - [1.2 Create or Select a Project](#12-create-or-select-a-project)
    - [1.3 Enable Billing](#13-enable-billing)
    - [1.4 Enable Required APIs](#14-enable-required-apis)
  - [Step 2: Create Firestore Database](#step-2-create-firestore-database)
    - [2.1 Create the Database](#21-create-the-database)
    - [2.2 Verify Database Creation](#22-verify-database-creation)
  - [Step 3: Create Cloud Storage Buckets](#step-3-create-cloud-storage-buckets)
    - [3.1 Create the Private Bucket](#31-create-the-private-bucket)
    - [3.2 Create the Public Bucket](#32-create-the-public-bucket)
    - [3.3 Verify Buckets](#33-verify-buckets)
  - [Step 4: Set Up Application Default Credentials](#step-4-set-up-application-default-credentials)
    - [Verify Credentials](#verify-credentials)
- [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
  - [5.1 Create the Environment File](#51-create-the-environment-file)
  - [5.2 Fill In Your Values](#52-fill-in-your-values)
  - [5.3 Variables Reference](#53-variables-reference)
  - [Step 6: Run the Smoke Test](#step-6-run-the-smoke-test)
    - [6.1 Execute the Test](#61-execute-the-test)
    - [6.2 Expected Output](#62-expected-output)
  - [Step 7: Google OAuth for Admin Auth](#step-7-google-oauth-for-admin-auth-1)
    - [7.1 Configure OAuth Consent Screen](#71-configure-oauth-consent-screen)
    - [7.2 Create OAuth 2.0 Client Credentials](#72-create-oauth-20-client-credentials)
    - [7.3 Add Credentials to `.env.local`](#73-add-credentials-to-envlocal)
    - [7.4 Generate AUTH\_SECRET](#74-generate-auth_secret)
    - [7.5 Add Admin Allowed Email](#75-add-admin-allowed-email)
    - [7.6 Test Admin Login Flow](#76-test-admin-login-flow)
    - [OAuth Configuration Summary](#oauth-configuration-summary)
  - [Step 8: reCAPTCHA v2 Setup](#step-8-recaptcha-v2-setup-1)
    - [8.1 Create a reCAPTCHA v2 Site](#81-create-a-recaptcha-v2-site)
    - [8.2 Add Keys to `.env.local`](#82-add-keys-to-envlocal)
    - [8.3 How reCAPTCHA Works in This App](#83-how-recaptcha-works-in-this-app)
    - [8.4 Testing reCAPTCHA Locally](#84-testing-recaptcha-locally)
    - [reCAPTCHA Troubleshooting](#recaptcha-troubleshooting)
  - [Troubleshooting](#troubleshooting)
    - [Authentication Errors](#authentication-errors)
    - [Permission Denied Errors](#permission-denied-errors)
    - [Bucket Does Not Exist](#bucket-does-not-exist)
    - [Firestore Not Initialized](#firestore-not-initialized)
    - [API Not Enabled](#api-not-enabled)
    - [OAuth: "Access Denied" Error](#oauth-access-denied-error)
    - [OAuth: "redirect\_uri\_mismatch" Error](#oauth-redirect_uri_mismatch-error)
    - [OAuth: "invalid\_client" Error](#oauth-invalid_client-error)
    - [OAuth: Consent Screen Not Configured](#oauth-consent-screen-not-configured)
  - [Next Steps](#next-steps)
  - [Quick Reference Commands](#quick-reference-commands)
  - [Execution Evidence (2026-02-02)](#execution-evidence-2026-02-02)
    - [Prerequisites Verification](#prerequisites-verification)
    - [Billing Account Creation](#billing-account-creation)
    - [Step 1: Project Creation](#step-1-project-creation)
    - [Step 2: Firestore Database](#step-2-firestore-database-1)
    - [Step 3: Cloud Storage Buckets](#step-3-cloud-storage-buckets-1)
    - [Step 4: Application Default Credentials](#step-4-application-default-credentials-1)
    - [Step 5: Environment Variables](#step-5-environment-variables-1)
    - [Step 6: Smoke Test Results](#step-6-smoke-test-results)
    - [Resource Summary](#resource-summary)
    - [Step 7: Google OAuth for Admin Auth (2026-02-02)](#step-7-google-oauth-for-admin-auth-2026-02-02)
      - [7.1 OAuth Consent Screen](#71-oauth-consent-screen)
      - [7.2 OAuth 2.0 Client Credentials](#72-oauth-20-client-credentials)
      - [7.3-7.4 Environment Variables](#73-74-environment-variables)
      - [7.5 Admin Login Test](#75-admin-login-test)

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

### Step 7: Google OAuth for Admin Auth
- [x] 7.1 Configured OAuth consent screen
- [x] 7.2 Created OAuth 2.0 client credentials (Web application type)
- [x] 7.3 Added credentials to `.env.local`
- [x] 7.4 Generated AUTH_SECRET
- [x] 7.5 Tested admin login flow

### Step 8: reCAPTCHA v2 Setup
- [x] 8.1 Created reCAPTCHA v2 site (checkbox type)
- [x] 8.2 Added site key and secret key to `.env.local`
- [x] 8.3 Keys ready (full verification in Phase 5.1 per `docs/TODO.md`)

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

> **If the database already exists:** You'll see an error like `Database already exists`. That's fine — just verify it exists in step 2.2.

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

> **If public access is blocked:** You may see `public access prevention is enforced`. This is an organization-level policy. **Not a blocker** — the public bucket is only needed for Dance Menu (Phase 3.4). When you get there, options include: disabling public access prevention at project level, using signed URLs, or proxying files through Next.js.

> **If buckets already exist:** You'll see an error like `HTTPError 409: Your previous request to create the named bucket succeeded and you already own it`. That's fine — just verify they exist in step 3.3.

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

Copy the example file and fill in your values:

```bash
cd web
cp .env.local.example .env.local
```

### 5.2 Fill In Your Values

Edit `web/.env.local` and replace the placeholder values:

- **GCP_PROJECT_ID** — Your project ID (e.g., `samkirk-v3`)
- **GCS_PUBLIC_BUCKET** — Your public bucket name (e.g., `samkirk-v3-public`)
- **GCS_PRIVATE_BUCKET** — Your private bucket name (e.g., `samkirk-v3-private`)
- **OAuth & Auth** — Configure in Step 7
- **reCAPTCHA** — Configure in Step 8

> **Tip:** For the smoke test, only `GCP_PROJECT_ID`, `GCS_PRIVATE_BUCKET`, and placeholder values for the other fields are needed.

### 5.3 Variables Reference

| Variable | Required for Smoke Test | Required for Tools | Required for Admin | Description |
|----------|------------------------|-------------------|-------------------|-------------|
| `GCP_PROJECT_ID` | Yes | Yes | No | Your GCP project ID |
| `GCS_PRIVATE_BUCKET` | Yes | Yes | No | Private bucket for submissions/artifacts |
| `GCS_PUBLIC_BUCKET` | No (placeholder OK) | No | No | Public bucket for Dance Menu |
| `VERTEX_AI_LOCATION` | No (placeholder OK) | Yes | No | Vertex AI region |
| `VERTEX_AI_MODEL` | No (placeholder OK) | Yes | No | Gemini model name |
| `RECAPTCHA_SITE_KEY` | No (placeholder OK) | Yes | No | reCAPTCHA v2 site key (Step 8) |
| `RECAPTCHA_SECRET_KEY` | No (placeholder OK) | Yes | No | reCAPTCHA v2 secret key (Step 8) |
| `GOOGLE_OAUTH_CLIENT_ID` | No (placeholder OK) | No | Yes | OAuth client ID for admin auth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | No (placeholder OK) | No | Yes | OAuth client secret |
| `AUTH_SECRET` | No (placeholder OK) | No | Yes | NextAuth.js token signing secret (min 32 chars) |
| `ADMIN_ALLOWED_EMAIL` | No (placeholder OK) | No | Yes | Email allowed to access admin (e.g., sam@samkirk.com) |

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

## Step 7: Google OAuth for Admin Auth

This step configures Google OAuth credentials so that admin authentication works. Only the allowed email (e.g., `sam@samkirk.com`) can sign in to the admin area.

### 7.1 Configure OAuth Consent Screen

First, configure the OAuth consent screen. This is required before creating OAuth credentials.

```bash
# Open the OAuth consent screen configuration page
# (This must be done in the Google Cloud Console - no gcloud command available)
open "https://console.cloud.google.com/apis/credentials/consent?project=samkirk-v3"
```

In the Console:
1. Select **External** user type (or Internal if using Google Workspace)
2. Click **Create**
3. Fill in the required fields:
   - **App name:** `samkirk.com Admin`
   - **User support email:** Your email (e.g., `sam@samkirk.com`)
   - **Developer contact email:** Your email
4. Click **Save and Continue**
5. **Scopes page** (if shown): You can skip this or click **Save and Continue** — the default scopes (email, profile, openid) are sufficient for sign-in and are granted automatically.
6. On **Test users** page (for External apps):
   - Click **Add Users**
   - Add your admin email (e.g., `sam@samkirk.com`)
7. Click **Save and Continue**, then **Back to Dashboard**

### 7.2 Create OAuth 2.0 Client Credentials

```bash
# Open the credentials page
open "https://console.cloud.google.com/apis/credentials?project=samkirk-v3"
```

In the Console:
1. Click **+ Create Credentials** → **OAuth client ID**
2. Select **Web application** as the application type
3. Set the name: `samkirk.com Admin Auth`
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for local development)
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google` (for local development)
6. Click **Create**
7. **Copy the Client ID and Client Secret** - you'll need these for the next step

> **Production URLs:** When deploying to Cloud Run, you'll also add:
> - Origin: `https://samkirk.com`
> - Redirect URI: `https://samkirk.com/api/auth/callback/google`

### 7.3 Add Credentials to `.env.local`

Update your `web/.env.local` file with the real OAuth credentials:

```bash
# Replace the placeholder values with your actual credentials
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
```

### 7.4 Generate AUTH_SECRET

NextAuth.js requires a secret for signing tokens. Generate a secure random string:

```bash
# Generate a 32-byte random string (macOS/Linux)
openssl rand -base64 32
```

Add it to your `web/.env.local`:

```bash
AUTH_SECRET=your-generated-secret-here
```

### 7.5 Add Admin Allowed Email

Add the email address that should have admin access:

```bash
ADMIN_ALLOWED_EMAIL=sam@samkirk.com
```

### 7.6 Test Admin Login Flow

1. Start the development server:
   ```bash
   cd web
   npm run dev
   ```

2. Navigate to `http://localhost:3000/admin`

3. You should be redirected to `/admin/login`

4. Click **Sign in with Google**

5. Sign in with the allowed email address

6. You should be redirected back to `/admin` and see the dashboard with your email displayed

### OAuth Configuration Summary

Your `web/.env.local` should now have these OAuth-related variables:

```bash
# Google OAuth (from Step 7.2)
GOOGLE_OAUTH_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-your-secret-here

# NextAuth.js secret (from Step 7.4)
AUTH_SECRET=your-32-char-or-longer-secret-here

# Admin allowlist (from Step 7.5)
ADMIN_ALLOWED_EMAIL=sam@samkirk.com
```

---

## Step 8: reCAPTCHA v2 Setup

This project uses **Google reCAPTCHA v2** (the "I'm not a robot" checkbox) to prevent abuse of the public AI tools. This is required once per session before users can access the tools.

> **Why reCAPTCHA v2 Checkbox?**
> - **v2 Checkbox** — User clicks a checkbox; may show image challenge. Good balance of UX and security.
> - **v2 Invisible** — No visible checkbox; triggers on form submit. Less visible but can cause confusion.
> - **v3** — Fully invisible, returns a score (0.0–1.0). Requires you to decide score thresholds. More complex.
> - **Enterprise** — Advanced features, higher cost. Overkill for this project.
>
> We chose **v2 Checkbox** per the specification for simplicity and clear user feedback.

### 8.1 Create a reCAPTCHA v2 Site

1. Go to the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin):

   ```bash
   open "https://www.google.com/recaptcha/admin/create"
   ```

2. Fill in the registration form:
   - **Label:** `samkirk.com` (or any descriptive name)
   - **reCAPTCHA type:** Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains:** Add your domains:
     - `localhost` (for local development)
     - `samkirk.com` (for production)
   - **Owners:** Your email should be pre-filled
   - **Accept the Terms of Service**

3. Click **Submit**

4. You'll see two keys:
   - **Site Key** — Used in the frontend (public, embedded in HTML)
   - **Secret Key** — Used on the server to verify tokens (keep secret!)

### 8.2 Add Keys to `.env.local`

Update your `web/.env.local` with the real keys:

```bash
# === reCAPTCHA v2 (Checkbox) ===
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> **Security Note:** The site key is safe to expose in client-side code. The secret key must **never** be exposed to the client — it's only used server-side to verify tokens.

### 8.3 How reCAPTCHA Works in This App

1. **First tool request:** User sees a reCAPTCHA checkbox on the tool page
2. **User completes checkbox:** May involve an image challenge
3. **Client sends token:** The reCAPTCHA widget returns a token
4. **Server verifies:** `POST /api/captcha/verify` sends token + secret to Google
5. **Session marked:** On success, `captchaPassedAt` is stored in the session
6. **Subsequent requests:** User can use tools without re-verifying (until session expires)

### 8.4 Testing reCAPTCHA Locally

For local development, you can use test keys that always pass:

| Key Type | Test Key |
|----------|----------|
| Site Key | `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` |
| Secret Key | `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` |

> **Warning:** Test keys will always pass verification and should **only** be used in development. They won't work in production (Google rejects them for non-localhost domains).

### 8.5 Completing GCP Setup

Once you've added the reCAPTCHA keys to `.env.local`, GCP setup is complete. Return to `docs/TODO.md` **Step 2.1** to run the smoke test:

```bash
cd web
npm run smoke:gcp
```

This verifies GCS and Firestore are working correctly. Full reCAPTCHA verification happens later in **Phase 5.1** when the widget and `/api/captcha/verify` endpoint are implemented.

### reCAPTCHA Troubleshooting

**Error: "Invalid site key"**
- Ensure the site key in your frontend matches what's in the reCAPTCHA admin console
- Check that `localhost` is in the allowed domains list

**Error: "Invalid secret key" or verification fails**
- Double-check `RECAPTCHA_SECRET_KEY` in `.env.local`
- Ensure you're using the **secret** key (not the site key) for server verification

**Error: "Hostname mismatch"**
- Add your domain to the allowed domains in [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
- For local dev, ensure `localhost` is listed

**Challenge not appearing**
- Check browser console for JavaScript errors
- Ensure the site key is correctly passed to the reCAPTCHA widget

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

### OAuth: "Access Denied" Error

**Error:** After clicking "Sign in with Google", you're redirected back with an "Access denied" error.

**Cause:** The email you're signing in with is not in the admin allowlist.

**Solution:** Ensure `ADMIN_ALLOWED_EMAIL` in `.env.local` matches the email you're using:
```bash
ADMIN_ALLOWED_EMAIL=your-email@example.com
```

### OAuth: "redirect_uri_mismatch" Error

**Error:** `Error 400: redirect_uri_mismatch`

**Cause:** The redirect URI in your OAuth client doesn't match the one being used.

**Solution:**
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 client
3. Ensure **Authorized redirect URIs** includes:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://samkirk.com/api/auth/callback/google` (for production)

### OAuth: "invalid_client" Error

**Error:** `Error 401: invalid_client`

**Cause:** The client ID or secret is incorrect.

**Solution:** Double-check `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `.env.local` match exactly what's shown in the Google Cloud Console.

### OAuth: Consent Screen Not Configured

**Error:** `Error 403: access_denied` with message about consent screen

**Solution:** Complete Step 7.1 to configure the OAuth consent screen before testing login.

---

## Next Steps

After completing the setup above:

1. **Configure Vertex AI** for LLM features (when implementing chat tools)
2. **Set up Cloud Run** for deployment (when ready to go live)
3. **Configure GCP Billing Budget** alerts to `sam@samkirk.com` (backstop for $20/month spend cap)

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
- **Account ID:** `[REDACTED]`
- **Status:** Open

```bash
$ gcloud billing accounts list
ACCOUNT_ID            NAME                  OPEN   MASTER_ACCOUNT_ID
[REDACTED]            samkirk-com-billing   True
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

$ gcloud billing projects link samkirk-v3 --billing-account=[REDACTED]
billingAccountName: billingAccounts/[REDACTED]
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

Created `web/.env.local` with all required variables (see Step 5 instructions above for the template). Placeholder values used for credentials not yet configured (reCAPTCHA, OAuth).

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
| **Billing Account** | `samkirk-com-billing` |
| **Region** | `us-central1` |
| **Firestore Database** | `(default)` - Native mode |
| **Private Bucket** | `gs://samkirk-v3-private` |
| **Public Bucket** | `gs://samkirk-v3-public` |
| **ADC Location** | `~/.config/gcloud/application_default_credentials.json` |

### Step 7: Google OAuth for Admin Auth (2026-02-02)

#### 7.1 OAuth Consent Screen

Configured via Google Cloud Console:
- **User type:** External
- **App name:** `samkirk.com Admin`
- **Support email:** `sam@samkirk.com`
- **Test users:** `sam@samkirk.com`

#### 7.2 OAuth 2.0 Client Credentials

Created via Google Cloud Console:
- **Application type:** Web application
- **Name:** `samkirk.com Admin Auth`
- **Authorized JavaScript origins:** `http://localhost:3000`
- **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

> **Note:** Initially created as wrong type (JavaScript app) which doesn't provide a Client Secret. Recreated as "Web application" type to get both Client ID and Client Secret.

#### 7.3-7.4 Environment Variables

Updated `web/.env.local` with:
- `GOOGLE_OAUTH_CLIENT_ID` — from Web application OAuth client
- `GOOGLE_OAUTH_CLIENT_SECRET` — from Web application OAuth client
- `AUTH_SECRET` — generated via `openssl rand -base64 32`
- `ADMIN_ALLOWED_EMAIL` — set to `sam@samkirk.com`

#### 7.5 Admin Login Test

```
1. Started dev server: npm run dev
2. Navigated to http://localhost:3000/admin
3. Redirected to /admin/login (as expected)
4. Clicked "Sign in with Google"
5. Authenticated with sam@samkirk.com
6. Redirected back to /admin dashboard
7. Dashboard shows "Signed in as sam@samkirk.com" with sign-out option
```

**Result:** Admin authentication working correctly. Only `sam@samkirk.com` can access `/admin/**` routes.
