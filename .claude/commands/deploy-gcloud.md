Deploy the application to Google Cloud Run via Cloud Build.

**Prerequisites:**
- GCP authenticated (`gcloud auth login`)
- Artifact Registry repo exists (GCP-DEPLOY.md Step 5)
- Service account and secrets configured (Steps 6-7)
- Changes committed and pushed to GitHub (CI should be green)

**Steps:**

1. Verify the working tree is clean — there should be no uncommitted changes. If there are, stop and ask the user whether to commit first.

2. Run the Cloud Build submit command from the repo root. The `COMMIT_SHA` substitution is required because `$COMMIT_SHA` is only auto-populated by Cloud Build triggers, not by `gcloud builds submit`:
   ```
   gcloud builds submit --config=cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
   ```
   Use `timeout: 600000` (10 minutes) as the build can take a few minutes.

3. After the build succeeds, get the Cloud Run service URL and verify the health endpoint:
   ```
   CLOUD_RUN_URL=$(gcloud run services describe samkirk-v3 --region=us-central1 --format='value(status.url)')
   curl "${CLOUD_RUN_URL}/api/health"
   ```
   Expected: `{"status":"ok","timestamp":"..."}`

4. Report the deployed commit SHA and Cloud Run URL to the user.

**If the build fails:**
- Check the Cloud Build logs: `gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')`
- Common issues: Docker build errors, secret access denied, Artifact Registry permissions
