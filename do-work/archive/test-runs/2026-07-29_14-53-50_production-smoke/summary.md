---
timestamp: 2026-07-29T14:53:50-0700
run_type: production-smoke
target: https://samkirk.com
commit: a276dfd
suites_run: [e2e-smoke]
overall: pass
---

# Test Run: 2026-07-29 14:53:50 PDT — Production Smoke

Post-deploy verification of the SEO/analytics ship against the **live production
site**, not localhost. Run manually; the equivalent check is now wired into CI as
the `smoke-test` job (see `.github/workflows/ci.yml`).

## Summary

| Suite | Target | Status | Passed | Failed | Duration |
|-------|--------|--------|--------|--------|----------|
| E2E Smoke (`e2e/full-app.spec.ts`) | https://samkirk.com | PASSED | 26 | 0 | 5.6s |
| **Total** | | **PASSED** | **26** | **0** | **5.6s** |

## Coverage

| Group | Tests |
|-------|-------|
| Public Pages — Render Correctly | 5 |
| Machine Learning & Robotics Pages | 2 |
| Exploration Pages — Render Correctly | 5 |
| Admin Pages — Authentication Required | 4 |
| Navigation — Links Work | 3 |
| API Endpoints — Basic Health | 2 |
| Error Handling — 404 Pages | 2 |
| Accessibility — Basic Checks | 3 |

## Why only `full-app.spec.ts`

The tool specs (`fit-tool`, `resume-tool`, `interview-tool`, `download-buttons`)
require `E2E_TESTING=true` to be set **server-side** so the ToolGate captcha
auto-bypasses. Production deliberately does not set it, so those specs would fail
against production for reasons unrelated to deployment health.

## How to reproduce

```bash
cd web
export VERCEL_AUTOMATION_BYPASS_SECRET=<Protection Bypass for Automation token>
PLAYWRIGHT_BASE_URL=https://samkirk.com npx playwright test e2e/full-app.spec.ts
```

The bypass secret is required: Vercel bot mitigation answers unauthenticated
requests with HTTP 429 and `x-vercel-mitigated: challenge`, which is why plain
`curl` cannot verify production. `playwright.config.ts` sends the token as the
`x-vercel-protection-bypass` header whenever `PLAYWRIGHT_BASE_URL` is set.

## Notable results

- **`session init endpoint responds with valid session payload` passed.** The same
  test failed on localhost earlier today with `invalid_grant / invalid_rapt`,
  confirming that failure was expired local gcloud ADC and never affected
  production, which authenticates via its own service account.
- **Heading-structure assertions passed**, validating the `.first()` fix from
  `fec5d45` against the real deployment, including all five exploration pages.

Raw output: `production-smoke.log`
