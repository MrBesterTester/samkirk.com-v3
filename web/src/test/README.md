# web/src/test/

Vitest test setup and TypeScript declarations.

## Files

- **`setup.ts`** — Vitest setup file (referenced from `vitest.config.ts`)
  - Imports `@testing-library/jest-dom/vitest` for DOM matchers
  - Mocks the `server-only` module so server modules can be tested
  - Registers `afterEach` cleanup to prevent DOM pollution between tests

- **`vitest.d.ts`** — TypeScript declarations for Vitest and `@testing-library/jest-dom` types

## Running Tests

```bash
npm test                  # Unit/component tests (Vitest)
npx playwright test       # E2E tests
npm run test:e2e:real     # Real LLM E2E (requires seeded resume)
```
