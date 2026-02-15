---
id: REQ-088
title: Strip citations from PDF downloads (transcripts, fitness, resumes)
status: completed
created_at: 2026-02-14T20:15:00Z
user_request: UR-026
claimed_at: 2026-02-15T00:00:00Z
route: A
completed_at: 2026-02-15T00:10:00Z
---

# Strip Citations from PDF Downloads

## What
Citations (chunk references, source annotations) are leaking into downloadable outputs for transcripts and fitness reports. Check resumes as well — they may have the same issue.

## Why
Downloaded documents should be clean, professional output without internal citation artifacts.

## Context
- Known affected: transcript downloads, fitness report downloads
- Possibly affected: resume downloads (user flagged to check)
- Related to prior citation-stripping work (REQ-070, REQ-072, REQ-075) which addressed chat display but may not cover download paths
- The download generation pipeline may be pulling raw LLM output that still contains citation markers
- **CONFIRMED from actual PDF downloads (2026-02-14):**
  - **Transcript PDF**: Has a massive "Citations" section — 36 numbered RAG chunk references with heading paths (e.g., `[1] Employment History > Sr. Software Engineer — LTX-Credence (2012-2014) (h1:Employment History > h2:...)`). Takes up nearly 2 full pages of the PDF. This is the primary bug.
  - **Resume PDF**: Clean — no citations visible
  - **Fitness report PDF**: Citations leaking — same 36 RAG chunk references, 2 extra pages after a 1-page report
  - The transcript `.md` and `.html` files are clean — citations are being injected during PDF generation specifically
  - The resume HTML template includes `.citation-section`, `.citation-item`, `.citation-title`, `.citation-ref` CSS classes (resume.html lines 106-126) even though no citation content appeared — the CSS scaffolding is pre-built for citations
- The PDF generation pipeline is the culprit, not the markdown/HTML generation

---
*Source: Citations for PDF downloads for transcripts and fitness are creeping in. Better check for resumes as well.*

---

## Triage

**Route: A** - Simple

**Reasoning:** Bug with clear cause — `pdf-renderer.tsx` renders `CitationsSection` in fit report and transcript PDFs. Fix is to remove citations from PDF output.

**Planning:** Not required

## Plan

**Planning not required** - Route A: Direct implementation

Rationale: The `CitationsSection` component and citation props in `pdf-renderer.tsx` are the direct cause. Remove them from PDF templates.

*Skipped by work action*

## Implementation Summary

- Removed `CitationsSection` component from `pdf-renderer.tsx`
- Removed `Citation` type import from `pdf-renderer.tsx`
- Removed `citations` prop from `FitReportPdfProps` and `ResumePdfProps` interfaces
- Removed `citations` parameter from `renderFitReportPdf()` and `renderResumePdf()` signatures
- Removed citations rendering from `FitReportPdf` template (was adding ~2 pages of RAG chunk references)
- Removed citations rendering from `TranscriptPdf` template (was adding ~2 pages of RAG chunk references)
- Updated callers in `fit-report.ts` and `resume-generator.ts` to not pass citations
- Resume PDF was already clean (component ignored citations) — cleaned up the unused prop

*Completed by work action (Route A)*

## Testing

**Tests run:** `npm test -- --run`
**Result:** ✓ 1253 tests passing (37/38 test files)

**Pre-existing failure:** `page.test.tsx` — CTA link text mismatch (unrelated)

*Verified by work action*
