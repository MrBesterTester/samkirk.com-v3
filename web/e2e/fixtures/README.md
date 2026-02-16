# E2E Test Fixtures

Input files used by Playwright E2E tests for job description upload and parsing.

## Files

### Generic

- **[sample-job.txt](sample-job.txt)** — Plain-text job posting (synthetic). Used by `fit-tool.spec.ts` and `resume-tool.spec.ts` for file-upload flow tests.

### Zscaler (Real-World)

Real job posting for "Sr Principal Solutions Architect (AI)" from Zscaler's Greenhouse careers page, saved in three formats to exercise file-upload parsing across content types:

- **[Zscaler-Sr-Principal-Solutions-Architect-AI.html](Zscaler-Sr-Principal-Solutions-Architect-AI.html)** — HTML (saved page source)
- **[Zscaler-Sr-Principal-Solutions-Architect-AI.docx](Zscaler-Sr-Principal-Solutions-Architect-AI.docx)** — DOCX (converted)
- **[Zscaler-Sr-Principal-Solutions-Architect-AI.pdf](Zscaler-Sr-Principal-Solutions-Architect-AI.pdf)** — PDF (printed from browser)

## Usage

These fixtures are loaded via `path.join(__dirname, "fixtures", ...)` in the E2E specs:

- `fit-tool.spec.ts` — file-upload mode test
- `resume-tool.spec.ts` — file-upload mode test
