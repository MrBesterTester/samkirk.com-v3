# Developer Guide — Testing Workflows

This is the day-to-day reference for running, writing, and managing tests in samkirk-v3. It covers the test suites, CLI commands, automated workflows via do-work, manual verifications, and release qualification.

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
gcloud auth application-default login    # Set up credentials for Google Cloud client libraries
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
