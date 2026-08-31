# Plan — Interview chat truncation and thinking-token accounting

*Created: 2026-08-31 PST*
*Status: step 1 done; steps 2–4 not started.*
*Scope: `web/src/lib/vertex-ai.ts`, `web/src/lib/interview-chat.ts`, `web/src/lib/spend-cap.ts`.*

This is a **plan** (how). The requirements it serves are in [SPECIFICATION.md §10 Abuse Prevention & Cost Control](SPECIFICATION.md).

## Table of Contents

- [The defect](#the-defect)
- [Why the current cap is not the cost defense](#why-the-current-cap-is-not-the-cost-defense)
- [Step 1 — Count thinking tokens in the spend cap (DONE)](#step-1--count-thinking-tokens-in-the-spend-cap-done)
- [Step 2 — Cap the thinking budget](#step-2--cap-the-thinking-budget)
- [Step 3 — Guard MAX_TOKENS on the interview path](#step-3--guard-max_tokens-on-the-interview-path)
- [Step 4 — Raise INTERVIEW_MAX_TOKENS only if still needed](#step-4--raise-interview_max_tokens-only-if-still-needed)
- [Constraint: the model is being discontinued](#constraint-the-model-is-being-discontinued)

## The defect

Asked a substantive question, the Interview me NOW chatbot returned a sentence fragment and served it as a complete answer with `success: true`:

> "I have extensive experience in test automation, spanning over 30 years across nearly all of my positions from TRW/Vidar in 1980 through my current consulting work. **My roles**"

Measured with temporary instrumentation on 2026-08-31:

| | Tokens |
|---|---|
| `INTERVIEW_MAX_TOKENS` cap | 1024 |
| `thoughtsTokenCount` (internal reasoning) | **901** |
| `candidatesTokenCount` (visible answer) | **119** |
| `finishReason` | **`MAX_TOKENS`** |

88% of the budget went to thinking. `gemini-2.5-flash` is a thinking model and thinking tokens count against `maxOutputTokens`. Short questions survive; long ones truncate — the worst shape, because the substantive question is the one that breaks.

Nothing caught it: `generateContentWithHistory` returns `finishReason`, and `interview-chat.ts` never reads it. The gap was known and deferred in a code comment, which assumed a MAX_TOKENS cut here was "degraded-but-usable". This evidence disproves that.

## Why the current cap is not the cost defense

`INTERVIEW_MAX_TOKENS = 1024` appears nowhere in the spec. §10 mandates exactly three controls, all implemented: reCAPTCHA v2 per session, **10 requests / 10 minutes**, and a **$20/month** cap with a GCP Billing Budget backstop. Those bound malicious spend; the output cap only shapes each permitted call.

The cap was also achieving the opposite of its intent: paying for 901 tokens of unseen reasoning while truncating the 119 tokens that carry value.

## Step 1 — Count thinking tokens in the spend cap (DONE)

Both call paths billed output as `candidatesTokenCount` alone, so thinking tokens — which Google bills as output — were invisible to the counter.

| | Tokens | Cost at `$0.00375/1K` |
|---|---|---|
| Counted | 119 | $0.00045 |
| Actually billed | 1020 | $0.00383 |
| Under-count | | **≈8.6x** |

The $20 app-level cap was permitting up to roughly $170 of real output spend on interview-shaped turns.

**Change:** new exported `billableOutputTokens()` in `vertex-ai.ts`, used by both `generateContent` and `generateContentWithHistory`. Adds `thoughtsTokenCount` to `candidatesTokenCount`, reads the field defensively (the SDK type does not declare it), and falls back to a text estimate when metadata is absent or all-zero rather than recording a call as free.

Covered by 4 new cases in `vertex-truncation.test.ts` (8 passing in that file).

## Step 2 — Cap the thinking budget

Constrain reasoning directly rather than inflating the total. This reclaims answer space **and reduces real spend**, since the 901 unseen tokens stop being paid for. Preferred over Step 4.

Open question: the exact Vertex parameter and a sane value, sampled across several question shapes rather than guessed.

## Step 3 — Guard MAX_TOKENS on the interview path

A truncated answer must never reach a hiring manager as complete. `generateContent` already has `assertResponseComplete`; the history/interview path deliberately does not. With `finishReason` now verified as `MAX_TOKENS`, the precondition that comment set is satisfied.

Decide between retrying with a larger budget and surfacing the truncation; throwing outright would turn a degraded answer into a failed one, which may be worse for a visitor.

## Step 4 — Raise INTERVIEW_MAX_TOKENS only if still needed

Possibly unnecessary once Step 2 lands. If required, size it from measurements. Cost impact is small — 1024→3072 adds at most $0.0077/turn at the conservative rate, and 9,173 of 10,266 prompt tokens were cache hits, so the expensive half is already discounted.

## Constraint: the model is being discontinued

Google notified `sam@samkirk.com` on 2026-07-29: **Gemini 2.5 Flash, Flash Lite and Pro endpoints are discontinued 2026-10-20**. `web/.env.local` sets `VERTEX_AI_MODEL=gemini-2.5-flash`.

Any budget tuning must be validated against the replacement model, not fitted to `gemini-2.5-flash`. The migration is a separate, harder deadline: on that date these tools stop working entirely.
