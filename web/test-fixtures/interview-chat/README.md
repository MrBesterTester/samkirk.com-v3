# Interview Chat Test Fixtures

These files represent the test data used in:
- **Smoke test** (`scripts/smoke-gcp.ts` Section 12) for the chat endpoint (Step 8.2)
- **Unit tests** (`src/lib/interview-chat.test.ts`) for conversation logic (Step 8.2)
- **E2E tests** (`e2e/interview-tool.spec.ts`) for the UI (Step 8.3)

## Files

### Inputs

- **[resume-chunks.json](resume-chunks.json)** - Resume chunks used as context for the LLM
- **[test-questions.json](test-questions.json)** - Test questions with expected topic matches

### Outputs

- **[conversation-transcript.md](conversation-transcript.md)** - Sample transcript from smoke test (real LLM)
- **[smoke-test-output.txt](smoke-test-output.txt)** - Full smoke test console output (Step 8.2)
- **[e2e-real-llm-transcript.md](e2e-real-llm-transcript.md)** - Transcript from real LLM E2E test (Step 8.3)
- **[e2e-test-output.txt](e2e-test-output.txt)** - Playwright E2E test console output (Step 8.3)

## Test Flow

```
resume-chunks.json
        ↓
buildInterviewSystemPrompt()
        ↓
   User Message
        ↓
  checkGuardrails()
        ↓
[If off-topic] → Redirect Response
        ↓
[If allowed] → generateContentWithHistory()
        ↓
   LLM (Gemini)
        ↓
  Assistant Response
        ↓
conversation.messages.push()
        ↓
generateTranscript()
        ↓
conversation-transcript.md
```

## Smoke Test Verification Points

1. **Resume Context Loading** - Chunks written to Firestore, index updated
2. **Multi-Turn Conversation** - History preserved across turns
3. **Guardrails Enforcement** - Off-topic questions redirected
4. **Transcript Generation** - MD + HTML artifacts saved to GCS
5. **Submission Tracking** - Record created in Firestore with citations

## Usage

These fixtures are referenced in:
- **Unit tests** (`src/lib/interview-chat.test.ts`) - Verify conversation logic with mocks
- **Smoke tests** (`scripts/smoke-gcp.ts` Section 12) - Verify real Vertex AI integration
- **E2E tests** (`e2e/interview-tool.spec.ts`) - Verify full UI flow with browser automation

## Related Documentation

- [TODO.md Step 8.2](../../../docs/TODO.md#82-chat-endpoint--transcript-artifact) - Chat endpoint implementation
- [TODO.md Step 8.3](../../../docs/TODO.md#83-ui-wiring-for-interview-tool) - UI implementation
- [TEST-RESULTS.md Section 12](../../../docs/TEST-RESULTS.md#section-12-interview-chat-test) - Smoke test results
- [TEST-RESULTS.md Interview Chat Unit Tests](../../../docs/TEST-RESULTS.md#interview-chat-step-82) - Unit test results
- [TEST-RESULTS.md Interview Tool E2E Tests](../../../docs/TEST-RESULTS.md#interview-tool-e2e-tests-step-83) - E2E test results
