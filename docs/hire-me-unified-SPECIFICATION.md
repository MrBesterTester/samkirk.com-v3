# Unified Hire Me Page — Specification

## Problem

The current Hire Me feature is split across three separate routes (`/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview`), each with its own full-page implementation. All three share the same `JobInputForm` component (paste/URL/file), which means users re-enter job data when switching tools. Interview mode is really just "chat with no job input." Fit and Resume are preset actions you take on a loaded job posting, not fundamentally different modes.

## Goal

Consolidate into a single chat-first page at `/hire-me` with a top context bar for job input and rich chat cards for all output.

## Layout

```
┌─────────────────────────────────────────┐
│ Hire Me — page header + description     │
├─────────────────────────────────────────┤
│ ┌─ Job Context Bar (collapsible) ─────┐ │
│ │ Empty: "Add a job posting" + expand │ │
│ │ Loaded: "Sr Dev at Acme" + [swap]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ ToolGate (session + captcha) ──────┐ │
│ │ ┌─ Chat Area (scrollable) ────────┐ │ │
│ │ │ Welcome message                  │ │ │
│ │ │ User/assistant messages          │ │ │
│ │ │ Rich cards (fit report, resume)  │ │ │
│ │ │ Interactive cards (fit Q&A)      │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │                                     │ │
│ │ ┌─ Actions bar ──────────────────┐  │ │
│ │ │ [Downloads] [New Conversation] │  │ │
│ │ └────────────────────────────────┘  │ │
│ │                                     │ │
│ │ ┌─ Preset chips (job loaded) ───┐   │ │
│ │ │ [Analyze My Fit] [Gen Resume] │   │ │
│ │ └───────────────────────────────┘   │ │
│ │                                     │ │
│ │ ┌─ Chat Input ──────────────────┐   │ │
│ │ │ [Type your question...   ] [→]│   │ │
│ │ └───────────────────────────────┘   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Chat Message Types

The chat stream supports typed messages rendered differently:

| Type | Rendering | Source |
|------|-----------|--------|
| `user` | Blue bubble (right-aligned) | User typed message |
| `assistant` | Gray bubble (left-aligned, "Sam Kirk" label) | Interview endpoint response |
| `system` | Centered muted text | Status updates ("Analyzing...", "Generating...") |
| `fit-question` | Interactive card with options/textarea + submit | Fit `/start` or `/answer` response |
| `fit-report` | Rich card: overall score, categories, recommendation, download | Fit `/generate` response |
| `resume-preview` | Rich card: header, summary, stats, download button | Resume endpoint response |
| `error` | Red-bordered card with retry button | Any API error |

## State Management

Single `useHireMe` custom hook managing:

```typescript
interface HireMeState {
  // Job context (persisted to sessionStorage)
  jobContext: {
    loaded: boolean;
    inputMode: InputMode;
    text?: string;
    url?: string;
    fileName?: string;
    title?: string;
    company?: string;
  } | null;

  // Chat
  messages: ChatMessage[];
  conversationId: string | null;

  // Active flows
  fitFlow: {
    active: boolean;
    flowState: string | null;
    submissionId: string | null;
    followUpsAsked: number;
  };
  resumeFlow: {
    active: boolean;
    submissionId: string | null;
  };

  // Downloads
  downloads: Array<{ label: string; submissionId: string; type: string }>;

  // UI
  isLoading: boolean;
}
```

## How Presets Work

**"Analyze My Fit" button click:**
1. System message added: "Starting fit analysis..."
2. POST to `/api/tools/fit/start` with job context
3. If response has `status: "question"` → add `fit-question` card to chat
4. User answers in the card → POST to `/api/tools/fit/answer`
5. Repeat questions or reach "ready" → POST `/api/tools/fit/generate`
6. Add `fit-report` card to chat with scores + download button
7. Extracted job metadata (title, company) updates the job context bar

**"Generate Resume" button click:**
1. System message added: "Generating custom resume..."
2. POST to `/api/tools/resume` with job context
3. Add `resume-preview` card to chat with preview + download button

**Free-form chat (always available):**
1. User types message → POST to `/api/tools/interview`
2. Assistant response bubble added to chat
3. Works with or without job context loaded

## Key Design Decisions

- **No backend changes** — all existing API endpoints work as-is
- **Job context bar outside ToolGate** — user can load a job before/during captcha
- **Chat messages are typed** — discriminated union enables rendering the right card component
- **Fit flow state tracked in hook** — base64 server state round-trips through hook, not chat messages
- **Multiple tool outputs coexist** — fit analysis, resume, and chat all appear in same stream
- **"New Conversation" keeps job** — clears messages but retains loaded job context
- **Preset chips hide during active flow** — prevents overlapping tool executions
- **Answered fit questions become read-only** — card shows selected answer, disabled

## Verification

1. Load `/hire-me` — see chat interface with welcome message and collapsed job context bar
2. Type a question without loading a job — interview chat works normally
3. Expand context bar, paste a job posting, submit — bar collapses showing "Job loaded", preset chips appear
4. Click "Analyze My Fit" — system message + follow-up questions appear as interactive cards
5. Answer all questions — fit report card appears with scores and download button
6. Click "Generate Resume" — system message + resume preview card appears with download
7. Click download buttons — artifacts download correctly
8. Visit `/hire-me/fit` — redirects to `/hire-me`
9. Refresh page — job context restored from sessionStorage
10. `npm test` and `npx playwright test` pass
