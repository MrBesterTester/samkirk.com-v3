# Hire Me Streamline — Blueprint

## Overview

Four targeted changes: simplify the home page section, flatten the header nav, delete redirect stubs, and update tests. No backend or `/hire-me` page changes.

## Step 1: Simplify Home Page "Hiring Manager?" Section

**File:** `web/src/app/page.tsx`

### Current (lines 42-83)

Three-column grid of `ToolPreview` cards linking to `/hire-me/fit`, `/hire-me/resume`, `/hire-me/interview`.

### Target

Replace the three-card grid with a single, compelling call-to-action block. Keep the "Hiring Manager?" heading. Update the subtitle to describe the unified experience. Add a single prominent link to `/hire-me`.

### Implementation

```tsx
{/* Quick Actions for Hiring Managers */}
<section className="mt-8">
  <h2 className="text-center text-2xl font-semibold text-text-primary">
    Hiring Manager?
  </h2>
  <p className="mt-2 text-center text-text-secondary">
    Use my AI-powered hiring tools to evaluate fit, generate a tailored resume,
    and interview me — all in one place.
  </p>
  <div className="mt-6 text-center">
    <Link
      href="/hire-me"
      className="inline-block rounded-lg bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover"
    >
      Try Hire Me Tools &rarr;
    </Link>
  </div>
</section>
```

**Key decisions:**
- Remove the `ToolPreview` import if it's no longer used on this page
- Keep the section structure minimal — heading, subtitle, single CTA button
- Use `bg-accent` for the button to make it stand out as a primary action
- The subtitle hints at all three capabilities without making them separate destinations

## Step 2: Flatten Header Navigation

**File:** `web/src/components/Header.tsx`

### Current (lines 8-16)

```typescript
{
  href: "/hire-me",
  label: "Hire Me",
  children: [
    { href: "/hire-me/fit", label: "How Do I Fit?" },
    { href: "/hire-me/resume", label: "Custom Resume" },
    { href: "/hire-me/interview", label: "Interview Me" },
  ],
},
```

### Target

Remove the `children` array so "Hire Me" becomes a flat link:

```typescript
{ href: "/hire-me", label: "Hire Me" },
```

No other header changes needed — the existing rendering logic already handles links without children as simple nav items.

## Step 3: Delete Redirect Stubs

**Delete these files:**
- `web/src/app/hire-me/fit/page.tsx`
- `web/src/app/hire-me/resume/page.tsx`
- `web/src/app/hire-me/interview/page.tsx`

**Also delete the now-empty directories:**
- `web/src/app/hire-me/fit/`
- `web/src/app/hire-me/resume/`
- `web/src/app/hire-me/interview/`

### Codebase scan for stale references

Search the codebase for any remaining references to `/hire-me/fit`, `/hire-me/resume`, or `/hire-me/interview` and update or remove them. Likely locations:
- Test files (E2E navigation tests)
- Any sitemap or metadata files
- The `hire-me-unified-SPECIFICATION.md` (documentation only — leave as-is for history)

## Step 4: Update Tests

### Unit tests

- If any unit tests reference the three sub-routes or the three-card home page layout, update them.

### E2E tests

- Navigation tests that click through to `/hire-me/fit` etc. should be updated to verify 404 or removed.
- Home page tests that assert three ToolPreview cards should be updated to assert the single CTA.
- `/hire-me` page tests should still pass unchanged.

### Manual verification

1. `npm test` — all unit tests pass
2. `npx playwright test` — all E2E tests pass
3. Visual check: home page shows single CTA, header has no dropdown

## Files Changed

| File | Change |
|------|--------|
| `web/src/app/page.tsx` | Replace 3-card grid with single CTA link |
| `web/src/components/Header.tsx` | Remove `children` from Hire Me nav item |
| `web/src/app/hire-me/fit/page.tsx` | **Delete** |
| `web/src/app/hire-me/resume/page.tsx` | **Delete** |
| `web/src/app/hire-me/interview/page.tsx` | **Delete** |
| Test files (TBD) | Update assertions for new home page and removed routes |

## Risk Assessment

**Low risk.** All changes are UI/navigation only. The `/hire-me` page and all API endpoints are untouched. The redirect stubs being removed were only recently added and have no meaningful external link equity.
