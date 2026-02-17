Re-authenticate the Vercel CLI and verify the MCP connection.

**Steps:**

1. Tell the user: "A browser tab will open for Vercel OAuth — select **Other** login option, then **Passkey**, OK with Touch ID, then click **OK** to authorize the device."
   Then run `vercel login` to authenticate (always run this, even if already logged in):
   ```
   vercel login
   ```
   Wait for the login to complete.

2. After login completes, open a new browser tab to `https://vercel.com` using the Claude in Chrome extension so the user can visually confirm they are logged into their Vercel dashboard.

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
