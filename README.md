## samkirk.com v3

Personal website + genAI demo tools for `samkirk.com`.

Key docs:
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

### Standard Operating Procedures

> **Note:** The **Admin** nav link only appears in development mode (`NODE_ENV=development`). In production, `/admin` is still accessible by URL but hidden from the navigation for security.

#### Resume Management

**Initial setup (new environment):**
1. Edit `web/data/baseline-resume.md` with your resume content
2. Validate chunking: `npm run validate:resume -- data/baseline-resume.md`
3. Seed to GCP: `npm run seed:resume`

**Updating your resume:**
- Use the admin page at `/admin/resume` (requires Google OAuth login)
- Or edit `web/data/baseline-resume.md` and re-run `npm run seed:resume`

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

