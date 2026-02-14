# Unified Hire Me Page — Blueprint

## Files to Create/Modify

### New files (`web/src/components/hire-me/`):

1. **`useHireMe.ts`** — Custom hook: all state, API calls, preset handlers
   - `loadJob(mode, data)` — loads job into context bar
   - `clearJob()` — removes job context
   - `triggerFit()` — starts fit analysis flow
   - `triggerResume()` — starts resume generation
   - `sendMessage(text)` — sends chat message
   - `answerFitQuestion(answer)` — handles fit follow-up
   - `newConversation()` — clears chat, keeps job
   - `download(submissionId)` — triggers artifact download

2. **`JobContextBar.tsx`** — Collapsible top bar
   - Collapsed (no job): "Add a job posting to unlock fit analysis and custom resume" + expand button
   - Expanded: Same paste/URL/file tabs as current `JobInputForm` + submit + cancel
   - Loaded: Shows job title/company (or "Job posting loaded") + swap/remove buttons
   - Persists to sessionStorage

3. **`ChatStream.tsx`** — Scrollable message area
   - Renders typed messages with appropriate components
   - Auto-scrolls to bottom on new messages
   - Welcome message when empty

4. **`ChatInput.tsx`** — Bottom input area
   - Auto-resizing textarea + send button (reuse existing pattern)
   - Preset chips row above input (visible when job loaded and no flow active)
   - Disabled during active loading

5. **`FitReportCard.tsx`** — Rich chat card for fit results
   - Overall score badge, category breakdown, recommendation, unknowns
   - Download button inline
   - Adapted from current `Results` component in fit/page.tsx

6. **`ResumePreviewCard.tsx`** — Rich chat card for resume results
   - Header, summary, stats grid
   - Download button inline
   - Adapted from current `ResumePreview` + `Results` in resume/page.tsx

7. **`FitQuestionCard.tsx`** — Interactive chat card for fit follow-ups
   - Question text, radio options or textarea, submit button
   - Progress indicator ("Question 2 of 5")
   - Adapted from current `FollowUpQuestion` component
   - Disabled after answered (shows selected answer)

### Modified files:

8. **`web/src/app/hire-me/page.tsx`** — Rewrite from hub to unified page
   - Imports all components above
   - Wraps chat area in `ToolGate` (single captcha for all tools)
   - Page header + description
   - Composes: JobContextBar + ToolGate(ChatStream + ChatInput)

9. **`web/src/app/hire-me/fit/page.tsx`** — Replace with redirect to `/hire-me`
10. **`web/src/app/hire-me/resume/page.tsx`** — Replace with redirect to `/hire-me`
11. **`web/src/app/hire-me/interview/page.tsx`** — Replace with redirect to `/hire-me`

### Unchanged:
- All API routes (`/api/tools/fit/*`, `/api/tools/resume`, `/api/tools/interview`)
- `ToolGate.tsx` (used as-is)
- Backend logic (no changes needed)

## Implementation Sequence

### Phase 1: Extract shared components (Steps 1.1–1.5)
1.1. Create `web/src/components/hire-me/` directory
1.2. Build `JobContextBar.tsx` (adapted from existing `JobInputForm`)
1.3. Build `ChatInput.tsx` (adapted from interview's `ChatInput`)
1.4. Build `ChatStream.tsx` (adapted from interview's message rendering)
1.5. Build rich card components: `FitReportCard.tsx`, `ResumePreviewCard.tsx`, `FitQuestionCard.tsx`

### Phase 2: Build the hook (Step 2.1)
2.1. Create `useHireMe.ts` with all state management and API handlers
   - Port fit flow logic from `FitToolContent`
   - Port resume flow logic from `ResumeToolContent`
   - Port chat logic from `InterviewToolContent`
   - Add job context management

### Phase 3: Assemble the page (Steps 3.1–3.2)
3.1. Rewrite `web/src/app/hire-me/page.tsx` as the unified page
3.2. Wire all components together through the hook

### Phase 4: Redirects + cleanup (Steps 4.1–4.2)
4.1. Replace old tool pages with `redirect("/hire-me")` (Next.js server redirect)
4.2. Remove dead code from old pages

### Phase 5: Test (Steps 5.1–5.5)
5.1. Run existing Vitest unit tests: `npm test`
5.2. Run Playwright E2E tests: `npx playwright test`
5.3. Manual testing of all three flows (fit, resume, chat) through the unified page
5.4. Verify sessionStorage persistence of job context across page reloads
5.5. Verify redirects from old URLs
