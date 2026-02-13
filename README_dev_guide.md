# Developer Guide — Testing Workflows

This is the day-to-day reference for running, writing, and managing tests in samkirk-v3. It covers the test suites, CLI commands, automated workflows via do-work, manual verifications, and release qualification.

---

## Table of Contents

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
- [Reference Documents](#reference-documents)

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

### Prerequisites

The Playwright E2E tests (`--e2e`) use system Chrome directly — they do **not** require the Claude in Chrome extension or the Playwright MCP server (those are development tools for AI-assisted debugging, not test dependencies). No manual dev server is needed — Playwright starts one automatically with captcha bypass enabled.

**Important:** Chrome must be running before you start E2E tests. Playwright uses `channel: "chrome"` (system Chrome) and will hang silently if Chrome is not running. If a run appears stuck at `→ Running E2E Tests...` with no progress, launch Chrome and try again.

**Performance tip:** E2E tests run noticeably faster right after a computer restart (fresh Chrome with no accumulated state, tabs, or extensions loaded).

| Prerequisite | Check if done | Setup (if needed) |
|---|---|---|
| Google Chrome | `open -Ra "Google Chrome" && echo OK` | [Install Chrome](https://www.google.com/chrome/) |
| Node dependencies | `ls web/node_modules/.package-lock.json` | `cd web && npm install` |
| `.env.local` exists | `test -f web/.env.local && echo OK` | `cp web/.env.local.example web/.env.local` and fill in values |
| GCP credentials (ADC) | `gcloud auth application-default print-access-token > /dev/null && echo OK` | `gcloud auth application-default login` |

For the **Real LLM E2E** suite (`--e2e-real`), you also need:

| Prerequisite | Check if done | Setup (if needed) |
|---|---|---|
| Seeded resume | `gcloud storage cat gs://samkirk-v3-private/resume/master.md --range=0-50` | `cd web && npm run seed:resume` |
| Vertex AI API enabled | `gcloud services list --enabled --filter=aiplatform` | `gcloud services enable aiplatform.googleapis.com` |

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

**Step 4 — Real LLM E2E** (needs seeded resume + Vertex AI):

```bash
npm run test:all -- --e2e-real
```

Fix any failures at each step before moving to the next. Once all four pass individually, confirm they work together:

```bash
npm run test:all
```

### Viewing Previous Results

```bash
# Latest archived summary (most recent full run):
ls -t do-work/archive/test-runs/ | head -1    # find the latest run
cat do-work/archive/test-runs/<TIMESTAMP>/summary.md

# Raw logs from that run (gitignored, local only):
cat do-work/archive/test-runs/<TIMESTAMP>/unit-tests.log
cat do-work/archive/test-runs/<TIMESTAMP>/e2e-tests.log
cat do-work/archive/test-runs/<TIMESTAMP>/e2e-real-llm.log
cat do-work/archive/test-runs/<TIMESTAMP>/gcp-smoke.log

# Playwright HTML report (E2E only, viewable in browser):
npx playwright show-report web/playwright-report

# Playwright last-run status (E2E only):
cat web/test-results/.last-run.json
```

Each `test:all` run archives a `summary.md` with pass/fail counts, durations, and a test index, plus per-suite `.log` files with full output. The summary is committed; logs are gitignored.

#### Test Fixtures

Real inputs and outputs from each tool are saved in `web/test-fixtures/`. Each subdirectory has a README with a data-flow diagram and file descriptions. Browse these to understand what the tools produce without re-running tests.

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

To write a new test using do-work, describe what needs testing:

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

**Formalized triage** (full traceability through a TODO cycle):

```bash
/ingest-todo docs/master-test-TODO.md
do work verify
do work run
/sync-todo docs/master-test-TODO.md
```

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

If a verification fails, drop it into do-work:

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

These commands read the SPECIFICATION, BLUEPRINT, and TODO for context, then walk through the step interactively. Prefer do-work for everything else.

---

## Conventions

- **Unit tests**: `*.test.ts` files, co-located with their source files under `web/src/`
- **E2E tests**: `*.spec.ts` files in `web/e2e/`
- **Real data over mocks**: Never mock both resume data AND LLM responses in the same test
- **Skip guards**: GCP-dependent tests use skip guards so they pass cleanly without credentials
- **Strict TypeScript**: No `any` types
- **Archive structure**: Test run archives go to `do-work/archive/test-runs/YYYY-MM-DD_HH-MM-SS/` with `summary.md` (committed) and `*.log` (gitignored)

---

## Reference Documents

- [`docs/test-catalog.md`](docs/test-catalog.md) — Test inventory with metadata for all tests
- [`docs/feature-test-matrix.md`](docs/feature-test-matrix.md) — Feature-to-test mapping
- [`docs/verification-registry.md`](docs/verification-registry.md) — Manual verification procedures
- [`docs/master-test-SPECIFICATION.md`](docs/master-test-SPECIFICATION.md) — Full test requirements
- [`docs/master-test-BLUEPRINT.md`](docs/master-test-BLUEPRINT.md) — Implementation details
