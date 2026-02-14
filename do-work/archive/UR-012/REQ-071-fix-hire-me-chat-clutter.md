---
id: REQ-071
title: Fix cluttered Hire Me chat interface layout
status: completed
created_at: 2026-02-14T10:00:00Z
user_request: UR-012
claimed_at: 2026-02-14T18:00:00Z
route: B
completed_at: 2026-02-14T18:30:00Z
---

# Fix cluttered Hire Me chat interface layout

## What
The Hire Me page chat UI is visually cluttered. Several elements compete for space between the message stream and the text input, making the interface feel noisy and confusing. Specific issues:

1. **Input placeholder looks like a warning box** — The "Ask about Sam's career, skills, or experience..." placeholder with the input styling resembles a warning/alert rather than a clean text input. Consider pinning a brief instruction at the top of the chat instead, and making the input box look more like a standard chat input.

2. **Preset buttons clutter the input area** — "Analyze My Fit" and "Generate Resume" buttons appear between messages and the text input (inside `ChatInput` when `jobLoaded && !flowActive`), creating visual noise.

3. **Actions bar creates a busy middle layer** — Download buttons ("Interview Summary") and "+ New Conversation" button sit between the ChatStream and ChatInput, adding another layer of visual elements.

4. **Possible text input confusion** — The layout may make it seem like a new text input is needed per request, possibly because preset buttons or the actions bar visually separate the input from the conversation.

## Context
- Main page: `web/src/app/hire-me/page.tsx`
- Chat stream: `web/src/components/hire-me/ChatStream.tsx`
- Chat input: `web/src/components/hire-me/ChatInput.tsx`
- ChatStream has fixed height `h-[28rem] sm:h-[32rem]` — may be too cramped
- Actions bar renders conditionally between ChatStream and ChatInput when downloads or messages exist
- Preset buttons render inside ChatInput above the textarea
- This should be addressed AFTER REQ-069 (citations) and REQ-070 (chunk refs) since reducing content clutter may partially resolve the visual issues

---
*Source: The output is very cluttered. The input placeholder area looks like a warning box. Preset buttons and actions bar create visual noise between messages and input.*

---

## Triage

**Route: B** - Medium

**Reasoning:** Clear UI cleanup with specific issues listed and files named. Need to explore current layout patterns and component structure to make appropriate changes.

**Planning:** Not required

## Plan

**Planning not required** - Route B: Exploration-guided implementation

Rationale: Clear visual cleanup with well-defined issues and explicit file paths. Just need to see current component code to make targeted layout improvements.

*Skipped by work action*

## Exploration

**Issue 1 — Input looks like a warning box:**
- `ChatInput.tsx:88-91` — Container has `bg-zinc-50 dark:bg-zinc-900/50` background with `border-t border-zinc-200` making it feel like a separate panel/alert
- `ChatInput.tsx:139` — Textarea has heavy `rounded-xl border border-zinc-300 bg-white` styling

**Issue 2 — Preset buttons clutter input:**
- `ChatInput.tsx:94-123` — Two large blue buttons with icons rendered above textarea when `jobLoaded && !flowActive`
- These create a visual barrier between messages and the text input

**Issue 3 — Actions bar busy middle layer:**
- `page.tsx:70-118` — Actions bar renders between ChatStream and ChatInput when `downloads.length > 0 || messages.length > 0`
- Contains download buttons + "+ New Conversation" button in a `border-t` strip
- Creates a second visual separator between messages and input

**Issue 4 — Input confusion:**
- Caused by issues 2+3 stacking layers between the message stream and the text input

**Approach:**
1. Move preset buttons from ChatInput into ChatStream as suggestion chips below the welcome message (empty state only)
2. Move actions bar from between components to a thin header strip at the top of the chat container
3. Simplify ChatInput styling — remove the heavy container background, make the textarea cleaner
4. Increase chat container height slightly

*Explored by work action*

## Implementation Summary

- **ChatInput.tsx**: Removed preset buttons, simplified container (`bg-primary` + `border-border`), lighter textarea styling (`rounded-lg`, `bg-zinc-50`), smaller send button (`h-10 w-10`), removed "Press Enter to send" hint
- **ChatStream.tsx**: Added `onPreset`/`jobLoaded`/`flowActive` props; renders compact suggestion chips ("Analyze My Fit", "Generate Resume") as ghost pills below welcome message in empty state
- **page.tsx**: Moved actions bar from between ChatStream/ChatInput to top header strip with `border-b`; increased chat height to `h-[32rem] sm:h-[36rem]`; removed preset props from ChatInput, added to ChatStream

*Completed by work action (Route B)*

## Testing

**Tests run:** `npx vitest run`
**Result:** All 1245 tests passing (38 test files)

**TypeScript check:** `npx tsc --noEmit` — no new errors (only pre-existing NODE_ENV test issues)

**No new tests needed:** Layout/styling reorganization with no behavioral changes. No existing ChatInput/ChatStream test files.

*Verified by work action*
