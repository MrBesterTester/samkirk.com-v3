# Interview Chat Test Fixtures

These files represent the test data used in the smoke test (`scripts/smoke-gcp.ts` Section 12) and unit tests (`src/lib/interview-chat.test.ts`) for the "Interview Me Now" tool (Step 8.2).

## Files

### Inputs

- **[resume-chunks.json](resume-chunks.json)** - Resume chunks used as context for the LLM
- **[test-questions.json](test-questions.json)** - Test questions with expected topic matches

### Outputs

- **[conversation-transcript.md](conversation-transcript.md)** - Sample transcript from smoke test
- **[smoke-test-output.txt](smoke-test-output.txt)** - Full smoke test console output

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

## Related Documentation

- [TODO.md Step 8.2](../../../docs/TODO.md#82-chat-endpoint--transcript-artifact)
- [TEST-RESULTS.md Section 12](../../../docs/TEST-RESULTS.md#section-12-interview-chat-test)
- [TEST-RESULTS.md Interview Chat Unit Tests](../../../docs/TEST-RESULTS.md#interview-chat-step-82)
