# Test Fixtures

Real inputs and outputs captured from each Hire Me tool during test runs. Browse these to understand what the tools produce without re-running tests.

## Structure

| Directory | Tool | What it contains |
|-----------|------|-----------------|
| [fit-report/](fit-report/README.md) | How Do I Fit? | Job description, extracted fields, LLM response, generated report |
| [interview-chat/](interview-chat/README.md) | Interview Prep | Resume chunks, test questions, conversation transcripts, smoke/E2E output |
| [resume-generator/](resume-generator/README.md) | Custom Resume | Job description, resume chunks, generated resume (MD + HTML + JSON) |

## Root Files

- **[index.html](index.html)** — Fixture gallery: a side-by-side view of real inputs and outputs for every tool. Served by `npm run test:results -- --fixtures show` at `localhost:8123`.
- **Special-case job descriptions** — Edge-case and format-specific job description files (e.g., DOCX, HTML) used to test file-upload parsing across tools.

## Viewing Fixtures

```bash
# Browse the fixture gallery in your browser:
npm run test:results -- --fixtures show

# See which fixtures changed in the latest test run:
npm run test:results -- --fixtures
```

Fixture updates appear automatically in test run summaries when you run `npm run test:results`.
