---
id: REQ-079
title: "Simplify Home Page 'Hiring Manager?' Section"
status: pending
created_at: 2026-02-14T12:00:00-08:00
user_request: UR-020
related: [REQ-080, REQ-081, REQ-082]
batch: "hire-me-streamline-step-1"
source_step: "1"
source_doc: "docs/hire-me-streamline-TODO.md"
blueprint_ref: "docs/hire-me-streamline-BLUEPRINT.md"
model_hint: "Sonnet 4"
---

# Simplify Home Page "Hiring Manager?" Section (Step 1)

## What
Replace the three `ToolPreview` cards on the home page with a single prominent CTA button linking to `/hire-me`. Update the section subtitle to describe the unified tool experience.

## Checklist
- [ ] 1.1 Replace the three `ToolPreview` cards with a single CTA link to `/hire-me`
- [ ] 1.2 Update section subtitle to describe the unified tool experience
- [ ] 1.3 Remove unused `ToolPreview` import from `page.tsx` (if no longer needed on this page)
- [ ] 1.4 Verify home page renders correctly (`npm run dev` and visual check)

## Blueprint Guidance
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

## Context
- **Document set**: hire-me-streamline
- **Phase**: Step 1
- **Specification**: See docs/hire-me-streamline-SPECIFICATION.md for full requirements (R1, R5)
- **Model recommendation**: Sonnet 4 (advisory)

## Dependencies
None — this step can be done independently. Steps 1-3 are independent; Step 4 depends on all prior steps.

---
*Source: docs/hire-me-streamline-TODO.md, Step 1*
