Deploy the application to Vercel.

**Prerequisites:**
- Vercel authenticated (`vercel whoami`) — if not, tell the user to run `/login-vercel`
- Project linked (`web/.vercel/project.json` exists) — if not, tell the user to run `/login-vercel`
- Changes committed and pushed to GitHub (CI should be green)

**Steps:**

1. Verify the working tree is clean — there should be no uncommitted changes. If there are, stop and ask the user whether to commit first.

2. Deploy using the Vercel MCP `deploy_to_vercel` tool. This deploys the current project state to production.

3. After the deploy completes, get the deployment URL from the MCP response.

4. Verify the deployment is healthy:
   - Use `mcp__vercel__list_deployments` to confirm the latest deployment status is `READY`
   - Use `mcp__vercel__web_fetch_vercel_url` to fetch the `/api/health` endpoint and confirm it returns `{"status":"ok",...}`

5. Open the deployed URL in a new browser tab using the Claude in Chrome extension so the user can visually confirm the site is live.

6. Report the deployment URL, status, and commit SHA to the user.

**If the deploy fails:**
- Use `mcp__vercel__get_deployment_build_logs` to fetch the build logs and diagnose the issue
- Common issues: build errors, missing env vars, function timeout misconfiguration
- Use `mcp__vercel__get_runtime_logs` if the build succeeded but the app is erroring at runtime
