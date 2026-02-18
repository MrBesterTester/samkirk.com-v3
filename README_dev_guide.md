# Developer Guide

This is the day-to-day reference for samkirk-v3 development. It covers the AI-assisted development methodology, test suites, CLI commands, automated workflows via `/do-work`, manual verifications, and release qualification.

---

## Table of Contents

- [Development Methodology](#development-methodology)
  - [Dylan Davis: The Three-Document System](#dylan-davis-the-three-document-system)
  - [Matt Maher: Claude Code Meta-Programming](#matt-maher-claude-code-meta-programming)
  - [The Bridge: /ingest-todo](#the-bridge-ingest-todo)
  - [Source Materials](#source-materials)
- [Local Development](#local-development)
- [Deploying to Production](#deploying-to-production)
- [Deploying to Vercel](#deploying-to-vercel)
- [Cheat Sheet — Slash Commands](#cheat-sheet--slash-commands)
  - [do-work (task queue)](#do-work-task-queue)
  - [do-work companions](#do-work-companions)
  - [Dylan Davis methodology](#dylan-davis-methodology)
  - [Utilities](#utilities)
- [Test Suites at a Glance](#test-suites-at-a-glance)
- [Running Tests](#running-tests)
  - [Commands](#commands)
  - [Prerequisites](#prerequisites)
  - [First Run (Incremental)](#first-run-incremental)
  - [Viewing Previous Results](#viewing-previous-results)
    - [Test Fixtures](#test-fixtures)
- [Release Qualification](#release-qualification)
- [Writing a New Test](#writing-a-new-test)
- [Fixing or Rewriting a Test](#fixing-or-rewriting-a-test)
- [Triage Workflows](#triage-workflows)
- [Manual Verifications](#manual-verifications)
- [Planned Test Work](#planned-test-work)
- [Manual Fallback](#manual-fallback)
- [Conventions](#conventions)
- [Chrome Extension Setup (Claude in Chrome)](#chrome-extension-setup-claude-in-chrome)
- [Reference Documents](#reference-documents)

---

## Development Methodology

This project was built entirely with AI-assisted development, blending two complementary methodologies into a single workflow. Understanding these techniques is useful both for contributing to this codebase and for applying the same patterns to your own projects.

**How the agents were actually used:** All AI work was single-threaded — one agent call at a time, with Claude often spawning isolated subagents (e.g., `/do-work` processing a REQ in a fresh sub-agent context). No full team or multi-agent workflows were used; agents never communicated directly with each other. The only exception was Cursor's Review agent, which spent most of its time complaining about `/do-work`.

**Practical parallelism with `/do-work`:** Despite the single-threaded approach, `/do-work` made parallel work easy. Each REQ is a clearly identified task with its own separate commit, so running multiple Claude Code sessions on different REQs was straightforward. When `/ingest-todo` processes a large Dylan Davis TODO, it creates a series of REQs (one per TODO step) grouped under a single UR (user request), keeping the work well organized. In practice, processing about 3 REQs per session comfortably stayed near the 40% context remaining limit.

### Dylan Davis: The Three-Document System

Dylan Davis's method (from his video ["I've Built 50+ Apps with AI"](https://youtu.be/99FI5uZJ8tU)) structures every project around three documents that serve as an extended memory system for AI:

| Document | Question it answers | How it's created |
|----------|-------------------|-----------------|
| **SPECIFICATION.md** | *What* are we building? | AI-led interview — one question at a time, 15-20 rounds |
| **BLUEPRINT.md** | *How* do we build it? | High-end model generates phased plan with embedded prompts |
| **TODO.md** | *Where* are we now? | Checklist extracted from the blueprint, with model labels |

The core insight is that AI memory decays over long conversations. By externalizing the plan into three files, each new conversation starts fresh but retains full context — the spec grounds it in requirements, the blueprint provides architecture, and the TODO shows progress. Steps are worked through one at a time (`/start-step 2.1`, `/continue-step 2.2`), with a fresh AI context per step to avoid instruction drift.

This project used the three-document pattern five times for different scopes (V1 core, V2 visual upgrade, master test suite, hire-me unification, and more). See the [Document Sets at a Glance](docs/README.md#document-sets-at-a-glance) table for the full inventory.

Although I have yet to use the almighty ChatGPT-5.3 Codex which goes off by itself for a very long time, I can't imagine not using Dylan Davis's method for such long excursions by a chatbot on my dime. ChatGPT Codex tells me: "I'll do it right the first time, but you better be sure about what you're asking for the very first time!"

### Matt Maher: Claude Code Meta-Programming

Matt Maher's techniques (from his videos ["6 Techniques"](https://www.youtube.com/watch?v=kf6h6DOPjpI) and ["Most Powerful Pattern"](https://www.youtube.com/watch?v=I9-tdhxiH7w)) distill thousands of hours of real AI-assisted work into six practices:

1. **Voice, Not Text** — Talk instead of typing; raw transcripts preserve intent that self-editing strips out
2. **Folder Workspace** — Treat folders as durable workspaces, not ephemeral chat threads
3. **Verify Plans** — Force AI to grade its own plans against requirements (catches ~40% of silently dropped items)
4. **Clear Context** — Fresh context per feature prevents instruction decay
5. **Walk Away (Autonomous)** — Build workflows that run for hours unattended with full traceability
6. **Build Your Tools** — Create custom skills and scripts through conversation

The culmination is the **do-work** pattern ([GitHub](https://github.com/bladnman/do-work)), which implements practices #2, #4, and #5 as an autonomous work queue. A two-terminal setup lets you capture requests on one side (`do work fix the header overflow`) while Claude builds on the other (`do work run`), processing each request in a fresh sub-agent context with automatic git commits.

### The Bridge: /ingest-todo

The two methodologies are naturally compatible — Dylan Davis provides planning structure, Matt Maher provides autonomous execution. The bridge between them is the `/ingest-todo` skill:

```
┌─────────────────────────────────────────────────────┐
│  Dylan Davis (Planning Layer)                       │
│                                                     │
│  SPECIFICATION.md → BLUEPRINT.md → TODO.md          │
│       (what)           (how)        (checklist)     │
└──────────────────────────┬──────────────────────────┘
                           │
                 /ingest-todo (bridge)
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  do-work (Execution Layer)                          │
│                                                     │
│  REQ-001 → REQ-002 → REQ-003 → ... → REQ-018      │
│   (0.1)     (0.2)     (1.1)           (5.3)        │
│                                                     │
│  do work run → triage → explore → build → commit   │
│       │                                    │        │
│       └──── loop until queue empty ────────┘        │
└──────────────────────────┬──────────────────────────┘
                           │
                 /sync-todo (checkbox sync)
                           │
                           ▼
                TODO.md checkboxes updated
```

Each numbered step in a Dylan Davis TODO becomes one do-work REQ file, with frontmatter linking back to the source step, blueprint reference, and model hint. After the queue is processed, `/sync-todo` checks off the corresponding TODO items.

**The combined workflow:**

```bash
# 1. Plan (Dylan Davis)
/create-spec          # AI-led specification interview
/create-blueprint     # Generate phased implementation plan
/create-todo          # Extract checklist with model labels

# 2. Ingest (bridge)
/ingest-todo docs/TODO.md
do work verify        # Confirm REQ files match intent

# 3. Execute (do-work)
do work run           # Autonomous processing — walk away

# 4. Sync back
/sync-todo docs/TODO.md
```

Ad-hoc work (bugs, ideas, small features) goes directly into `/do-work` without a spec/blueprint/todo cycle: `do work add dark mode toggle`.

### Source Materials

The original methodology documents are available in two forms:

**HTML study guides** (closer to the original authors' presentations — good starting points):
- Dylan Davis: [`REFERENCES/Dylan-Davis-50plus-method.html`](REFERENCES/Dylan-Davis-50plus-method.html) — interactive transcription of the 16-minute video
- Matt Maher: [`REFERENCES/Matt-Maher_Claude-Code.html`](REFERENCES/Matt-Maher_Claude-Code.html) — six practices + do-work pattern with diagrams

**Extended project versions** (adapted for this codebase with Cursor/Claude Code commands and project-specific conventions):
- [`docs/Dylan-Davis-50plus-method.md`](docs/Dylan-Davis-50plus-method.md) — full methodology with slash commands, git workflow, and a complete Phase 0-6 meta-checklist
- [`docs/Matts-integration-with-Dylan-plan-samkirk-v3.md`](docs/Matts-integration-with-Dylan-plan-samkirk-v3.md) — the integration plan that designed the bridge

For a narrative walkthrough of all project documentation, see [`docs/README.md`](docs/README.md).

---

## Local Development

Install dependencies and start the dev server:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`. If the dev server gets into a bad state (stale cache, Turbopack errors), use `/restart-dev-server` which cleans `.next`, rebuilds, and restarts.

**Using Claude in Chrome:** Once the [Chrome extension is set up](#chrome-extension-setup-claude-in-chrome), ask Claude to bring up the app on Chrome at `localhost:3000`. Claude will open a new tab (replacing any stale one) and navigate to the dev server. If the dev server needs a full rebuild, ask Claude to restart it first (`rm -rf web/.next && cd web && npm run dev`).

---

## Deploying to Production

The site is deployed to **Vercel** with auto-deploy on push. GCP provides backend services only (Firestore, Cloud Storage, Vertex AI).

> **Cloud Run (decommissioned):** The site was previously on Cloud Run. See `docs/GCP-DEPLOY.md` for historical reference and GCP backend service setup (IAM, secrets, etc.).

### How the pipeline works

```
npm run test:all → /ship → push to main → GitHub Actions CI → Vercel auto-deploy
                                             (gitleaks, CodeQL,     (build, deploy,
                                              type check, lint,      SSL, CDN)
                                              build)
```

Pushing to `main` triggers two things automatically:
1. **GitHub Actions CI** — gitleaks secret scan, CodeQL analysis, type check, lint, production build
2. **Vercel auto-deploy** — builds and deploys the site, provisions SSL, serves via CDN

### Standard release workflow

```bash
npm run test:all    # 1. run tests locally
/ship               # 2. the rest is automated (see below)
```

`/ship` walks through the full pipeline:

| Step | What happens | If it fails |
|------|-------------|-------------|
| Pre-flight | Confirms tests have passed | Stops — run `npm run test:all` first |
| Commit | Stages changes, creates commit | Stops — nothing to push |
| Gitleaks scan | Scans for secrets locally | Stops — fix the leak before pushing |
| Push | `git push origin main` | Stops — resolve git issues |
| Monitor CI | Tails GitHub Actions until complete | Shows failed logs and stops |
| Monitor Vercel | Polls deployment until `READY` | Shows build logs and stops |
| Health check | Fetches `/api/health` on production | Reports failure |
| Visual confirm | Opens the live site in Chrome | — |

### Other deploy commands

| Command | When to use it |
|---------|---------------|
| `/watch-deploy` | You've already pushed and want to check CI + Vercel status |
| `/deploy-vercel` | Manual override — bypasses CI/CD pipeline (hotfixes, GitHub integration down) |

### Prerequisites

| Prerequisite | Check | Setup |
|---|---|---|
| Vercel CLI | `vercel whoami` | `npm i -g vercel && vercel login` |
| Project linked | `cat web/.vercel/project.json` | `cd web && vercel link` |
| Vercel MCP | `/mcp` → select `vercel` | Add to `.mcp.json` (see below) |

The MCP server is configured in `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    }
  }
}
```

### Authentication

```bash
/login-vercel
```

This verifies CLI auth, project linking, and MCP connectivity in one step. The browser auth flow supports passkeys stored in macOS Passwords.

### Preview deployments

Preview deployments (non-production) are created automatically for non-main branches, or manually:

```bash
cd web && vercel
```

### Vercel MCP Capabilities

The Vercel MCP server (`mcp__vercel__*` tools) provides:

| Capability | Tool | Example use |
|---|---|---|
| Deploy | `deploy_to_vercel` | Manual deploy (bypasses CI/CD) |
| Build logs | `get_deployment_build_logs` | Debug a failed deployment |
| Runtime logs | `get_runtime_logs` | Investigate production errors |
| Project info | `get_project`, `list_projects` | Check project config |
| Deployments | `list_deployments`, `get_deployment` | Review deployment history |
| Protected URLs | `web_fetch_vercel_url` | Fetch auth-protected preview URLs |
| Docs search | `search_vercel_documentation` | Look up Vercel platform features |

### Troubleshooting

```bash
# Check CLI auth
vercel whoami

# Check project link
cat web/.vercel/project.json

# List recent deployments
vercel ls

# View build logs for latest deployment (via MCP)
# Ask Claude: "show me the build logs for the latest deployment"

# Re-authenticate if token expired
vercel login
```

---

## Cheat Sheet — Slash Commands

All custom slash commands available in this project.

### do-work (task queue)

| Command | What it does |
|---------|-------------|
| `do work <description>` | Capture a new request (bug, feature, idea) |
| `do work run` | Process the pending queue |
| `do work run --limit N` | Process at most N requests, then stop |
| `do work list` | Show pending, in-progress, held, and archived counts |
| `do work verify` | Evaluate captured REQs against original input |
| `do work cleanup` | Consolidate archive, close completed URs |
| `do work changelog` | Show release notes (newest first) |
| `do work version` | Check for updates |

Aliases: `run`/`go`/`start`, `list`/`status`/`queue`, `verify`/`check`/`evaluate`, `cleanup`/`tidy`/`consolidate`.

### do-work companions

| Command | What it does |
|---------|-------------|
| `/do-work-finish-then-stop` | Finish the current REQ and stop the queue |
| `/ingest-todo` | Parse a Dylan Davis TODO.md into do-work REQ files |
| `/sync-todo` | Sync archived do-work results back to TODO.md checkboxes |

### Dylan Davis methodology

| Command | What it does |
|---------|-------------|
| `/create-spec` | Create a SPECIFICATION.md |
| `/create-blueprint` | Create a BLUEPRINT.md |
| `/create-todo` | Create a TODO.md |
| `/start-step` | Begin a TODO step manually (human-in-the-loop) |
| `/continue-step` | Resume a TODO step where you left off |

### Utilities

| Command | What it does |
|---------|-------------|
| `/restart-dev-server` | Rebuild and start the Next.js dev server on localhost:3000 |
| `/login-gcloud` | Set up GCP Application Default Credentials (for local dev/tests) |
| `/login-vercel` | Authenticate Vercel CLI + verify MCP connection |
| `/ship` | Commit + gitleaks scan + push + monitor CI + Vercel auto-deploy + health check |
| `/watch-deploy` | Monitor CI and Vercel deployment status (no commit/push) |
| `/deploy-vercel` | Manual Vercel deploy via MCP (bypasses CI/CD pipeline — use for hotfixes) |

---

## Test Suites at a Glance

| Suite | Framework | Command | Files | GCP? |
|-------|-----------|---------|-------|------|
| Unit | Vitest | `npm test` | `web/src/**/*.test.ts` | No |
| E2E | Playwright | `npm run test:e2e` | `web/e2e/**/*.spec.ts` | No |
| E2E Real LLM | Custom script | `npm run test:e2e:real` | `web/scripts/e2e-real-llm.ts` | Yes |
| GCP Smoke | Custom script | `npm run smoke:gcp` | `web/scripts/smoke-gcp.ts` | Yes |

All four suites are orchestrated by the master test runner (`npm run test:all`), which auto-detects GCP credentials and skips GCP-dependent suites when credentials are unavailable.

---

## Running Tests

### Commands

**Dev server** (rebuild and start on localhost:3000):

```
/restart-dev-server
```

Use this whenever you need a fresh dev server — it cleans the `.next` cache, rebuilds, and starts Next.js. Handy after pulling changes, switching branches, or when the dev server gets into a bad state.

**Full run** (auto-detects GCP):

```bash
npm run test:all
```

**Individual suites:**

```bash
npm run test:all -- --unit        # Unit tests only
npm run test:all -- --e2e         # Playwright E2E only
npm run test:all -- --e2e-real    # Real LLM E2E (requires GCP + seeded resume)
npm run test:all -- --smoke       # GCP smoke tests only
```

**Setting up GCP credentials:**

The E2E Real LLM and GCP Smoke suites require Application Default Credentials (ADC):

```bash
# Check if already set up (prints a token if valid):
gcloud auth application-default print-access-token

# If the above fails, set up credentials and verify:
gcloud auth application-default login
gcloud auth application-default print-access-token

# To log out / clean up credentials:
gcloud auth application-default revoke
```

For full GCP project setup (Firestore, Cloud Storage, environment variables), see [`docs/GCP-SETUP.md`](docs/GCP-SETUP.md).

**Controlling GCP behavior:**

```bash
npm run test:all -- --no-gcp      # Force-skip all GCP-dependent tests
npm run test:all -- --gcp         # Force-include GCP tests (fail if credentials are bad)
```

**Debugging:**

```bash
npm run test:all -- --verbose             # Stream child process stdout in real time
npm run test:all -- --e2e --verbose       # Stream E2E output for debugging
npm run test:e2e:ui                       # Playwright UI mode (interactive)
```

**Dry run (skip archive):**

```bash
npm run test:all -- --no-archive
```

**E2E against Vercel preview deployments:**

```bash
PLAYWRIGHT_BASE_URL=https://samkirk-com-v3-<hash>-sam-kirks-projects.vercel.app \
  VERCEL_AUTOMATION_BYPASS_SECRET=<secret> \
  npx playwright test
```

When `PLAYWRIGHT_BASE_URL` is set, Playwright skips the local dev server and tests against the remote URL. When `VERCEL_AUTOMATION_BYPASS_SECRET` is also set, the config automatically passes `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie` headers to bypass Vercel Deployment Protection.

The bypass secret is stored in `web/.env.local` (gitignored) and matches the Protection Bypass for Automation secret configured in Vercel project settings. Preview deployments also have `NEXT_PUBLIC_E2E_TESTING=true` and `E2E_TESTING=true` set (Preview environment only, not Production) so the captcha auto-passes.

**Known flakiness against remote deployments:** LLM-dependent tests (fit-tool full flows, resume-tool generation, interview-tool conversations) may time out against Vercel due to cold starts and network latency. The current timeouts (4-5 minutes) are tuned for localhost. For reliable remote testing, consider increasing `timeout` values in these specs or running with retries (`--retries 1`). As of 2026-02-17, 48/55 tests pass against Vercel preview; the 7 failures are all LLM timeout flakes, not infrastructure issues.

### Prerequisites

The Playwright E2E tests (`--e2e`) use system Chrome directly — they do **not** require the Claude in Chrome extension or the Playwright MCP server (those are development tools for AI-assisted debugging, not test dependencies). No manual dev server is needed — Playwright starts one automatically with captcha bypass enabled.

**Important:** Chrome must be running before you start E2E tests. Playwright uses `channel: "chrome"` (system Chrome) and will hang silently if Chrome is not running. If a run appears stuck at `→ Running E2E Tests...` with no progress, launch Chrome and try again.

**Performance tip:** E2E tests run noticeably faster right after a computer restart (fresh Chrome with no accumulated state, tabs, or extensions loaded).

| Prerequisite | Check if done | Setup (if needed) |
|---|---|---|
| Google Chrome | `open -Ra "Google Chrome" && echo OK` | [Install Chrome](https://www.google.com/chrome/) |
| Node dependencies | `ls web/package-lock.json` | `cd web && npm install` |
| `.env.local` exists | `test -f web/.env.local && echo OK` | `cp web/.env.local.example web/.env.local` and fill in values |
| GCP credentials (ADC) | `gcloud auth application-default print-access-token > /dev/null && echo OK` | `gcloud auth application-default login` |

For the **Real LLM E2E** suite (`--e2e-real`), these prerequisites are handled automatically:

| Prerequisite | Automated? | Manual fallback |
|---|---|---|
| Seeded resume | **Yes** — auto-seeds via `seed-resume.ts` if missing | `cd web && npm run seed:resume` |
| Vertex AI API enabled | **Detected** — pauses and prompts you to enable, then retries on Enter | `gcloud services enable aiplatform.googleapis.com` |

Real LLM tests cost ~$0.03–0.15 per run in Vertex AI tokens.

### First Run (Incremental)

If this is your first time running the tests, work through the suites one at a time instead of running everything at once. This makes it easier to isolate setup issues.

**Step 1 — Unit tests** (no external dependencies):

```bash
npm run test:all -- --unit
```

**Step 2 — E2E without GCP** (needs Chrome only):

```bash
npm run test:all -- --e2e --no-gcp
```

**Step 3 — GCP smoke tests** (needs ADC + `.env.local`):

```bash
npm run test:all -- --smoke
```

**Step 4 — Real LLM E2E** (auto-seeds resume; needs Vertex AI API enabled):

```bash
npm run test:all -- --e2e-real
```

Fix any failures at each step before moving to the next. Once all four pass individually, confirm they work together:

```bash
npm run test:all
```

### Viewing Previous Results

See [`docs/TEST-RESULTS.md`](docs/TEST-RESULTS.md) for detailed test results and verification evidence.

Use `npm run test:results` to inspect archived test runs. This replaces manual `ls` + `cat` commands against the archive directory.

**Command reference:**

```bash
npm run test:results                         # Latest run summary + fixture updates
npm run test:results -- --list               # All archived runs
npm run test:results -- --full               # Latest with test index
npm run test:results -- --run 2026-02-09     # Specific run (partial timestamp match)
npm run test:results -- --log e2e-tests      # Raw E2E log output
npm run test:results -- --fixtures           # Fixture inventory
npm run test:results -- --fixtures show      # Open fixture gallery in browser
npm run test:results -- --diff               # Compare last two runs
npm run test:results -- --json               # Machine-readable JSON output
```

The most useful of these is `npm run test:results -- --fixtures show`, which serves the fixture gallery at `localhost:8123` and opens it in your browser — a side-by-side view of real inputs and outputs for every tool.

**Common workflows:**

| Task | Command |
|------|---------|
| Check latest results | `npm run test:results` |
| Compare runs after a fix | `npm run test:results -- --diff` |
| Debug a suite failure | `npm run test:results -- --log <suite>` |
| See what fixtures changed | `npm run test:results -- --fixtures` |
| Browse fixtures in browser | `npm run test:results -- --fixtures show` |

**Other tools:**

```bash
# Playwright HTML report (E2E only, viewable in browser):
npx playwright show-report web/playwright-report

# Playwright last-run status (E2E only):
# File: web/test-results/.last-run.json
```

Each `test:all` run archives a `summary.md` with pass/fail counts, durations, and a test index, plus per-suite `.log` files with full output. The summary is committed; logs are gitignored.

#### Test Fixtures

Real inputs and outputs from each tool are saved in `web/test-fixtures/`. Each subdirectory has a README with a data-flow diagram and file descriptions. Browse these to understand what the tools produce without re-running tests. Fixture updates now appear automatically in test run summaries when you run `npm run test:results`.

| Directory | Tool | Key files |
|-----------|------|-----------|
| [`interview-chat/`](web/test-fixtures/interview-chat/README.md) | Interview Tool | `e2e-real-llm-transcript.md` (real Vertex AI output), `conversation-transcript.md` (smoke test), `test-questions.json` |
| [`resume-generator/`](web/test-fixtures/resume-generator/README.md) | Custom Resume | `e2e-generated-resume.md` (real Vertex AI output), `generated-resume.html` (styled HTML), `job-description.txt` |
| [`fit-report/`](web/test-fixtures/fit-report/README.md) | How Do I Fit? | `generated-report.md` (final report), `llm-response.json` (raw LLM output), `extracted-fields.json` |

---

## Release Qualification

To run a release-qualifying test suite, use the `--release` flag:

```bash
npm run test:all -- --release --ref UR-XXX/REQ-YYY
```

Release mode enforces the following rules:

- **GCP credentials are required.** The runner fails immediately if credentials are missing.
- **All four suites run.** Selective filtering (`--unit`, `--e2e`, etc.) is not allowed.
- **Skipped tests count as failures.** Every test must pass or the run fails.
- **Manual verification checklist is printed** after all automated suites complete:
  - VER-001: Visual inspect resume PDF layout
  - VER-002: OAuth flow in fresh browser session
  - VER-003: Cloud Run deployment serves traffic
- **Results are archived** to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/` with `release_candidate: true` in the summary frontmatter.

After the automated suites pass, work through the manual verification checklist (see [Manual Verifications](#manual-verifications) below), then commit the evidence:

```bash
git add do-work/archive/test-runs/ && git commit -m "test: release run for UR-XXX/REQ-YYY"
```

For full verification procedures, see `docs/verification-registry.md`.

---

## Writing a New Test

To write a new test using `/do-work`, describe what needs testing:

```bash
do work write tests for [feature description]
```

For example:

```bash
do work write tests for the rate limiting middleware - cover bypass for admin users,
  per-IP limits, and the 429 response format. Use real Firestore if GCP is available,
  with skip guard fallback.
```

Verify the request was captured correctly, then process the queue:

```bash
do work verify
do work run
```

The sub-agent will automatically:

1. Explore the codebase to find the right suite, framework, and file location
2. Write the test following project conventions
3. Add a test catalog entry to `docs/test-catalog.md` and update `docs/feature-test-matrix.md`
4. Run the test and confirm it passes
5. Commit everything together

After the run completes, confirm no regressions:

```bash
npm run test:all
```

**Conventions the sub-agent follows:**

- Real data preferred over mocks; skip guards for GCP-dependent tests
- Mock-based versions are separate tests, not replacements for real-data tests
- Strict TypeScript, no `any`
- Descriptive `describe`/`test` names

---

## Fixing or Rewriting a Test

To fix a broken test:

```bash
do work fix [description of what's wrong and how to fix it]
```

To rewrite a test (for example, converting a redundant integration test to a focused unit test):

```bash
do work rewrite [file] "[test name]" - [explanation of why and what it should become]
```

To delete a test, provide explicit instructions including which catalog entries to remove and confirmation that no feature-test matrix rows will become empty:

```bash
do work delete [file] tests [numbers] - [explanation of coverage by other tests].
  Remove catalog entries TEST-XXX through TEST-YYY and update the feature-test matrix.
  Confirm no feature rows become empty.
```

In all cases, verify the request before processing:

```bash
do work verify
do work run
```

The sub-agent updates the test catalog and feature-test matrix as part of the same commit.

---

## Triage Workflows

**Ad-hoc triage** (for individual tests or small batches):

```bash
do work triage [test file] tests [numbers]: [description of suspected issues and
  evaluation criteria for each test]
```

For example:

```bash
do work triage route.test.ts tests 1-3: test 1 may duplicate smoke-gcp Section 1,
  test 2 could be mock-based, test 3 should be a pure unit test.
```

**Formalized triage** (full traceability through a TODO cycle): use the [Planned Test Work](#planned-test-work) workflow with `docs/master-test-TODO.md`.

After triage decisions are applied, confirm no regressions:

```bash
npm run test:all
```

---

## Manual Verifications

Manual verifications are human-performed checks that cannot be fully automated. They are tracked in `docs/verification-registry.md`.

During a release run (`npm run test:all -- --release`), the runner prints:

```
Manual Verifications Pending:
[ ] VER-001: Visual inspect resume PDF layout
[ ] VER-002: OAuth flow in fresh browser session
[ ] VER-003: Cloud Run deployment serves traffic
```

For each verification, open the corresponding entry in `docs/verification-registry.md`, follow the procedure, and record the result.

If a verification fails, drop it into `/do-work`:

```bash
do work VER-002 failed: OAuth flow redirects to a 404 after Google consent screen.
  Expected redirect to /dashboard. Investigate and fix.
```

To create a new verification entry:

```bash
do work create a new manual verification VER-004 for [description].
  Add it to docs/verification-registry.md with full metadata and update
  docs/feature-test-matrix.md.
```

---

## Planned Test Work

When test engineering is part of a larger TODO cycle, ingest the TODO, process the queue, and sync results:

```bash
/ingest-todo docs/master-test-TODO.md
do work verify
do work run
/sync-todo docs/master-test-TODO.md
```

Confirm everything passes after completion:

```bash
npm run test:all
```

---

## Manual Fallback

For steps that need a human in the loop — visual testing, interactive debugging, or judgment calls about test design — use the manual workflow:

```bash
start step X.Y master-test        # Begin a step manually with full doc context
continue step X.Y master-test     # Resume where you left off
```

These commands read the SPECIFICATION, BLUEPRINT, and TODO for context, then walk through the step interactively. Prefer `/do-work` for everything else.

---

## Conventions

- **Unit tests**: `*.test.ts` files, co-located with their source files under `web/src/`
- **E2E tests**: `*.spec.ts` files in `web/e2e/`
- **Real data over mocks**: Never mock both resume data AND LLM responses in the same test
- **Skip guards**: GCP-dependent tests use skip guards so they pass cleanly without credentials
- **Strict TypeScript**: No `any` types
- **Archive structure**: Test run archives go to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/` with `summary.md` (committed) and `*.log` (gitignored)
- **Git workflow**: Push directly to `main` — no squash, no intermediate branches. Run `gitleaks detect --source .` before pushing; CI runs gitleaks + CodeQL as a second gate. Use `git-filter-repo` only for one-time retroactive history scrubs.

---

## Chrome Extension Setup (Claude in Chrome)

The Claude in Chrome extension lets Claude Code control a real Chrome browser — navigating pages, clicking elements, filling forms, reading console logs, and taking screenshots. This is used for UI debugging, visual inspection, and browser-based development tasks (not for running E2E tests, which use Playwright directly).

### Prerequisites

| Prerequisite | Details |
|---|---|
| Google Chrome | Must be installed and running |
| Claude Code CLI | Version 2.0.73+ (`claude --version`) |
| Anthropic plan | Direct Anthropic paid plan (Pro, Max, Teams, or Enterprise). Not available via AWS Bedrock or Google Vertex AI |

### Step 1: Install the Extension

1. Open Chrome
2. Go to the [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) on the Chrome Web Store
3. Click **"Add to Chrome"** and grant the requested permissions
4. Sign in with your Claude account when prompted
5. Pin the extension: click the puzzle piece icon in Chrome's toolbar, then click the thumbtack next to "Claude"

Extension version 1.0.36 or higher is required.

### Step 2: Connect Claude Code to Chrome

**Option A — Launch with the flag:**

```bash
claude --chrome
```

**Option B — Enable from an existing session:**

```
/chrome
```

### Step 3: Verify the Connection

1. Run `/chrome` inside Claude Code to check connection status
2. Run `/mcp` and select `claude-in-chrome` to see available browser tools
3. Test it: ask Claude to navigate to `localhost:3000` and report any console errors

### Step 4: Enable by Default (Optional)

To skip passing `--chrome` every time:

1. Inside a Claude Code session, run `/chrome`
2. Select **"Enabled by default"**

Note: Enabling by default increases context usage since browser tools are always loaded. Use `--chrome` on demand if context is a concern.

### Troubleshooting

| Problem | Fix |
|---|---|
| Extension not detected | Verify it's enabled at `chrome://extensions`. Restart Chrome so it picks up the native messaging host config |
| Connection drops mid-session | The extension's service worker went idle. Run `/chrome` → "Reconnect extension" |
| Browser not responding | A JS dialog (alert/confirm) may be blocking. Dismiss it manually in Chrome, then continue |
| "No tab available" error | Ask Claude to create a new tab (`tabs_create_mcp`) and retry |

The native messaging host config lives at:

```
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json
```

If this file is missing, reinstall or update Claude Code (`claude update`), then restart Chrome.

---

## Reference Documents

- [`docs/TEST-RESULTS.md`](docs/TEST-RESULTS.md) — Detailed test results and verification evidence
- [`docs/test-catalog.md`](docs/test-catalog.md) — Test inventory with metadata for all tests
- [`docs/feature-test-matrix.md`](docs/feature-test-matrix.md) — Feature-to-test mapping
- [`docs/verification-registry.md`](docs/verification-registry.md) — Manual verification procedures
- [`docs/master-test-SPECIFICATION.md`](docs/master-test-SPECIFICATION.md) — Full test requirements
- [`docs/master-test-BLUEPRINT.md`](docs/master-test-BLUEPRINT.md) — Implementation details
- [`REFERENCES/Dylan-Davis-50plus-method.html`](REFERENCES/Dylan-Davis-50plus-method.html) — Interactive study guide for the Dylan Davis 50+ method
- [`REFERENCES/Matt-Maher_Claude-Code.html`](REFERENCES/Matt-Maher_Claude-Code.html) — Interactive study guide for Matt Maher's Claude Code meta-programming techniques
