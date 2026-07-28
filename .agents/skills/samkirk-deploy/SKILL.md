---
name: samkirk-deploy
description: "Operate samkirk-v3 development and deployment workflows: restart the Next.js dev server, authenticate gcloud or Vercel, ship tested changes through GitHub Actions to Vercel, monitor CI/deployment, or perform an explicitly requested emergency manual Vercel deploy. Use when the user says ship, deploy, watch deploy, restart the dev server, login to Vercel, or login to gcloud in this project."
---

# Samkirk Deploy

## Route and load the source workflow

Read the matching historical command completely before acting:

- Standard production ship: `.claude/commands/ship.md`
- Monitor only: `.claude/commands/watch-deploy.md`
- Emergency manual deploy: `.claude/commands/deploy-vercel.md`
- Vercel authentication: `.claude/commands/login-vercel.md`
- GCP authentication: `.claude/commands/login-gcloud.md`
- Local server restart: `.claude/commands/restart-dev-server.md`

## Codex adaptations

1. Use current repository state and available tools. Prefer `gh` and `vercel` CLIs for CI/deployment facts; use the `browser` skill for visual confirmation and the `computer-use` skill for unavoidable macOS/browser authentication UI.
2. Do not assume Claude-specific Chrome or Vercel MCP tools exist. If an equivalent tool is unavailable, use the documented CLI or report the missing verification rather than fabricating it.
3. Standard `ship` is authorized only by an explicit user request to ship/push/deploy. Confirm the required test suite passed, review the exact staged scope, run `gitleaks detect --source .`, push only the intended branch, then monitor CI through completion. Stop on any test, secret scan, CI, or deploy failure.
4. Treat the emergency manual deploy as a production override. Use it only when the user explicitly asks for the emergency/manual path and the CI route is unsuitable. Confirm the target and clean commit before `vercel --prod`, then verify the returned deployment.
5. Monitor-only mode never commits, pushes, redeploys, cancels, reruns, or changes configuration.
6. Authentication commands may open browser/Keychain prompts. Keep the browser visible, never expose credentials, and let the user complete passkey, OAuth, or Keychain confirmation.
7. For a dev-server restart, resolve the exact listener on port 3000, terminate only that process, clear only `web/.next`, start `npm run dev` in `web/`, and verify the server responds.
8. Report commit SHA, branch, CI URL/status, deployment URL/status, and any verification gaps. Use `pushover-notify` when shipping, deployment, or a saved review point completes.
