---
id: REQ-062
title: "useHireMe hook"
status: pending
created_at: 2026-02-13T00:00:00Z
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
- [ ] Create `useHireMe.ts` with `HireMeState` interface
- [ ] Implement `loadJob(mode, data)` — loads job into context
- [ ] Implement `clearJob()` — removes job context
- [ ] Implement `triggerFit()` — POST to `/api/tools/fit/start`, handle question/ready flow
- [ ] Implement `answerFitQuestion(answer)` — POST to `/api/tools/fit/answer`, loop or generate
- [ ] Implement fit generate — POST to `/api/tools/fit/generate`, add fit-report card
- [ ] Implement `triggerResume()` — POST to `/api/tools/resume`, add resume-preview card
- [ ] Implement `sendMessage(text)` — POST to `/api/tools/interview`, add assistant bubble
- [ ] Implement `newConversation()` — clear messages + flows, keep job context
- [ ] Implement `download(submissionId)` — trigger artifact download
- [ ] Manage downloads array for action bar
- [ ] Handle loading states and error messages

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
