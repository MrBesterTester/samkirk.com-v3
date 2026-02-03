## samkirk.com v3

Personal website + genAI demo tools for `samkirk.com`.

Key docs:
- `docs/Proposal.md`
- `docs/SPECIFICATION.md`
- `docs/BLUEPRINT.md` (to be generated)
- `docs/TODO.md` (to be generated)

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
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests with Playwright (mock LLM) |
| `npm run test:e2e:real` | Run E2E test with real Vertex AI (~$0.01-0.05) |
| `npm run smoke:gcp` | Run GCP integration smoke tests |
| `npm run validate:resume -- <file>` | Validate resume chunking locally |

### Notes

- Secrets must never be committed (use env vars / GCP Secret Manager).
- Phone numbers for future SMS alerting must be treated as secrets and not logged/exposed.

