Reconnect the Claude in Chrome browser extension when it loses connection to Claude Code.

**Steps:**

1. Test the connection by calling `tabs_context_mcp` (with `createIfEmpty: true`).

2. If the connection works, report success and exit.

3. If the connection fails with "Browser extension is not connected":
   a. Tell the user: "Chrome extension disconnected. Attempting to reconnect..."
   b. Run the `/chrome` CLI command to re-establish the native messaging connection.
   c. Wait 3 seconds, then retry `tabs_context_mcp`.

4. If still failing after `/chrome`:
   a. Check that the native messaging host config exists:
      - macOS Chrome: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
      - macOS Edge: `~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
   b. Check that the binary it points to exists and is executable.
   c. Check if Chrome is running (`pgrep -f "Google Chrome"`).
   d. Check if Claude Desktop is running (`pgrep -f "Claude"`) — it can hijack the native messaging connection.

5. Report findings and suggest fixes:
   - If Claude Desktop is running: "Quit Claude Desktop (it hijacks the Chrome connection), then restart Chrome."
   - If native host config is missing: "Run `claude --version` to verify Claude Code is installed, then restart Chrome."
   - If Chrome is not running: "Start Chrome first."
   - If everything looks correct but still fails: "Quit Chrome completely (Cmd+Q), restart it, then run `/reconnect-chrome` again."
