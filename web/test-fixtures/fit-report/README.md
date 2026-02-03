# Fit Report Test Fixtures

These files represent the test data used in `src/lib/fit-report.test.ts` for the "How Do I Fit?" tool report generation (Step 6.3).

## Files

### Inputs

- **[job-description.txt](job-description.txt)** - Sample job posting text used as input
- **[extracted-fields.json](extracted-fields.json)** - Structured data extracted from the job posting
- **[resume-chunks.json](resume-chunks.json)** - Resume chunks used as context for the LLM

### Outputs

- **[llm-response.json](llm-response.json)** - Expected LLM response (JSON analysis)
- **[generated-report.md](generated-report.md)** - Final markdown report output

## Test Flow

```
job-description.txt + resume-chunks.json
              ↓
    buildFitAnalysisPrompt()
              ↓
        LLM (Gemini)
              ↓
      llm-response.json
              ↓
   parseFitAnalysisResponse()
              ↓
   generateMarkdownReport()
              ↓
    generated-report.md
```

## Usage

These fixtures are referenced in unit tests to verify:
1. Prompt building includes all necessary context
2. LLM response parsing handles JSON correctly
3. Markdown report generation produces expected structure
