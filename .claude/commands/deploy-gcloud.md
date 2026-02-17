Deploy the application to Google Cloud Run via Cloud Build.

**Prerequisites:**
- GCP authenticated (`gcloud auth login`)
- Artifact Registry repo exists (GCP-DEPLOY.md Step 5)
- Service account and secrets configured (Steps 6-7)

**Steps:**

1. Run `gcloud builds submit --config=cloudbuild.yaml` from the repo root. This builds the Docker image, pushes it to Artifact Registry, and deploys to Cloud Run in one command. Use `timeout: 600000` (10 minutes) as the build can take a few minutes.

2. After the build succeeds, verify the health endpoint:
   ```
   curl https://samkirk.com/api/health
   ```
   Expected: `{"status":"ok","timestamp":"..."}`

3. Report the deployed commit SHA and Cloud Run URL to the user.

**If the build fails:**
- Check the Cloud Build logs: `gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')`
- Common issues: Docker build errors, secret access denied, Artifact Registry permissions
