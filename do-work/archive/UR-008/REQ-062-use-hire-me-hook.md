---
id: REQ-062
title: "useHireMe hook"
status: completed
created_at: 2026-02-13T00:00:00Z
claimed_at: 2026-02-13T18:09:00Z
route: C
completed_at: 2026-02-13T18:17:00Z
user_request: UR-008
related: [REQ-058, REQ-059, REQ-060, REQ-061, REQ-063]
batch: "hire-me-unified-phase-2"
source_step: "2.1"
source_doc: "docs/hire-me-unified-TODO.md"
blueprint_ref: "docs/hire-me-unified-BLUEPRINT.md"
model_hint: "Opus 4.5"
---

# useHireMe hook (Step 2.1)

## What
Create the central custom hook that manages all state and API interactions for the unified Hire Me page. Ports logic from FitToolContent, ResumeToolContent, and InterviewToolContent into a single hook with job context management, chat messages, and flow tracking.

## Checklist
- [x] Create `useHireMe.ts` with `HireMeState` interface
- [x] Implement `loadJob(mode, data)` — loads job into context
- [x] Implement `clearJob()` — removes job context
- [x] Implement `triggerFit()` — POST to `/api/tools/fit/start`, handle question/ready flow
- [x] Implement `answerFitQuestion(answer)` — POST to `/api/tools/fit/answer`, loop or generate
- [x] Implement fit generate — POST to `/api/tools/fit/generate`, add fit-report card
- [x] Implement `triggerResume()` — POST to `/api/tools/resume`, add resume-preview card
- [x] Implement `sendMessage(text)` — POST to `/api/tools/interview`, add assistant bubble
- [x] Implement `newConversation()` — clear messages + flows, keep job context
- [x] Implement `download(submissionId)` — trigger artifact download
- [x] Manage downloads array for action bar
- [x] Handle loading states and error messages

## Blueprint Guidance
**`useHireMe.ts`** — Custom hook: all state, API calls, preset handlers
- `loadJob(mode, data)` — loads job into context bar
- `clearJob()` — removes job context
- `triggerFit()` — starts fit analysis flow
- `triggerResume()` — starts resume generation
- `sendMessage(text)` — sends chat message
- `answerFitQuestion(answer)` — handles fit follow-up
- `newConversation()` — clears chat, keeps job
- `download(submissionId)` — triggers artifact download

Port logic from:
- Fit flow logic from `FitToolContent`
- Resume flow logic from `ResumeToolContent`
- Chat logic from `InterviewToolContent`
- Add job context management

State interface from specification:
```typescript
interface HireMeState {
  jobContext: { loaded, inputMode, text?, url?, fileName?, title?, company? } | null;
  messages: ChatMessage[];
  conversationId: string | null;
  fitFlow: { active, flowState, submissionId, followUpsAsked };
  resumeFlow: { active, submissionId };
  downloads: Array<{ label, submissionId, type }>;
  isLoading: boolean;
}
```

## Context
- **Document set**: hire-me-unified
- **Phase**: 2 — Build the Hook
- **Specification**: See docs/hire-me-unified-SPECIFICATION.md for full requirements
- **Model recommendation**: Opus 4.5 (advisory)

## Dependencies
Depends on Phase 1 completion (all components must exist to type-check). No backend changes needed — uses existing API endpoints as-is.

---
*Source: docs/hire-me-unified-TODO.md, Step 2.1*

---

## Triage

**Route: C** - Complex

**Reasoning:** Central hook porting and unifying logic from 3 separate page components (fit, resume, interview) into a single state machine with multiple API integrations, flow tracking, and message management. Touches multiple systems and introduces a new architectural pattern.

**Planning:** Required

## Plan

### State Design
- `HireMeState` with jobContext, messages[], conversationId, fitFlow, resumeFlow, downloads[], answeredQuestions, isLoading
- `FitFlowState`: active, flowState (base64 server state from X-Fit-Flow-State header), submissionId, followUpsAsked, currentQuestionType
- `ResumeFlowState`: active, submissionId

### Hook Return Type
- State + loadJob, clearJob, triggerFit, triggerResume, answerFitQuestion, sendMessage, newConversation, download
- Computed: jobLoaded, flowActive, jobTitle, jobCompany

### Fit Flow State Machine
- triggerFit → POST /fit/start → question (push fit-question msg) OR ready (call generate)
- answerFitQuestion → POST /fit/answer → question (loop) OR complete (push fit-report)
- generateFitReport (internal) → POST /fit/generate → push fit-report + add download entry
- X-Fit-Flow-State header round-trips through flowState field

### API Contracts
- /fit/start: returns {success, submissionId, status: "question"|"ready", question?, extracted}
- /fit/answer: returns {success, status: "question"|"complete", question?, report?, followUpsAsked}
- /fit/generate: returns {success, report}
- /resume: returns {success, submissionId, resume}
- /interview: returns {success, conversationId, submissionId, message, turnCount, isComplete, downloadReady}

### Implementation Order
1. Types + initial state + hook skeleton
2. Message helpers (makeId, pushMessage, pushSystemMessage, pushErrorMessage)
3. loadJob/clearJob with sessionStorage (key: "hire-me-job-context")
4. triggerFit + generateFitReport (internal)
5. answerFitQuestion
6. triggerResume
7. sendMessage
8. newConversation + download
9. Computed values + return assembly

### File uploads
- When mode="file", use FormData instead of JSON (matching existing pattern)
- File object held in memory, not serialized to sessionStorage

*Generated by Plan agent*

## Exploration

- fit/page.tsx FitToolContent: full flow state machine with flowState (X-Fit-Flow-State header), question loops, generate call
- resume/page.tsx ResumeToolContent: simpler flow — submit job → get resume result
- interview/page.tsx: conversationId management, message push pattern, submissionId tracking, downloadReady flag
- JobContextBar.tsx: InputMode type ("paste"|"url"|"file"), JobInputData type, sessionStorage key "hire-me-job-context"
- ChatStream.tsx: all message types (UserMessage, AssistantMessage, SystemMessage, ErrorMessage, FitQuestionMessage, FitReportMessage, ResumePreviewMessage)
- API routes verified: /api/tools/fit/start, /fit/answer, /fit/generate, /resume, /interview
- File upload pattern: FormData with mode + file fields
- All useCallback pattern in existing page components

*Generated by Plan agent (included codebase exploration)*

## Implementation Summary

- Created `web/src/hooks/useHireMe.ts` (512 lines)
  - Full HireMeState interface with jobContext, messages[], conversationId, fitFlow, resumeFlow, downloads[], answeredQuestions, isLoading
  - `loadJob(mode, data)` — sets job context, persists to sessionStorage
  - `clearJob()` — nulls job context, removes sessionStorage
  - `triggerFit()` — POST /fit/start, handles question/ready branching, reads X-Fit-Flow-State header
  - `answerFitQuestion(questionId, answer)` — POST /fit/answer, loops questions or pushes fit-report on complete
  - Internal `generateFitReport()` — POST /fit/generate, pushes fit-report message + download entry
  - `triggerResume()` — POST /resume (JSON or FormData), pushes resume-preview message + download entry
  - `sendMessage(text)` — POST /interview, pushes user + assistant messages, tracks conversationId
  - `newConversation()` — clears messages/flows/answered, keeps jobContext + downloads
  - `download(submissionId)` — blob download via anchor pattern
  - All functions wrapped in useCallback
  - SessionStorage restoration on mount
  - File upload support via FormData
  - Error handling pushes ErrorMessage to chat
  - Computed: jobLoaded, flowActive, jobTitle, jobCompany
- All types exported for consumer components

*Completed by work action (Route C)*

## Testing

**Tests run:** `npx tsc --noEmit` + `npx vitest run`
**Result:** TypeScript compiles cleanly (only pre-existing test file errors). All 1232 unit tests passing (38 test files).

**New tests added:** None in this REQ — hook tests require @testing-library/react renderHook setup. Hook logic is ported from tested page components and will be verified via E2E tests.

*Verified by work action*
