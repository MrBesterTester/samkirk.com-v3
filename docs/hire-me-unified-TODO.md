# Unified Hire Me Page — TODO

**Model recommendations:**
- Frontend/UI work: Claude Opus 4.5
- Quick fixes: Sonnet 4

---

## Phase 1: Extract Shared Components

### Step 1.1 — Create component directory
- [ ] Create `web/src/components/hire-me/` directory
- [ ] Create `web/src/components/hire-me/index.ts` barrel export

### Step 1.2 — JobContextBar
- [ ] Build `JobContextBar.tsx` with three states: collapsed-empty, expanded (input form), collapsed-loaded
- [ ] Reuse paste/URL/file tab logic from existing `JobInputForm`
- [ ] Persist job context to sessionStorage
- [ ] Restore job context from sessionStorage on mount
- [ ] Emit `onJobLoaded` / `onJobCleared` callbacks

### Step 1.3 — ChatInput
- [ ] Build `ChatInput.tsx` with auto-resizing textarea + send button
- [ ] Add preset chips row ("Analyze My Fit", "Generate Resume") above input
- [ ] Chips visible only when job loaded and no flow active
- [ ] Disabled state during loading
- [ ] Enter to send, Shift+Enter for newline

### Step 1.4 — ChatStream
- [ ] Build `ChatStream.tsx` as scrollable message container
- [ ] Render typed messages with appropriate components per message type
- [ ] Auto-scroll to bottom on new messages
- [ ] Welcome message when messages array is empty
- [ ] Message type renderers: user bubble, assistant bubble, system text

### Step 1.5 — Rich Card Components
- [ ] Build `FitReportCard.tsx` — overall score, categories, recommendation, download button
- [ ] Build `ResumePreviewCard.tsx` — header, summary, stats grid, download button
- [ ] Build `FitQuestionCard.tsx` — question text, options/textarea, submit, progress indicator
- [ ] FitQuestionCard: disabled state after answered (shows selected answer)

---

## Phase 2: Build the Hook

### Step 2.1 — useHireMe hook
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

---

## Phase 3: Assemble the Page

### Step 3.1 — Rewrite hire-me page
- [ ] Rewrite `web/src/app/hire-me/page.tsx` as unified chat page
- [ ] Page header + description at top
- [ ] JobContextBar outside ToolGate
- [ ] ToolGate wrapping ChatStream + actions bar + ChatInput
- [ ] Wire all components through `useHireMe` hook
- [ ] Actions bar with downloads + "New Conversation" button

---

## Phase 4: Redirects + Cleanup

### Step 4.1 — Redirect old routes
- [ ] Replace `web/src/app/hire-me/fit/page.tsx` with `redirect("/hire-me")`
- [ ] Replace `web/src/app/hire-me/resume/page.tsx` with `redirect("/hire-me")`
- [ ] Replace `web/src/app/hire-me/interview/page.tsx` with `redirect("/hire-me")`

### Step 4.2 — Remove dead code
- [ ] Remove unused imports and components from old pages
- [ ] Clean up any orphaned component files specific to old pages

---

## Phase 5: Test

### Step 5.1 — Automated tests
- [ ] Run `npm test` — all Vitest unit tests pass
- [ ] Run `npx playwright test` — all E2E tests pass

### Step 5.2 — Manual verification
- [ ] Load `/hire-me` — chat interface with welcome message and collapsed job context bar
- [ ] Type question without job loaded — interview chat works
- [ ] Paste job posting — bar collapses, presets appear
- [ ] "Analyze My Fit" — questions + report card in chat
- [ ] "Generate Resume" — resume preview card in chat
- [ ] Download buttons work
- [ ] `/hire-me/fit` redirects to `/hire-me`
- [ ] Page refresh restores job context from sessionStorage
