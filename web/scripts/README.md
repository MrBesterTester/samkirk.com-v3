# web/scripts/

Utility scripts for testing, data management, and GCP integration. Run from the `web/` directory.

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `test-all.ts` | `npm run test:all` | Master test orchestrator — runs unit, E2E, real-LLM, and smoke tests with configurable flags |
| `test-results.ts` | `npm run test:results` | View and compare archived test results |
| `e2e-real-llm.ts` | `npm run test:e2e:real` | Full E2E with real Vertex AI calls (~$0.03-0.15/run) |
| `smoke-gcp.ts` | `npm run smoke:gcp` | GCP service smoke tests (Firestore, Storage, Vertex AI) |
| `seed-resume.ts` | `npm run seed:resume` | Seed resume to GCS and Firestore for LLM tools |
| `validate-resume.ts` | `npm run validate:resume` | Local resume validation (no GCP needed) |

## Key Flags

**test-all.ts:** `--unit`, `--e2e`, `--e2e-real`, `--smoke`, `--no-gcp`, `--headed`, `--release`, `--ref UR-001/REQ-042`

**smoke-gcp.ts:** `--section=1,3,5` or `--section=storage`, `--list`

**test-results.ts:** `--list`, `--run <dir>`, `--full`, `--diff <dir1> <dir2>`, `--json`
