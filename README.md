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
- [`README_dev_guide.md`](README_dev_guide.md) — Developer guide for testing workflows and conventions

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

### Scripts

From `web/`:

```bash
npm run lint
npm run build
npm run start
```

### Development Methodology

This project follows the **Dylan Davis 50+ method** (three-document system):

**Key Documents:**
- [`docs/Dylan-Davis-50plus-method.md`](docs/Dylan-Davis-50plus-method.md) — Complete methodology guide
- [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) — What we're building
- [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) — How to build it (step-by-step)
- [`docs/TODO.md`](docs/TODO.md) — Roadmap and progress tracking

**Tool Support:**
- **Cursor IDE**: Project commands in `.cursor/commands/`, rules in `.cursor/rules/`
- **Claude Code**: Project skills in `.claude/skills/`, rules in `.claude/RULES.md`
- See [`.claude/CURSOR-COMPATIBILITY.md`](.claude/CURSOR-COMPATIBILITY.md) for command mapping between tools

Both tools can be used interchangeably. Workflow commands (create-spec, create-blueprint, create-todo, start-step, continue-step) work in both environments.

### Notes

- Secrets must never be committed (use env vars / GCP Secret Manager).
- Phone numbers for future SMS alerting must be treated as secrets and not logged/exposed.

### Project Structure

```
samkirk-v3/
├── .claude/                 # Claude Code integration
├── .cursor/                 # Cursor IDE commands and rules
├── do-work/                 # Autonomous work queue
│   ├── archive/             # Completed and on-hold REQs
│   ├── user-requests/       # Incoming REQ files
│   └── working/             # Currently processing
├── docs/                    # Project documentation (30+ files)
├── web/                     # Next.js application
│   ├── data/                # Resume data
│   ├── e2e/                 # Playwright E2E tests
│   ├── scripts/             # Build & test scripts
│   ├── src/
│   │   ├── app/             # Pages & API routes
│   │   ├── components/      # Shared React components
│   │   ├── lib/             # Core business logic (40+ modules)
│   │   └── test/            # Test utilities
│   └── test-fixtures/       # Saved tool outputs (fit, resume, interview)
├── CLAUDE.md                # AI assistant project instructions
├── README.md                # This file
└── README_dev_guide.md      # Developer guide for testing workflows
```

Directories with their own READMEs: [`.claude/`](.claude/README.md) | [`docs/`](docs/README.md) | [`web/`](web/README.md) | [`web/test-fixtures/fit-report/`](web/test-fixtures/fit-report/README.md) | [`web/test-fixtures/interview-chat/`](web/test-fixtures/interview-chat/README.md) | [`web/test-fixtures/resume-generator/`](web/test-fixtures/resume-generator/README.md)
