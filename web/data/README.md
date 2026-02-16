# web/data/

Canonical resume data used by the application's LLM-powered hiring tools.

## Files

- **`baseline-resume.md`** — Master resume in markdown format. Used as the source of truth for FIT analysis, resume generation, and interview preparation.

## How It's Used

1. Seeded to GCS and Firestore via `web/scripts/seed-resume.ts`
2. Chunked into semantic segments by `web/src/lib/resume-chunker.ts`
3. Indexed for RAG context by `web/src/lib/resume-context.ts`
4. Referenced by all three hiring tools (FIT report, resume generator, interview chat)

To seed or re-seed: `cd web && npm run seed:resume`
