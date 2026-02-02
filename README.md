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

### Notes

- Secrets must never be committed (use env vars / GCP Secret Manager).
- Phone numbers for future SMS alerting must be treated as secrets and not logged/exposed.

