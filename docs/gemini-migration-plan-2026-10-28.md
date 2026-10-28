# Gemini Model Migration Plan

Oct 28, 2026, 11:47 AM PDT

## Next steps

1. **Sam:** run `gcloud auth application-default login` so local tests can reach Vertex AI again (the smoke test failed on expired credentials today). Blocks steps 2–5.
2. Switch the SDK and model in code (steps A–D below), with every unit test passing.
3. Run the three tools against the real model and compare them with today's 2.5 Flash fixtures; Sam reviews the side-by-side.
4. **Sam approves**, then update Vercel production (`VERTEX_AI_MODEL`, `VERTEX_AI_LOCATION`) and deploy.
5. Live check on samkirk.com/hire-me: fit, résumé, interview.

**State:** production runs `gemini-2.5-flash` in `us-central1`, retired by Google on Oct 20, 2026; all three Hire Me tools still answered on Oct 28, so the shutdown is not yet enforced, and it can stop without notice. Nothing has been changed yet.

## Contents

- [Recommendation](#recommendation)
- [Candidates compared](#candidates-compared)
- [What has to change](#what-has-to-change)
- [Steps and proof](#steps-and-proof)
- [Effort](#effort)
- [Sources](#sources)
- [Request (verbatim)](#request-verbatim)

## Recommendation

**Migrate to `gemini-3.5-flash-lite`, location `global`.** If its fit reports or résumés read worse than 2.5 Flash's in step 3, use `gemini-3.8-flash` instead; the code changes are the same.

Why 3.5 Flash-Lite:

- Google lists it as a replacement for `gemini-2.5-flash` on its [model versions page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions).
- Same price as 2.5 Flash on the `global` endpoint: $0.30 input / $2.50 output per million tokens ([pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)).
- GA, supported until July 21, 2027 or later.
- Its default thinking level is MINIMAL, which matches how the tools were tuned: thinking was capped because it ate the output budget.

## Candidates compared

Cost per résumé call uses the prompt size recorded in `web/src/lib/resume-generator.ts`: about 8,700 input and 3,900 output tokens.

| Model | Price in / out per 1M tokens | Résumé call | Supported until | Thinking levels (default) |
|---|---|---|---|---|
| `gemini-2.5-flash` (today) | $0.30 / $2.50 | $0.012 | Retired Oct 20, 2026 | budget in tokens |
| **`gemini-3.5-flash-lite`** | $0.30 / $2.50 global; $0.33 / $2.75 multi-region | $0.012 | July 21, 2027 or later | MINIMAL, LOW, MEDIUM, HIGH (MINIMAL) |
| `gemini-3.8-flash` | $0.75 / $3.75 through Dec 31, 2026; then $1.50 / $7.50 | $0.021, then $0.042 | Sept 2, 2027 or later | LOW, MEDIUM, HIGH (MEDIUM) |
| `gemini-3.5-flash` | $1.50 / $9.00 | $0.048 | May 19, 2027 or later | MINIMAL, LOW, MEDIUM, HIGH (MEDIUM) |

Gemini 3.6 Flash (retires Nov 19, 2026) and 3.7 Flash (Jan 28, 2027) are too close to retirement to consider.

## What has to change

1. **Location.** Neither candidate is offered in `us-central1`; both run in `global` or the `us` / `eu` multi-regions ([3.5 Flash-Lite](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite), [3.8 Flash](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-8-flash)). Production `VERTEX_AI_LOCATION` is `us-central1`.
2. **SDK.** The app uses `@google-cloud/vertexai` 1.10.0 in `web/src/lib/vertex-ai.ts`, `web/scripts/smoke-gcp.ts` and `web/scripts/e2e-real-llm.ts`. Google's [migration guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/migrate) says Vertex AI SDK releases after June 2026 won't support Gemini and recommends the Google Gen AI SDK (`@google/genai`, now 2.31.0). The old SDK builds a regional endpoint from the location, so `global` is unlikely to work without it; switching is the safe path.
3. **Thinking parameter.** Gemini 3 replaces `thinkingBudget` with `thinkingLevel`. Google warns that `thinkingBudget` on Gemini 3 "can cause intermittent 400: INVALID_ARGUMENT errors" ([thinking](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking)). The interview chat sends `thinkingBudget: 256` (`INTERVIEW_THINKING_BUDGET` in `web/src/lib/interview-chat.ts`); 8 references in all.
4. **Token limits.** `INTERVIEW_MAX_TOKENS` (3072) and the 16384 caps in `fit-report.ts` and `resume-generator.ts` were sized for 2.5 Flash thinking; re-check them against real output. Google also notes reported token counts may rise under the new accounting.
5. **Spend cap.** `web/src/lib/spend-cap.ts` estimates $1.25 / $3.75 per million. That over-counts for 3.5 Flash-Lite (safe), but would under-count 3.8 Flash after Jan 1, 2027 ($1.50 / $7.50), letting real spend exceed the $20 monthly cap. Set it to the chosen model's price.
6. **Config.** `web/.env.local` (still `gemini-2.5-flash`), `web/.env.local.example` (stale `gemini-3-pro-preview`), Vercel production variables, and 4 files that name `gemini-2.5-flash` in source or test fixtures.

## Steps and proof

| Step | Change | Proof |
|---|---|---|
| A | Replace `@google-cloud/vertexai` with `@google/genai` in `vertex-ai.ts` and both scripts; keep the token accounting (visible plus thinking) | `npm test` passes (all 1,232); `npm run smoke:gcp -- --section=10` passes on the new model |
| B | `thinkingBudget` → `thinkingLevel` (interview LOW or MINIMAL; fit and résumé at the model default) | Unit tests for interview chat and vertex-ai updated first and failing, then passing |
| C | Spend-cap prices set to the chosen model | `spend-cap.test.ts` passes with the new constants |
| D | `.env.local`, `.env.local.example`, fixtures → new model and `global` | `grep -r gemini-2.5-flash web/src web/scripts` returns nothing |
| E | Real-model run of fit, résumé and interview on the fixtures | `npm run test:e2e:real` passes; no truncation flags; side-by-side with the 2.5 Flash fixtures for Sam |
| F | Vercel production variables, then deploy (Sam approves both) | `vercel env run -e production -- printenv VERTEX_AI_MODEL VERTEX_AI_LOCATION` shows the new values |
| G | Live check | All three tools answer on samkirk.com/hire-me; footer shows the new deploy |

## Effort

About half a day of agent work for steps A–E, mostly the SDK swap and its test mocks. Sam's part: the `gcloud` sign-in, reading the side-by-side, and approving the Vercel change and the deploy.

## Sources

- [Model versions and lifecycle](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions), read Oct 28, 2026
- [Migrate to the latest Gemini models](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/migrate)
- [Thinking](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking)
- [Generative AI pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)
- Production values read with `vercel env run -e production -- printenv` (no file written): `VERTEX_AI_MODEL=gemini-2.5-flash`, `VERTEX_AI_LOCATION=us-central1`

## Request (verbatim)

Sam, Oct 28, 2026:

> What model should  we migrate to and what will it take to  do that migration?
