# web/

Next.js application for [samkirk.com](https://samkirk.com) — personal website with genAI-powered hiring tools.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Key Directories

```
web/
├── data/               # Resume data (baseline-resume.md)
├── e2e/                # Playwright E2E tests
├── scripts/            # Build, test, and deployment scripts
├── src/
│   ├── app/            # Next.js App Router pages and API routes
│   │   ├── admin/      # Resume management admin panel (dev-only nav link)
│   │   ├── api/        # API routes (fit-report, interview, resume, dance-menu)
│   │   ├── dance-menu/ # Weekly dance event listings
│   │   ├── hire-me/    # Interactive hiring toolkit
│   │   └── ...         # Other pages (explorations, photo-fun, song-dedication)
│   ├── components/     # Shared React components with co-located tests
│   ├── lib/            # Core business logic (40+ modules — LLM, storage, resume processing)
│   └── test/           # Test utilities and helpers
└── test-fixtures/      # Saved tool outputs for testing (fit-report, interview-chat, resume-generator)
```

## Hire Me Tools

The main interactive feature. Visitors upload a job description and the system uses the stored resume + Vertex AI to generate:

- **Fit Report** — Skills match analysis against the job posting
- **Resume Generator** — Tailored resume for the specific role
- **Interview Chat** — AI-powered interview prep conversation

API routes under `src/app/api/` handle LLM orchestration, with artifacts persisted to GCP Cloud Storage.

## Further Reading

- [**Developer Guide**](../README_dev_guide.md) — Testing workflows, E2E setup, deployment
- [**Project Docs**](../docs/) — Specification, blueprint, architecture decisions
- [**Top-level README**](../README.md) — SOPs, scripts, resume management
