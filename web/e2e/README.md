# web/e2e/

Playwright E2E tests for the unified `/hire-me` chat interface and supporting pages.

## Test Specs

| File | Coverage |
|------|----------|
| `full-app.spec.ts` | Public pages, navigation, API health, guardrails |
| `fit-tool.spec.ts` | FIT analysis flow (paste/URL/file input, Q&A, real Vertex AI) |
| `resume-tool.spec.ts` | Resume generation flow (upload, preview, download) |
| `interview-tool.spec.ts` | Interview chat (welcome, topics, free-form Q&A) |
| `download-buttons.spec.ts` | Artifact bundle downloads for all three tools |

## Helpers

- **`zip-verify.ts`** — Validates downloaded ZIP bundles (filename, contents, metadata)

## Running Tests

```bash
npx playwright test                    # All E2E tests (headless)
npx playwright test --headed           # Headed mode (close Chrome first)
npx playwright test fit-tool           # Single spec
npm run test:e2e:real                  # Real LLM E2E (requires seeded resume)
```

## Configuration

`playwright.config.ts` — 5-minute timeout (LLM calls), auto-starts dev server, HTML reporter, trace on first retry.

## Fixtures

See [`fixtures/README.md`](./fixtures/README.md) for test fixture details.
