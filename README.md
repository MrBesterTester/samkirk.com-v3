## samkirk.com v3

Personal website + genAI demo tools for `samkirk.com`.

### Table of Contents

- [samkirk.com v3](#samkirkcom-v3)
  - [Table of Contents](#table-of-contents)
  - [Punch Down List](#punch-down-list)
  - [Principles of Operation (POO)](#principles-of-operation-poo)
  - [Standard Operating Procedures (SOP)](#standard-operating-procedures-sop)
    - [Resume Management](#resume-management)
    - [Testing](#testing)
  - [Key docs](#key-docs)
  - [Tech stack (V1 target)](#tech-stack-v1-target)
  - [Local development](#local-development)
  - [Scripts](#scripts)
  - [Development Methodology](#development-methodology)
  - [Notes](#notes)
  - [Project Structure](#project-structure)

### Punch Down List

Requests on hold — to be picked up after current priorities:

- [REQ-035: Fix DNS for tensor-logic.samkirk.com](do-work/archive/hold/REQ-035-fix-tensor-logic-dns.md)
- [REQ-036: Add full month, extended Dance Menu](do-work/archive/hold/REQ-036-full-month-dance-menu.md)
- [REQ-037: Add photo option on generated resume](do-work/archive/hold/REQ-037-photo-option-generated-resume.md)

### Principles of Operation (POO)

Most of the website content is fixed — static pages that rarely change. Two sections are the exceptions:

- **Dance Menu** (small) — A weekly-updated listing of upcoming dance events. An admin uploads `.txt` and `.html` files (with optional `.md` and `.pdf`) via the admin panel, and they're served to visitors on the `/dance-menu` page.
- **Hire Me** (large) — The interactive hiring toolkit. Visitors upload a job description, and the system uses the stored resume plus LLM processing to generate tailored cover letters, fit reports, and interview prep materials.

### Standard Operating Procedures (SOP)

> **Note:** The **Admin** nav link only appears in development mode (`NODE_ENV=development`). In production, `/admin` is still accessible by URL but hidden from the navigation for security.

#### Resume Management

The following requires GCP login (`/login-gcloud`).

**Initial setup (new environment):**
1. Edit `web/data/baseline-resume.md` with your resume content
2. Validate chunking: `npm run validate:resume -- data/baseline-resume.md`
3. Seed to GCP: `npm run seed:resume` (purges all existing chunks and resets to version 1)

**Updating your resume:**
- **Via admin page:** `/admin/resume` (requires Google OAuth login)
- **Via CLI:** Edit `web/data/baseline-resume.md` and run `npm run seed:resume`

**Resume format requirements:**
- Markdown with headings (##, ###) for logical sections
- Each section: 100-2000 characters
- Content under headings, not just nested sub-headings

#### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests (Vitest) — 819 tests |
| `npx playwright test` | Run E2E tests with Playwright — 11 tests (Fit + Resume tools) |
| `npm run test:e2e:real` | Run E2E test with real Vertex AI (~$0.02-0.10) |
| `npm run smoke:gcp` | Run GCP integration smoke tests — 11 sections |
| `npm run test:all` | Run all tests (unit + E2E + smoke) with single command |
| `npm run validate:resume -- <file>` | Validate resume chunking locally |

See [`docs/TEST-RESULTS.md`](docs/TEST-RESULTS.md) for detailed test results and verification evidence.

### Key docs

- [`docs/Proposal.md`](docs/Proposal.md) — Original project proposal
- [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) — Functional specification (V1)
- [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) — Technical architecture and implementation plan
- [`docs/TODO.md`](docs/TODO.md) — Implementation checklist with progress tracking
- [`docs/TEST-RESULTS.md`](docs/TEST-RESULTS.md) — Test results and verification evidence
- [`README_dev_guide.md`](README_dev_guide.md) — Developer guide: methodology, testing, and conventions
- [`REFERENCES/Dylan-Davis-50plus-method.html`](REFERENCES/Dylan-Davis-50plus-method.html) — Interactive study guide for the Dylan Davis 50+ method
- [`REFERENCES/Matt-Maher_Claude-Code.html`](REFERENCES/Matt-Maher_Claude-Code.html) — Interactive study guide for Matt Maher's Claude Code meta-programming techniques

### Tech stack (V1 target)

- **Frontend + backend**: Next.js (App Router) on Cloud Run
- **Language**: TypeScript (strict)
- **LLM**: Gemini via Vertex AI
- **Storage**: Cloud Storage (files) + Firestore (metadata/counters)

### Local development

Install dependencies:

```bash
cd web
npm install
```

Run the dev server:

```bash
cd web
npm run dev
```

Open `http://localhost:3000`.

**Using Claude in Chrome (ongoing):** Once the [Chrome extension is set up](README_dev_guide.md#chrome-extension-setup-claude-in-chrome), ask Claude to bring up the app on Chrome at `localhost:3000`. Claude will open a new tab (replacing any stale one) and navigate to the dev server. If the dev server needs a full rebuild, ask Claude to restart it first (`rm -rf web/.next && cd web && npm run dev`).

### Scripts

From `web/`:

```bash
npm run lint
npm run build
npm run start
```

### Development Methodology

This project was built entirely with AI, blending two methodologies: **Dylan Davis's three-document system** (Specification, Blueprint, TODO) for structured planning, and **Matt Maher's do-work pattern** for autonomous execution. A custom `/ingest-todo` bridge connects the two — TODO steps become do-work queue items that process autonomously with fresh AI context per task.

**For the full write-up** (how both methods work, the bridge, workflow diagrams, and links to original source videos): **[Development Methodology in the Developer Guide](README_dev_guide.md#development-methodology)**

**Study guides** — standalone HTML references for the two methodologies behind this project:
- [Dylan Davis: I've Built 50+ Apps with AI](REFERENCES/Dylan-Davis-50plus-method.html) — three-document system (Specification → Blueprint → TODO)
- [Matt Maher: Claude Code Meta-Programming](REFERENCES/Matt-Maher_Claude-Code.html) — six practices + the do-work autonomous queue pattern

**Three-document sets** (Dylan Davis pattern — used five times in this project):

| Set | Spec | Blueprint | TODO | Status |
|-----|------|-----------|------|--------|
| V1 Core | [SPECIFICATION.md](docs/SPECIFICATION.md) | [BLUEPRINT.md](docs/BLUEPRINT.md) | [TODO.md](docs/TODO.md) | Complete |
| V2 Visual | [v2-upgrade-SPEC](docs/v2-upgrade-SPECIFICATION.md) | [v2-upgrade-BP](docs/v2-upgrade-BLUEPRINT.md) | [v2-upgrade-TODO](docs/v2-upgrade-TODO.md) | Complete |
| Master Tests | [master-test-SPEC](docs/master-test-SPECIFICATION.md) | [master-test-BP](docs/master-test-BLUEPRINT.md) | [master-test-TODO](docs/master-test-TODO.md) | Complete |
| Hire Me Unified | [unified-SPEC](docs/hire-me-unified-SPECIFICATION.md) | [unified-BP](docs/hire-me-unified-BLUEPRINT.md) | [unified-TODO](docs/hire-me-unified-TODO.md) | Complete |
| Hire Me Streamline | [streamline-SPEC](docs/hire-me-streamline-SPECIFICATION.md) | [streamline-BP](docs/hire-me-streamline-BLUEPRINT.md) | [streamline-TODO](docs/hire-me-streamline-TODO.md) | Pending |

The Master Tests set also has two companion documents: [`master-test-plan.md`](docs/master-test-plan.md) (the original monolithic plan, superseded when it was restructured into the three-document format) and [`master-test-START-DEV.md`](docs/master-test-START-DEV.md) (a temporary quick-reference card for kicking off the do-work build process).

**Tool Support:**
- **Cursor IDE**: Project commands in `.cursor/commands/`, rules in `.cursor/rules/`
- **Claude Code**: Project skills in `.claude/skills/`, rules in `.claude/RULES.md`
- See [`.claude/CURSOR-COMPATIBILITY.md`](.claude/CURSOR-COMPATIBILITY.md) for command mapping between tools

Both tools can be used interchangeably. Workflow commands (create-spec, create-blueprint, create-todo, start-step, continue-step) work in both environments.

### Notes

- Secrets must never be committed (use env vars / GCP Secret Manager).
- Phone numbers for future SMS alerting must be treated as secrets and not logged/exposed.

### Project Structure

Linked `README.md` files and other documents throughout the tree provide detailed context for each area of the project. Follow them to get a clear, readable understanding of how everything fits together. In particular, [`README_dev_guide.md`](README_dev_guide.md) is essential reading for day-to-day development, and for a deeper understanding of the methodology, study the two HTML guides in [`REFERENCES/`](REFERENCES/).

<pre>
samkirk-v3/
├── .claude/                 # Claude Code integration
│   └── <a href=".claude/README.md">README.md</a>            # Integration setup
├── .cursor/                 # Cursor IDE commands and rules
├── REFERENCES/              # Methodology study guides
│   ├── <a href="REFERENCES/Dylan-Davis-50plus-method.html">Dylan-Davis-50plus-method.html</a>   # Three-document system (Spec → Blueprint → TODO)
│   └── <a href="REFERENCES/Matt-Maher_Claude-Code.html">Matt-Maher_Claude-Code.html</a>      # Six practices + do-work autonomous queue
├── do-work/                 # Autonomous work queue
│   ├── archive/             # Completed and on-hold REQs
│   ├── user-requests/       # Incoming REQ files
│   └── working/             # Currently processing
├── docs/                    # Project documentation (30+ files)
│   └── <a href="docs/README.md">README.md</a>            # Narrative walkthrough of all documentation
├── web/                     # Next.js application
│   ├── <a href="web/README.md">README.md</a>            # Application structure and conventions
│   ├── data/                # Resume data
│   ├── e2e/                 # Playwright E2E tests
│   │   └── fixtures/        # Upload test inputs
│   │       └── <a href="web/e2e/fixtures/README.md">README.md</a>    # Fixture inventory (sample + Zscaler JDs)
│   ├── scripts/             # Build & test scripts
│   ├── src/
│   │   ├── app/             # Pages & API routes
│   │   ├── components/      # Shared React components
│   │   ├── lib/             # Core business logic (40+ modules)
│   │   └── test/            # Test utilities
│   └── test-fixtures/       # Saved tool outputs
│       ├── <a href="web/test-fixtures/README.md">README.md</a>        # Fixture overview, gallery, and special-case JDs
│       ├── fit-report/
│       │   └── <a href="web/test-fixtures/fit-report/README.md">README.md</a>    # Fit report data flow
│       ├── interview-chat/
│       │   └── <a href="web/test-fixtures/interview-chat/README.md">README.md</a>    # Interview chat data flow
│       └── resume-generator/
│           └── <a href="web/test-fixtures/resume-generator/README.md">README.md</a>    # Resume generator data flow
├── CLAUDE.md                # AI assistant project instructions
├── <a href="README.md">README.md</a>                # This file
└── <a href="README_dev_guide.md">README_dev_guide.md</a>      # Developer guide: methodology, testing, conventions
</pre>
