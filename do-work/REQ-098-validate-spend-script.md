---
id: REQ-098
title: "Create spend estimation validation script"
status: pending
created_at: 2026-02-16T12:00:00-08:00
user_request: UR-031
related: [REQ-095, REQ-096, REQ-097, REQ-099]
batch: "security-phase-3"
source_step: "3.1"
source_doc: "docs/security-TODO.md"
blueprint_ref: "docs/security-BLUEPRINT.md"
model_hint: "Codex/Opus"
---

# Create spend estimation validation script (Step 3.1)

## What
Create a lightweight validation script that reads the app's estimated spend from Firestore and prints a comparison report, including pricing constants and instructions for checking actual GCP billing.

## Checklist
- [ ] **[Codex/Opus]** Create `web/scripts/validate-spend.ts`
  - Reads Firestore `spendMonthly/{YYYY-MM}` document
  - Prints: estimated spend, budget, % used, pricing constants
  - Prints: GCP Billing console URL for comparison
  - Includes `LAST_PRICING_REVIEW` date; warns if stale >30 days
- [ ] **[Codex/Opus]** Add `"validate-spend"` script to `web/package.json`
- [ ] **[Codex/Opus]** TEST: Run `npm run lint` — no lint errors
- [ ] **[Codex/Opus]** TEST: Run `npm run validate-spend` with GCP credentials — output is clear and correct

## Blueprint Guidance
### 3.1 Create spend estimation validation script

- **Goal**: Provide a way to compare the app's estimated spend (Firestore `spendMonthly` doc) against actual GCP billing, so pricing drift can be detected.
- **Files to create**:
  - `web/scripts/validate-spend.ts` — reads current month's Firestore spend doc and prints it alongside instructions for checking actual GCP billing.
- **Design**:
  - Read the `spendMonthly/{YYYY-MM}` Firestore document.
  - Print: estimated spend, budget, percentage used, and the hardcoded pricing constants.
  - Print: instructions to compare against GCP Billing console (with a direct URL).
  - Print: a warning if the pricing constants haven't been reviewed in >30 days (based on a `LAST_PRICING_REVIEW` constant in the script).
- **Acceptance criteria**:
  - Script runs with `npx tsx web/scripts/validate-spend.ts`.
  - Output is clear and actionable.
  - No secrets are printed.
- **Test plan**:
  - Run the script locally with GCP credentials.
  - Verify the output includes the expected fields.
- **Prompt**:

```text
Create web/scripts/validate-spend.ts.

This script reads the current month's spend tracking from Firestore and prints a comparison report.

Requirements:
- Import from the existing spend-cap.ts module to reuse types and constants.
- Read spendMonthly/{YYYY-MM} from Firestore.
- Print: estimated spend, budget, % used, pricing constants.
- Print a URL to the GCP Billing console for the project.
- Include a LAST_PRICING_REVIEW date constant; warn if >30 days stale.
- Add a "validate-spend" script to web/package.json.

No unit tests needed (this is a manual validation script).
Run: npm run lint.
```

## Context
- **Document set**: security
- **Phase**: 3 — Cost Validation Script (F7)
- **Specification**: See docs/security-SPECIFICATION.md for full requirements
- **Model recommendation**: Codex/Opus (advisory — use if your tool supports model selection)

## Dependencies
Independent of Phases 1 and 2 — can run in parallel.

---
*Source: docs/security-TODO.md, Step 3.1*
