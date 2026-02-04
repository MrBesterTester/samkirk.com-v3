# Resume Generator Test Fixtures

These files represent the test data used in `src/lib/resume-generator.test.ts` and the smoke test (Section 11) for the Custom Resume tool (Step 7.2).

## Files

### Inputs

- **[job-description.txt](job-description.txt)** - Sample job posting text used as input
- **[resume-chunks.json](resume-chunks.json)** - Resume chunks used as context for the LLM (source of truth)

### Outputs

- **[generated-resume.md](generated-resume.md)** - Final markdown resume output
- **[generated-resume.html](generated-resume.html)** - Styled HTML resume for viewing/download

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
- Documentation (`docs/TEST-RESULTS.md`) as evidence of Step 7.2 completion

## Related Documentation

- [TODO.md - Step 7.2](../../../docs/TODO.md#step-7-custom-resume-tool)
- [TEST-RESULTS.md - Resume Generator](../../../docs/TEST-RESULTS.md#resume-generator-step-72)
