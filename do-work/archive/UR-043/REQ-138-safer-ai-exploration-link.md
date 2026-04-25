---
id: REQ-138
title: Add Safer AI exploration linking Anthropic Fellows essays
status: completed
created_at: 2026-04-25T12:00:00Z
user_request: UR-043
claimed_at: 2026-04-25T19:31:03Z
route: B
completed_at: 2026-04-25T19:33:40Z
---

# Add Safer AI exploration linking Anthropic Fellows essays

## What

Add a new "Safer AI" entry to the explorations page (`web/src/app/explorations/page.tsx`) that links to the Anthropic Fellows Program 2026 essay drafts. The essays HTML file lives at `/Users/sam/Projects/ClaudeProjects/MyCareerAgent/Anthropic/Fellows_2026/SamuelKirk_Essays_Anthropic_Fellows_2026-04-23.html` and needs to be made accessible from `samkirk.com/explorations/safer-ai` (URL convention: lowercase, hyphenated — user wrote "safer-AI" in spec).

This is an **update to the explorations page only** — no other pages or navigation should change.

## Annotation (derived from reading the proposal)

The user asked that the annotation be drawn from reading through the proposal. Suggested copy for the explorations card description:

> Essay drafts for the Anthropic Fellows Program 2026, exploring how Nancy Leveson's STAMP/STPA systems-safety methodology can be applied to AI safety — drawing on four decades of test and diagnostic engineering as the bridge between traditional safety engineering and modern red-teaming, evaluation, and reliability research.

A shorter alternative if the card length doesn't fit:

> Essay drafts for the Anthropic Fellows Program 2026 — applying Leveson's STAMP/STPA systems-safety methodology to AI safety.

Title for the card: **Safer AI** (matches user's intent and the URL slug).

## Implementation Notes

The explorations page (`web/src/app/explorations/page.tsx`) supports two link styles for entries:
- **Internal route** (e.g., `/explorations/category-theory`) — rendered with Next.js `<Link>`
- **External link** (e.g., GitHub Pages) — rendered with `<a target="_blank">`

Either approach works for this request. Two sensible options for the builder to choose between:

1. **Embed-style subpage** (matches the recent Computer Diagnostics pattern from REQ-137): Create `web/src/app/explorations/safer-ai/page.tsx` that embeds the essays HTML — and copy the source HTML file into `web/public/` (or render its content directly in the route). Internal link.
2. **Static asset link**: Copy `SamuelKirk_Essays_Anthropic_Fellows_2026-04-23.html` to `web/public/explorations/safer-ai.html` (or similar) and link directly to it. Could be marked `external: true` to open in a new tab, or served at the `/explorations/safer-ai` URL via Next's static-file handling.

Match the pattern that REQ-137 used for `/explorations/computer-diagnostics` if that's already established as the project's convention for hosting external HTML.

Source HTML file: `/Users/sam/Projects/ClaudeProjects/MyCareerAgent/Anthropic/Fellows_2026/SamuelKirk_Essays_Anthropic_Fellows_2026-04-23.html`

## Context

The proposal's central themes (for context, not requirements):
- 40 years of test/diagnostic engineering as the lineage feeding into AI safety
- Applying Leveson's STAMP/STPA to language-model training and deployment
- ML Systems & Performance workstream at Anthropic
- A research-plan write-up to be published on samkirk.com is mentioned as in-progress

The essays were drafted 2026-04-23 PST for submission ~2026-04-25 to the Anthropic Fellows cohort starting Jul 20, 2026.

## Constraints

- **Scope is the explorations page only.** Do not modify the homepage, nav, or other routes.
- Use the existing `Exploration` interface and card styling — don't introduce new visual treatments.
- File naming: prefer lowercase URL slug (`safer-ai`), even though the user wrote `safer-AI` — matches the project's existing kebab-case convention.

---
*Source: "add a task that adds /Users/sam/Projects/ClaudeProjects/MyCareerAgent/Anthropic/Fellows_2026/SamuelKirk_Essays_Anthropic_Fellows_2026-04-23.html as link to samkirk.com/explorations/safer-AI. This an update to the explorations page only. Please read thru the proposal to add the proper annotation to the link on the explorations page of samkirk.com."*

---

## Triage

**Route: B** - Medium

**Reasoning:** The outcome is clear (add a card on `/explorations` and make the essays HTML reachable at `/explorations/safer-ai`), but the project has a recently-established pattern for embedding external HTML (REQ-137 / Computer Diagnostics) that we need to discover and match.

**Planning:** Not required

## Plan

**Planning not required** - Route B: Exploration-guided implementation

Rationale: Single-page change with a clear outcome. Just need to confirm the embedding pattern from REQ-137 before implementing.

*Skipped by work action*

## Exploration

The project has a well-established pattern for embedding standalone HTML pages, used by every existing exploration sub-route and by REQ-137:

**Files involved:**
- `web/src/app/explorations/page.tsx` — the hub page; add entry to the `explorations: Exploration[]` array
- `web/src/app/explorations/page.test.tsx` — Vitest tests asserting each card's title/href/description
- `web/src/components/StaticHtmlViewer.tsx` — client component, loads HTML from `/static/<src>` in an iframe with auto-resize
- `web/public/static/` — where the source HTML files live (e.g., `category-theory.html`, `computer-diagnostics-feature.html`)
- `web/src/app/explorations/category-theory/page.tsx` — canonical reference: page with `metadata`, heading + intro, "Download HTML" button, then `<StaticHtmlViewer />`

**Implementation approach:**
1. Copy `SamuelKirk_Essays_Anthropic_Fellows_2026-04-23.html` into `web/public/static/safer-ai.html`
2. Create `web/src/app/explorations/safer-ai/page.tsx` mirroring the `category-theory/page.tsx` structure (Next `Metadata`, heading, download button, `StaticHtmlViewer src="safer-ai.html"`)
3. Add a new entry to the `explorations` array in `web/src/app/explorations/page.tsx`:
   - `href: "/explorations/safer-ai"` (internal — not external; renders with `<Link>`)
   - `title: "Safer AI"`
   - `description`: the annotation derived from reading the essays
4. Update `web/src/app/explorations/page.test.tsx` to assert the new link/title/description

URL slug: `safer-ai` (lowercase, kebab-case — matches every other entry).

*Generated by orchestrator (manual exploration)*

## Implementation Summary

- Copied `SamuelKirk_Essays_Anthropic_Fellows_2026-04-23.html` to `web/public/static/safer-ai.html` (14,068 bytes).
- Created `web/src/app/explorations/safer-ai/page.tsx` — Next.js page with `Metadata`, heading, "Download HTML" button, and `<StaticHtmlViewer src="safer-ai.html" minHeight={800} />`. Mirrors the structure of `web/src/app/explorations/category-theory/page.tsx`.
- Added a new `Safer AI` entry to the `explorations` array in `web/src/app/explorations/page.tsx`. Internal route (`/explorations/safer-ai`), description summarizes the proposal's central theme: applying Leveson's STAMP/STPA systems-safety methodology to AI safety, drawing on four decades of test/diagnostic engineering.
- Updated `web/src/app/explorations/page.test.tsx` — added link assertion for `/explorations/safer-ai` and a description match for "anthropic fellows program 2026".

Scope held to the explorations area only. No homepage, nav, or unrelated route changes.

*Completed by work action (Route B)*

## Testing

**Tests run:**
- `npx vitest run src/app/explorations/page.test.tsx` → ✓ 3/3 passing
- `npx tsc --noEmit` → exit 0 (clean)
- `npx vitest run` (full suite) → 1291 passing, 2 skipped, 1 pre-existing failure

**New/updated tests:**
- `web/src/app/explorations/page.test.tsx` — extended to assert the Safer AI link href and description.

**Pre-existing failure (not related to this REQ):**
- `src/app/api/public/[...path]/route.test.ts` — GCS integration test failed with Google `invalid_rapt` auth error. The signed-URL test reaches real GCP and the local gcloud refresh token is expired. Unaffected by changes in this REQ. Re-auth via `gcloud auth application-default login` (per memory: must run in a bare terminal, not from inside Claude Code).

*Verified by work action*
