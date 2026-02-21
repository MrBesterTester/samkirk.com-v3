# Unified Hire Me Page — TODO

**Model recommendations:**
- Frontend/UI work: Claude Opus 4.5
- Quick fixes: Sonnet 4

---

## Phase 1: Extract Shared Components

### Step 1.1 — Create component directory
- [x] Create `web/src/components/hire-me/` directory
- [x] Create `web/src/components/hire-me/index.ts` barrel export

### Step 1.2 — JobContextBar
- [x] Build `JobContextBar.tsx` with three states: collapsed-empty, expanded (input form), collapsed-loaded
- [x] Reuse paste/URL/file tab logic from existing `JobInputForm`
- [x] Persist job context to sessionStorage
- [x] Restore job context from sessionStorage on mount
- [x] Emit `onJobLoaded` / `onJobCleared` callbacks

### Step 1.3 — ChatInput
- [x] Build `ChatInput.tsx` with auto-resizing textarea + send button
- [x] Add preset chips row ("Analyze My Fit", "Generate Resume") above input
- [x] Chips visible only when job loaded and no flow active
- [x] Disabled state during loading
- [x] Enter to send, Shift+Enter for newline

### Step 1.4 — ChatStream
- [x] Build `ChatStream.tsx` as scrollable message container
- [x] Render typed messages with appropriate components per message type
- [x] Auto-scroll to bottom on new messages
- [x] Welcome message when messages array is empty
- [x] Message type renderers: user bubble, assistant bubble, system text

### Step 1.5 — Rich Card Components
- [x] Build `FitReportCard.tsx` — overall score, categories, recommendation, download button
- [x] Build `ResumePreviewCard.tsx` — header, summary, stats grid, download button
- [x] Build `FitQuestionCard.tsx` — question text, options/textarea, submit, progress indicator
- [x] FitQuestionCard: disabled state after answered (shows selected answer)

---

## Phase 2: Build the Hook

### Step 2.1 — useHireMe hook
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

---

## Phase 3: Assemble the Page

### Step 3.1 — Rewrite hire-me page
- [x] Rewrite `web/src/app/hire-me/page.tsx` as unified chat page
- [x] Page header + description at top
- [x] JobContextBar outside ToolGate
- [x] ToolGate wrapping ChatStream + actions bar + ChatInput
- [x] Wire all components through `useHireMe` hook
- [x] Actions bar with downloads + "New Conversation" button

---

## Phase 4: Redirects + Cleanup

### Step 4.1 — Redirect old routes
- [x] Replace `web/src/app/hire-me/fit/page.tsx` with `redirect("/hire-me")`
- [x] Replace `web/src/app/hire-me/resume/page.tsx` with `redirect("/hire-me")`
- [x] Replace `web/src/app/hire-me/interview/page.tsx` with `redirect("/hire-me")`

### Step 4.2 — Remove dead code
- [x] Remove unused imports and components from old pages
- [x] Clean up any orphaned component files specific to old pages

---

## Phase 5: Test

### Step 5.1 — Automated tests
- [x] Run `npm test` — all Vitest unit tests pass
- [x] Run `npx playwright test` — all E2E tests pass

### Step 5.2 — Manual verification
- [x] Load `/hire-me` — chat interface with welcome message and collapsed job context bar
- [x] Type question without job loaded — interview chat works
- [x] Paste job posting — bar collapses, presets appear
- [x] "Analyze My Fit" — questions + report card in chat
- [x] "Generate Resume" — resume preview card in chat
- [x] Download buttons work
- [x] `/hire-me/fit` redirects to `/hire-me`
- [x] Page refresh restores job context from sessionStorage
