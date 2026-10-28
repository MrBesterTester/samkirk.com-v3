# Gemini Migration: Side-by-Side of Old and New Model Outputs

Oct 28, 2026, 12:20 PM PDT

## Executive summary

**Recommendation: ship `gemini-3.5-flash-lite` at `global`.** It isn't clearly worse than `gemini-2.5-flash` on any of the three Hire Me tools, so the 3.8 Flash fallback isn't needed.

| Tool | 3.5 Flash-Lite vs 2.5 Flash | Verdict |
|---|---|---|
| Fit analysis | Same scores in every run. Rationales are about half as long and plainer. | Equal on substance, shorter |
| Résumé (production prompt) | Nothing invented in 3 of 3 runs. 2.5 Flash added an unsupported "CI/CD" in 1 of 2. Shorter: 492 to 565 words vs 631 to 642 (target 600 to 900). | Equal or better on accuracy, shorter |
| Interview chat | Complete answers at MINIMAL thinking. As specific as 2.5 Flash's, and more detailed on the broad questions. | Equal or better |
| Cost and speed | Résumé call about $0.0065 vs $0.013; about 8 s vs 27 s | Half the cost, 3x faster |

Two cautions:

1. **Résumés run short.** All three 3.5 Flash-Lite résumés fell under the 600-word floor. The code only warns above the ceiling, so nothing flags this. If Sam wants fuller résumés, the cheaper fix is a prompt change; switching to 3.8 Flash gave 586 to 611 words at 3.4x the cost (6.8x from Jan 1, 2027).
2. **The real-LLM test script's own résumé prompt invents skills on 3.5 Flash-Lite.** Its weaker prompt (not production's) produced "Docker/Containerization equivalents" and "CI/CD" in 3 of 3 runs; neither appears in Sam's résumé. Production's "NEVER INVENT" prompt did not. The site is unaffected, but the script's prompt should be brought in line with production's.

## Contents

- [What was compared](#what-was-compared)
- [Fit analysis](#fit-analysis)
- [Résumé generation](#résumé-generation)
- [Interview chat](#interview-chat)
- [Thinking level for the interview](#thinking-level-for-the-interview)
- [Test results](#test-results)
- [If Sam prefers 3.8 Flash](#if-sam-prefers-38-flash)
- [Raw outputs](#raw-outputs)
- [Request (verbatim)](#request-verbatim)

## What was compared

The old outputs in `web/test-fixtures/` don't make a fair baseline for fit and résumé. They date from Feb 13, 2026, five months before the switch to 2.5 Flash. Only the interview transcript (Sept 2, 2026) came from 2.5 Flash. Google hasn't shut 2.5 Flash off yet, so I ran the same prompts on all three models today:

| Run | Prompt | Models, runs each |
|---|---|---|
| Fit | `scripts/e2e-real-llm.ts` fit prompt, its TechCorp "Senior Software Engineer - AI Platform" posting, 36 seeded résumé chunks | 3.5 Flash-Lite ×3, 2.5 Flash ×3, 3.8 Flash ×3 |
| Résumé, production | `buildResumeGenerationPrompt` and `RESUME_GENERATION_SYSTEM_PROMPT` from `web/src/lib/resume-generator.ts`, same posting | 3.5 Flash-Lite ×3, 2.5 Flash ×2, 3.8 Flash ×2 |
| Résumé, test script | `scripts/e2e-real-llm.ts` résumé prompt | 3.5 Flash-Lite ×3, 2.5 Flash ×3, 3.8 Flash ×3 |
| Interview | `scripts/e2e-real-llm.ts`, two questions, at production settings (3,072-token cap, MINIMAL) | 3.5 Flash-Lite today vs the 2.5 Flash fixture from Sept 2 |

Every skill item and risky term in each résumé was checked against the full seeded résumé context. Each run is a single sample; three runs per model show tendencies, not rates.

## Fit analysis

| | 3.5 Flash-Lite | 2.5 Flash | 3.8 Flash |
|---|---|---|---|
| Overall score | Partial, Partial, Partial | Partial, **Well**, Partial | Partial, Partial, Partial |
| Categories | Technical Partial, Experience Well, Location Well (all runs) | Same, except Technical **Well** in run 2 | Same as 3.5 Flash-Lite |
| Length (words of JSON) | 182 to 191 | 348 to 407 | 237 to 277 |
| Output tokens (visible + thinking) | 389 to 400 + 0 | 672 to 741 + 1,589 to 2,114 | 469 to 549 + 494 to 788 |
| Response time | about 2 s | 14 to 18 s | 15 to 116 s |

2.5 Flash's run-2 "Well" overlooked the missing TensorFlow, PyTorch, Docker and Kubernetes that the other eight runs flagged. 3.5 Flash-Lite was consistent.

Example recommendations, same posting:

- **3.5 Flash-Lite:** "While Sam brings deep Python and TypeScript expertise alongside recent AI application building, his background lacks professional experience with mainstream ML frameworks (TensorFlow, PyTorch) and container orchestration (Docker, Kubernetes)."
- **2.5 Flash:** "Sam possesses extensive software engineering experience with a strong recent focus on AI-assisted development, GenAI, and cloud platforms, making him a strong candidate for the AI Platform team. He would need to demonstrate or acquire experience with containerization technologies like Docker and Kubernetes."

2.5 Flash's Technical Skills rationale also credited "his use of Vertex AI implies familiarity" with ML frameworks, a softer reading than the résumé supports. 3.5 Flash-Lite stated the gap plainly.

## Résumé generation

### Production prompt

| | 3.5 Flash-Lite | 2.5 Flash | 3.8 Flash |
|---|---|---|---|
| Unsupported claims | none in 3 of 3 | "CI/CD (Continuous Integration)" in 1 of 2 | none in 2 of 2 |
| Words (`countResumeWords`; target 600 to 900) | 492, 565, 517 | 631, 642 | 586, 611 |
| Jobs listed | 5 | 5 | 6 |
| Output tokens | 1,386 to 1,478 | 3,543 to 4,460 | 3,911 to 3,940 |
| Response time | 7.5 to 8.6 s | 26 to 29 s | 34 to 36 s |
| Cost per call | about $0.0065 | about $0.013 | about $0.022; about $0.044 from Jan 1, 2027 |

Costs use each model's own price; thinking tokens are billed as output.

Summaries, one run each:

- **3.5 Flash-Lite:** "Senior Software Engineer and Chief Consulting Engineer with extensive expertise in full-stack development, Python, TypeScript, and AI-assisted software systems. Proven track record of designing scalable test automation frameworks, data visualization pipelines, and cloud-integrated solutions. Expert in leveraging generative AI tools and cloud platforms to build robust, production-ready applications."
- **2.5 Flash:** "Senior Software Engineer with 4+ years of dedicated AI-assisted software development and 8+ years of Python expertise, specializing in building robust systems and integrating advanced AI capabilities. Proven ability to leverage Google Cloud Platform (Vertex AI, Firestore) and Large Language Models (LLMs) to design and implement innovative solutions, with a strong professional vision for applying Machine Learning to fault isolation and prognostics."
- **3.8 Flash:** "Versatile Software Engineer with 8+ years of Python and 4+ years of TypeScript experience developing AI-driven applications, scalable cloud-integrated pipelines, and robust testing frameworks. Proven track record deploying Google Cloud platforms (Vertex AI, Firestore), engineering data workflows with numpy and pandas, and mentoring junior engineers across high-reliability systems."

2.5 Flash and 3.8 Flash put years of experience in the summary; 3.5 Flash-Lite's is more generic. The skill lists are close: all three name Python, TypeScript, C, C++, Rust, GCP, Vertex AI, Firestore, Firebase, Vitest and Playwright. The bullets for the current SAK Consulting role cover the same projects (samkirk.com, Hire Me tools, Photo Fun, Tensor Logic) on all three models.

### Test-script prompt

This prompt is weaker than production's ("Only include facts from the resume context" with no explicit ban on adding skills from the posting).

| | 3.5 Flash-Lite | 2.5 Flash | 3.8 Flash |
|---|---|---|---|
| Unsupported claims | 3 of 3: "Docker/Containerization equivalents", "Docker/Containerization concepts", "Docker/Container ecosystem equivalents"; "CI/CD" in 2; "containerized or emulated environments" in a summary | 1 of 3: "Scalable ML Pipelines", "Scalable Architectures", and a Rust backend "aligning with distributed systems principles" | 0 of 3 |

The posting asks for Docker and Kubernetes. Under this prompt, 3.5 Flash-Lite pads the skills list toward the posting's wording; under production's prompt it doesn't. This test belongs in the follow-ups: give `e2e-real-llm.ts` production's system prompt, or make it call `buildResumeGenerationPrompt`.

## Interview chat

Old: 2.5 Flash, Sept 2, 2026 (`git show main:web/test-fixtures/interview-chat/e2e-real-llm-transcript.md`). New: 3.5 Flash-Lite at MINIMAL thinking and a 3,072-token cap, today (the fixture as now committed). Same system prompt and questions.

**Q1: What programming languages do you know?**

| 2.5 Flash (old) | 3.5 Flash-Lite (new) |
|---|---|
| C (15+ years, TRW/Vidar 1980 through AOptix), Python (8+, LTX-Credence 2012 on), TypeScript (4+), Rust (1+); then C++, 68K/8080 assembly, Perl; Linux/Unix since 1980. 1,327 chars. | C (15+ years; Sun, Teradyne, ESS, Media Vision, AOptix; POST and firmware), Python (8+; numpy, pandas, matplotlib), TypeScript (4+), Rust (1+, Tensor Logic on Axum and Shuttle.rs), assembly (MC68020/68K, 8080, MC56001 DSP, Z8000), C++ (LTX-Credence timing calibration); then Perl, shell, Scilab, MacPascal. 1,699 chars. |

**Q2: Tell me about your most recent role.**

| 2.5 Flash (old) | 3.5 Flash-Lite (new) |
|---|---|
| Chief Consulting Engineer at Samuel A. Kirk Consulting since March 2022; AI-assisted development; TypeScript, React, Next.js, Rust; "ChatBot Boss"; samkirk.com, Hire Me tools, Photo Fun. 1,310 chars, in prose. | Same role and date; same focus; names the three Hire Me tools, Tensor Logic (TypeScript/Vite, Rust/Axum, Shuttle.rs) and Photo Fun (Gemini, React, Firebase) as a bulleted list. 1,384 chars. |

Both are accurate and first-person. The new answers are a little more specific. No answer in either run was cut off.

## Thinking level for the interview

The interview was first set to LOW. The first real E2E run passed with Q1 cut off mid-sentence ("My core language for writing system diagnostics"): the script never read `finishReason`, and it used its own 1,024-token cap. A measurement through the production code path:

| Level | Cap | "What programming languages do you know?" | "Walk me through Sam's entire career history." |
|---|---|---|---|
| MINIMAL | 1,024 | STOP, 354 billed tokens | MAX_TOKENS |
| MINIMAL | 3,072 (production) | STOP, 360 | STOP, 1,352 billed, 5,321 chars |
| LOW | 1,024 | MAX_TOKENS | MAX_TOKENS |
| LOW | 3,072 (production) | STOP, 998 | STOP, 1,798 billed, 2,302 chars |

LOW spends 600 to 950 tokens thinking per turn, costs more, and shortened the broad answer, so the interview now runs at MINIMAL (commits `27f21de`, `00259d5`). The E2E script now sends production's settings and fails on any `MAX_TOKENS` finish. 3.8 Flash doesn't offer MINIMAL; see [below](#if-sam-prefers-38-flash).

## Test results

Run Oct 28, 2026 on branch `gemini-3.5-flash-lite`:

| Check | Result |
|---|---|
| `npm test` | 55 files, **1,457 passed** |
| `npm run smoke:gcp -- --section=10` | 1/1 passed: Location global, model gemini-3.5-flash-lite, JSON parsed, spend recorded $0.000021 |
| `npm run test:e2e:real` | All three tools passed; every response `finishReason=STOP`, thinking 0 (fit 458 visible tokens, résumé 1,486, interview 392 and 291) |
| `grep -r gemini-2.5-flash web/src web/scripts` | no matches |
| Production library, real model | `generateContent` and `generateContentWithHistory` both returned STOP after the review refactor |

## If Sam prefers 3.8 Flash

It is the same code, plus three changes. Without them, an env-only switch breaks the interview and the spend cap:

1. `INTERVIEW_THINKING_LEVEL` in `web/src/lib/interview-chat.ts` → `"LOW"`, since 3.8 Flash has no MINIMAL (every interview turn would get a 400). Re-measure against the 3,072 cap.
2. `COST_PER_1K_INPUT_TOKENS_USD` / `COST_PER_1K_OUTPUT_TOKENS_USD` in `web/src/lib/spend-cap.ts` → `0.0015` / `0.0075` (the Jan 1, 2027 price), or the $20 cap under-counts five-fold.
3. `VERTEX_AI_MODEL=gemini-3.8-flash` in `web/.env.local` and Vercel; location stays `global`.

## Raw outputs

[`docs/gemini-side-by-side-2026-10-28-raw/`](gemini-side-by-side-2026-10-28-raw/): every fit and résumé JSON from these runs (`lite-*` = 3.5 Flash-Lite, `old-*` = 2.5 Flash, `f38-*` = 3.8 Flash), the passing real-LLM E2E log, and the thinking-level diagnostic script.

## Request (verbatim)

Sam, Oct 28, 2026, approving the migration (relayed by the session that started this one): "Start it now"

Task as given to this session by that session:

> Carry out steps A–E of `docs/gemini-migration-plan-2026-10-28.md` (read it first; it is the plan of record, commit f9bac9c). Move the Hire Me tools from `gemini-2.5-flash` in `us-central1` to `gemini-3.5-flash-lite` in location `global`. […] E. Run the full `npm test` (about 1,232 tests), `npm run smoke:gcp -- --section=10`, and `npm run test:e2e:real`. Then write a side-by-side of new and old outputs for fit, résumé and interview, using the old outputs in `web/test-fixtures/`, as a file in `docs/` for Sam to review. […] If 3.5 Flash-Lite's outputs are clearly worse, say so in the side-by-side and recommend `gemini-3.8-flash` (same code, same `global` location; spend-cap prices $1.50 / $7.50 from Jan 1, 2027). Don't switch without Sam's say.
