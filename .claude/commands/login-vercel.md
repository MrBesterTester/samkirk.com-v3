Re-authenticate the Vercel CLI and verify the MCP connection.

**Steps:**

1. Check the current Vercel CLI login status:
   ```
   vercel whoami
   ```
   If already authenticated, note the username and skip to step 3.

2. If not authenticated, run:
   ```
   vercel login
   ```
   This opens the browser where the user can authenticate with their passkey (stored in macOS Passwords) or another method. Wait for the login to complete.

3. Verify the project is linked by checking for `.vercel/project.json` in the `web/` directory:
   ```
   cat web/.vercel/project.json
   ```
   If the file does not exist, run from the `web/` directory:
   ```
   vercel link
   ```
   and follow the prompts to link to the existing Vercel project.

4. Verify the Vercel MCP server is connected by confirming `mcp__vercel__list_teams` returns data. If MCP is not connected, tell the user to run `/mcp` and select `vercel`.

5. Report the authenticated user, linked project (if any), and MCP status to the user.
