# Resume Generator Test Fixtures

These files represent the test data used in `src/lib/resume-generator.test.ts`, the smoke test (Section 11), and E2E tests for the Custom Resume tool (Steps 7.2 and 7.3).

## Files

### Inputs

- **[job-description.txt](job-description.txt)** - Sample job posting text used as input
- **[resume-chunks.json](resume-chunks.json)** - Resume chunks used as context for the LLM (source of truth)

### Outputs (Unit Tests / Smoke Tests)

- **[generated-resume.md](generated-resume.md)** - Reference markdown resume output
- **[generated-resume.html](generated-resume.html)** - Styled HTML resume for viewing/download

### Outputs (Real-LLM E2E Test - Step 7.3)

- **[e2e-generated-resume.json](e2e-generated-resume.json)** - Structured JSON from real Vertex AI call
- **[e2e-generated-resume.md](e2e-generated-resume.md)** - Markdown resume from real Vertex AI call

## Test Flow

```
job-description.txt + resume-chunks.json
              ↓
    buildResumeGenerationPrompt()
              ↓
        LLM (Gemini)
              ↓
    parseResumeResponse()
              ↓
   generateMarkdownResume()
              ↓
    generated-resume.md
              ↓
      renderMarkdown()
              ↓
    generated-resume.html
```

## Key Constraints

The resume generator enforces these rules (via prompt engineering):

1. **Do Not Invent** - Only information from `resume-chunks.json` appears in output
2. **2-Page Limit** - Target 600-900 words total
3. **5 Bullets Max** - Per job experience entry
4. **Tailored Content** - Skills/experience highlighted based on job requirements

## Usage

These fixtures are referenced in:
- Unit tests (`resume-generator.test.ts`) to verify prompt building and parsing
- Smoke tests (`scripts/smoke-gcp.ts` Section 11) for end-to-end GCP integration
- E2E tests (`scripts/e2e-real-llm.ts`) for real Vertex AI integration
- Playwright tests (`e2e/resume-tool.spec.ts`) for UI flow testing
- Documentation (`docs/TEST-RESULTS.md`) as evidence of Steps 7.2 and 7.3 completion

## Related Documentation

- [TODO.md - Step 7.2](../../../docs/TODO.md#72-resume-generation-2-page-factual-only--artifacts)
- [TODO.md - Step 7.3](../../../docs/TODO.md#73-ui-wiring-for-custom-resume)
- [TEST-RESULTS.md - Resume Generator](../../../docs/TEST-RESULTS.md#resume-generator-step-72)
- [TEST-RESULTS.md - Resume Tool UI](../../../docs/TEST-RESULTS.md#resume-tool-ui-step-73)
