# docs/ — Project Documentation

This folder contains all planning, specification, and reference documents for **samkirk.com v3**, a personal website showcasing Sam Kirk's genAI capabilities. The project follows the **Dylan Davis 50+ method** — a three-document system (Specification, Blueprint, TODO) that structures AI-assisted development from idea through implementation.

The documents accumulated over roughly two weeks of intensive development (Jan 30 -- Feb 13, 2026), beginning with a hand-written proposal and evolving through multiple Dylan Davis document sets as the project grew in scope. What follows is a guided tour through the folder, grouped by purpose and presented in roughly chronological order.

---

## Table of Contents

- [1. The Starting Point](#1-the-starting-point)
  - [Proposal.md](#proposalmd)
  - [Dylan-Davis-50plus-method.md](#dylan-davis-50plus-methodmd)
- [2. V1 Core Trilogy — Spec, Blueprint, TODO](#2-v1-core-trilogy--spec-blueprint-todo)
  - [SPECIFICATION.md](#specificationmd)
  - [BLUEPRINT.md](#blueprintmd)
  - [TODO.md](#todomd)
- [3. GCP Infrastructure Guides](#3-gcp-infrastructure-guides)
  - [GCP-SETUP.md](#gcp-setupmd)
  - [GCP-DEPLOY.md](#gcp-deploymd)
- [4. Test Results — The V1 Audit Trail](#4-test-results--the-v1-audit-trail)
  - [TEST-RESULTS.md](#test-resultsmd)
- [5. Tooling & Workflow Integration](#5-tooling--workflow-integration)
  - [Claude-Setup.md](#claude-setupmd)
  - [Prompts.md](#promptsmd)
  - [Matts-integration-with-Dylan-plan-samkirk-v3.md](#matts-integration-with-dylan-plan-samkirk-v3md)
  - [do-work-review-plan.md](#do-work-review-planmd)
- [6. V2 Visual Upgrade Trilogy](#6-v2-visual-upgrade-trilogy)
  - [v2-upgrade-SPECIFICATION.md](#v2-upgrade-specificationmd)
  - [v2-upgrade-BLUEPRINT.md](#v2-upgrade-blueprintmd)
  - [v2-upgrade-TODO.md](#v2-upgrade-todomd)
- [7. Master Test Suite Trilogy & Satellites](#7-master-test-suite-trilogy--satellites)
  - [master-test-plan.md](#master-test-planmd)
  - [master-test-SPECIFICATION.md](#master-test-specificationmd)
  - [master-test-BLUEPRINT.md](#master-test-blueprintmd)
  - [master-test-TODO.md](#master-test-todomd)
  - [master-test-START-DEV.md](#master-test-start-devmd)
  - [test-catalog.md](#test-catalogmd)
  - [feature-test-matrix.md](#feature-test-matrixmd)
  - [verification-registry.md](#verification-registrymd)
- [8. Test Results Viewer](#8-test-results-viewer)
  - [test-results-BLUEPRINT.md](#test-results-blueprintmd)
  - [test-results-TODO.md](#test-results-todomd)
- [9. Hire-Me Tools Documentation](#9-hire-me-tools-documentation)
  - [hire-me-tests.md](#hire-me-testsmd)
  - [hire-me-ux-fix-plan.md](#hire-me-ux-fix-planmd)
  - [online-test-cases.md](#online-test-casesmd)
- [10. Miscellaneous](#10-miscellaneous)
  - [cursor-markdown-preview-issue.md](#cursor-markdown-preview-issuemd)

---

## 1. The Starting Point

These two documents predate any code. They were the first files committed on **January 30, 2026**, and everything else in this folder grows from them.

### [Proposal.md](Proposal.md)

The original idea document, written by Sam in his own voice. It describes the need for a personal website at samkirk.com that showcases genAI talent through three chatbot tools ("How Do I Fit?", "Get a Custom Resume", "Interview Me Now"), alongside static pages and a weekly Dance Menu. The proposal also lays out cost-control and security concerns that shaped later architectural decisions — notably the $20/month spend cap and the move to GCP for its billing kill-switch capabilities.

The proposal references prior work (samkirk.com-v2, photo-fun5, JobHunterAI) and establishes the project's scope and constraints before any AI-led specification interview begins.

### [Dylan-Davis-50plus-method.md](Dylan-Davis-50plus-method.md)

The methodological backbone of the entire project. This is a detailed write-up of Dylan Davis's three-document system for AI-assisted development, adapted and extended for this project with practical additions:

- The **Specification → Blueprint → TODO** pipeline with exact prompts for each phase
- **Model selection heuristics** (which AI model to use for which task type)
- **Cursor slash commands** (`/create-spec`, `/create-blueprint`, `/start-step`, etc.)
- **Global git workflow commands** (local commit + clean squash-push)
- An **error handling and lesson embedding** protocol
- A comprehensive **Phase 0 through Phase 6 meta-checklist** tracking the setup and execution of the methodology itself

At 1,264 lines, this is the longest document in the folder. It was initially created as a separate `Setup.md` and then merged into the methodology file on Feb 2 to keep everything in one place.

---

## 2. V1 Core Trilogy — Spec, Blueprint, TODO

The heart of the Dylan Davis method. These three files were generated through the methodology's structured process (specification interview, then blueprint generation, then TODO extraction) and drove the entire V1 implementation from **February 2--4, 2026**.

### [SPECIFICATION.md](SPECIFICATION.md)

**What we're building.** Produced through the AI-led specification interview described in the methodology. Defines the full V1 scope: three LLM-powered tools (Fit, Resume, Interview), static content pages, admin experience (Google OAuth, resume/dance-menu upload), abuse prevention (reCAPTCHA, rate limiting, spend cap), data storage (Firestore + GCS), and acceptance criteria. The spec deliberately constrains scope — no fine-tuning, no SMS alerts, no `.docx`/`.pdf` generation in V1.

First committed Feb 2 (`fe7f87c`).

### [BLUEPRINT.md](BLUEPRINT.md)

**How to build it.** The largest technical document (860 lines), containing the full implementation plan organized into 11 phases (Phase 0 through Phase 10), each broken into numbered steps with goals, acceptance criteria, test plans, and copy-paste-ready prompts for a code-generation LLM. The blueprint also defines the system architecture (route map, Firestore collections, GCS object layout), the RAG strategy for the master resume, and the testing approach.

Generated from the specification using Claude Opus 4.5, committed Feb 2 (`15a2bb9`).

### [TODO.md](TODO.md)

**Where are we now.** The implementation checklist extracted from the blueprint — 660 lines of checkbox items organized by phase and step, each annotated with a recommended model label (`[Codex/Opus]`, `[Opus 4.5]`, `[Gemini 3 Pro]`, `[Sonnet 4]`). Every checkbox in this file is now checked off, representing the completed V1 implementation. The TODO includes detailed test evidence notes linking to specific test counts, smoke test sections, and `TEST-RESULTS.md` entries.

First committed Feb 2 (`ce95896`), progressively checked off through Feb 4.

---

## 3. GCP Infrastructure Guides

These operational guides were created alongside the implementation as each GCP service was set up and configured.

### [GCP-SETUP.md](GCP-SETUP.md)

A step-by-step guide (1,015 lines) for setting up all GCP resources: project creation, Firestore database, Cloud Storage buckets, Application Default Credentials, environment variables, Google OAuth, and reCAPTCHA v2. Organized as both a setup checklist and detailed instructions with execution evidence sections documenting what was actually done and when. Cross-linked with `TODO.md` via backlinks at each step.

Created during Phase 2 implementation (Feb 2), extended through Phase 5.

### [GCP-DEPLOY.md](GCP-DEPLOY.md)

The Cloud Run deployment checklist (458 lines). Covers infrastructure files (Dockerfile, cloudbuild.yaml, health check), Artifact Registry, service account IAM roles, Secret Manager configuration, and the deployment itself. Partially completed — the code-side deployment infrastructure is done but the actual cloud deployment steps remain unchecked.

Created Feb 4 when the deployment infrastructure was implemented (`ee1995f`, `b83947b`).

---

## 4. Test Results — The V1 Audit Trail

### [TEST-RESULTS.md](TEST-RESULTS.md)

The original test evidence document (2,001 lines), recording results as each implementation step was completed. Contains GCP smoke test results (13 sections covering Cloud Storage, Firestore, sessions, resume upload/chunking, dance menu, submissions, spend cap, job ingestion, Vertex AI, resume generation, interview chat, and retention cleanup), unit test breakdowns by module, E2E test results (Playwright), and real-LLM E2E results. Each entry links back to the corresponding `TODO.md` step.

Started Feb 3 (`6421705`), updated through Feb 4 as the final E2E tests were written.

---

## 5. Tooling & Workflow Integration

These documents track the project's evolving relationship with its development tools — from Cursor IDE to Claude Code, and from manual step-by-step execution to autonomous queue processing.

### [Claude-Setup.md](Claude-Setup.md)

Created on **February 4** (`ec6e011`) when Claude Code was integrated alongside Cursor IDE. Documents the `.claude/` directory structure (skills, rules, quickstart, compatibility mapping), the plugin optimization that reduced context window usage by 81% (from 29,713 to 5,686 lines by replacing the full plugin marketplace with a lean local selection), and the dual-tool workflow showing how Cursor slash commands and Claude Code natural language map to the same underlying methodology.

### [Prompts.md](Prompts.md)

A compact reference (87 lines) of reusable prompts for common development tasks: fixing lint/type errors, running test suites, and architectural review. Originally `Prompts.txt`, renamed to `.md` on Feb 6 (`e094f73`).

### [Matts-integration-with-Dylan-plan-samkirk-v3.md](Matts-integration-with-Dylan-plan-samkirk-v3.md)

The integration plan for Matt Maher's **do-work** autonomous processing system with the existing Dylan Davis methodology. Created on **February 5** (`c7f6809`), this document bridges the two approaches: Dylan Davis TODO steps get ingested into do-work REQ files via an `/ingest-todo` skill, processed autonomously, then synced back to TODO checkboxes via `/sync-todo`. The plan describes the low-disruption installation, the bridge skill design, CLAUDE.md updates, and the expected workflow for both planned work (spec-driven) and ad-hoc work (direct queue entries).

### [do-work-review-plan.md](do-work-review-plan.md)

A thorough review (222 lines) of all do-work action files, bridge skills, and CLAUDE.md configuration, conducted on **February 12** (`6a59f17`). Identifies 15 issues across three tiers: Tier 1 (will cause incorrect agent behavior), Tier 2 (causes confusion or wasted work), and Tier 3 (cosmetic or documentation gaps). Each issue includes the problem description, affected files with line numbers, and a specific fix.

---

## 6. V2 Visual Upgrade Trilogy

After V1 was functionally complete, a second Dylan Davis document set was created to plan a visual overhaul. These three files follow the exact same Specification → Blueprint → TODO pattern, but with a `v2-upgrade-` prefix to distinguish them from the core trilogy.

### [v2-upgrade-SPECIFICATION.md](v2-upgrade-SPECIFICATION.md)

Specifies the visual upgrade goals: making the site feel more personal and human (profile photo, location identity, warm color palette), creating a single-scroll home page experience, and adding a build-date footer. Explicitly scoped to not change core tool functionality or backend architecture.

### [v2-upgrade-BLUEPRINT.md](v2-upgrade-BLUEPRINT.md)

The implementation plan for the visual upgrade, organized into 6 phases: Foundation (color palette + assets), Header & Footer, Home Page Redesign, Tool Pages, Exploration Pages, and Polish. Each step includes prompts and test plans, following the same structure as the V1 blueprint.

### [v2-upgrade-TODO.md](v2-upgrade-TODO.md)

The visual upgrade checklist. All items are checked off — this upgrade cycle was completed via the do-work autonomous queue, with checkboxes synced from archived REQs on Feb 5 (`d7c728e`).

All three files were created on **February 4** (`7454ca3`).

---

## 7. Master Test Suite Trilogy & Satellites

The testing infrastructure grew organically during V1 development, but by **February 5** it became clear that a unified test system was needed. This spawned a third Dylan Davis document set (prefix: `master-test-`) along with several satellite documents.

### [master-test-plan.md](master-test-plan.md)

The **original** master test plan, written on Feb 5 (`6c62309`) as a monolithic document. It was subsequently **restructured into the Dylan Davis three-document set** on Feb 6 (`c20643b`) and now carries a "Superseded" banner at the top. Kept for historical reference — it contains the original thinking about traceability models (DAG vs tree), tests vs verifications, test results archiving, and pre-existing failure triage.

### [master-test-SPECIFICATION.md](master-test-SPECIFICATION.md)

The formal specification for the master test suite, extracted from the original plan. Defines five deliverables: a single-entry-point test runner, a traceability model, a test results archive, a triage process, and documentation artifacts. Establishes the methodology alignment with both Dylan Davis ("real data first") and Matt Maher/do-work ("tests as traceability evidence").

### [master-test-BLUEPRINT.md](master-test-BLUEPRINT.md)

Step-by-step implementation plan for the test suite, organized into 4 phases: Skip Guards (making existing tests skip cleanly without GCP), Master Test Runner (`test-all.ts`), Documentation Artifacts (catalog, matrix, registry), and Test Results Archive. Each step specifies exact files to modify and the expected test counts.

### [master-test-TODO.md](master-test-TODO.md)

The implementation checklist for the master test suite. Phases 1--3 are checked off; Phase 4 remains in progress.

### [master-test-START-DEV.md](master-test-START-DEV.md)

A compact quick-reference card (35 lines) showing how to use do-work with the master-test TODO: ingest, verify, process, sync, and manual fallback commands.

All four Dylan Davis documents plus the quick-reference were created on **February 6** (`c20643b`).

### [test-catalog.md](test-catalog.md)

The authoritative catalog of all automated tests (749 lines). Each entry represents one top-level `describe` block or test group with a stable ID (TEST-001 through TEST-682), file location, test count, feature coverage, and a description. Created autonomously by do-work as REQ-028 on Feb 6 (`65c5979`), updated Feb 12 with 13 new component/page entries (`8ba9e03`).

### [feature-test-matrix.md](feature-test-matrix.md)

Maps every feature from SPECIFICATION.md (sections 7--15) to its automated tests and/or manual verifications. Identifies coverage gaps explicitly — notably in admin functions (section 9), rate limiting E2E (section 10.2), and UI-level spend-cap messaging (section 13). Created as REQ-029 on Feb 6 (`309ed25`).

### [verification-registry.md](verification-registry.md)

The registry of manual verification procedures that cannot be fully automated: visual resume PDF inspection (VER-001), OAuth flow in a fresh browser (VER-002), and Cloud Run deployment health (VER-003). Each entry includes a structured procedure, expected inputs/outputs, and cross-references to the test catalog and feature matrix. Created as REQ-030 on Feb 6 (`b25534e`).

These three satellite documents (`test-catalog`, `feature-test-matrix`, `verification-registry`) form the traceability layer defined in the master test specification, connecting features to tests to verifications in a many-to-many DAG structure.

---

## 8. Test Results Viewer

A small follow-on document set for the `npm run test:results` convenience command, planned on **February 13**.

### [test-results-BLUEPRINT.md](test-results-BLUEPRINT.md)

Implementation plan for a terminal-based test results viewer script (`web/scripts/test-results.ts`) that displays the latest test run summary, lists historical runs, and tracks fixture file modifications across test suites.

### [test-results-TODO.md](test-results-TODO.md)

The implementation checklist for the test results viewer. Both phases (Core Viewer Script and Fixture Mtime Tracking) are checked off, with checkboxes synced from archived do-work REQs.

Both files were created on **February 13** (`f721e72`).

---

## 9. Hire-Me Tools Documentation

These documents focus specifically on the three LLM-powered "hire me" tools — the core differentiating feature of the site.

### [hire-me-tests.md](hire-me-tests.md)

A quick-reference guide (455 lines) listing every test covering the hire-me tools, ordered from smallest to largest scope: unit tests (1,173 individual assertions across 24 test modules), component/page tests (59 tests), E2E browser tests (Playwright), GCP smoke tests, and real-LLM E2E tests. Each entry links to the corresponding test-catalog ID and shows the test count. Also includes an input/output modality coverage matrix showing which input modes (paste, URL, file) are tested at which level.

### [hire-me-ux-fix-plan.md](hire-me-ux-fix-plan.md)

A focused fix plan (37 lines) addressing two UX pain points discovered during testing: captcha being re-required when navigating between tools (fix: check `captchaPassedAt` from the session), and job descriptions needing re-entry per tool (fix: share via `sessionStorage`). Both fixes were implemented on Feb 12 (`37d6c94`).

### [online-test-cases.md](online-test-cases.md)

A living document of real job postings that Sam Kirk may qualify for, used as test inputs for the hire-me tools. Contains specific LinkedIn and Indeed job URLs with notes on why each fits Sam's profile, plus expected outcomes (fit scores, key strengths, key gaps) for verification purposes.

---

## 10. Miscellaneous

### [cursor-markdown-preview-issue.md](cursor-markdown-preview-issue.md)

A bug report (139 lines) documenting a Cursor IDE issue where markdown preview fails for `Proposal.md` with a "cannot be found" error. Includes log analysis tracing the failure to the custom editor extension host's `getDocument` call. Created Feb 6 (`d541943`).

---

## Document Sets at a Glance

The Dylan Davis three-document pattern appears three times in this folder, plus one superseded monolith:

| Set | Spec | Blueprint | TODO | Status |
|-----|------|-----------|------|--------|
| **V1 Core** | [SPECIFICATION.md](SPECIFICATION.md) | [BLUEPRINT.md](BLUEPRINT.md) | [TODO.md](TODO.md) | Complete |
| **V2 Visual Upgrade** | [v2-upgrade-SPECIFICATION.md](v2-upgrade-SPECIFICATION.md) | [v2-upgrade-BLUEPRINT.md](v2-upgrade-BLUEPRINT.md) | [v2-upgrade-TODO.md](v2-upgrade-TODO.md) | Complete |
| **Master Test Suite** | [master-test-SPECIFICATION.md](master-test-SPECIFICATION.md) | [master-test-BLUEPRINT.md](master-test-BLUEPRINT.md) | [master-test-TODO.md](master-test-TODO.md) | In progress |
| **Test Results Viewer** | *(no spec)* | [test-results-BLUEPRINT.md](test-results-BLUEPRINT.md) | [test-results-TODO.md](test-results-TODO.md) | Complete |

The original [master-test-plan.md](master-test-plan.md) predates its restructuring into the three-document format and is retained as historical reference.

---

## Timeline

| Date | Documents Created | Context |
|------|-------------------|---------|
| Jan 30 | [Proposal.md](Proposal.md), [Dylan-Davis-50plus-method.md](Dylan-Davis-50plus-method.md) | Project inception, methodology setup |
| Feb 2 | [SPECIFICATION.md](SPECIFICATION.md), [BLUEPRINT.md](BLUEPRINT.md), [TODO.md](TODO.md), [GCP-SETUP.md](GCP-SETUP.md) | V1 planning complete, implementation begins |
| Feb 3 | [TEST-RESULTS.md](TEST-RESULTS.md) | Test evidence recorded as features land |
| Feb 4 | [Claude-Setup.md](Claude-Setup.md), [GCP-DEPLOY.md](GCP-DEPLOY.md), [v2-upgrade-\*](v2-upgrade-SPECIFICATION.md) (x3) | V1 done, Claude Code integrated, visual upgrade planned |
| Feb 5 | [master-test-plan.md](master-test-plan.md), [Matts-integration-with-Dylan-plan-samkirk-v3.md](Matts-integration-with-Dylan-plan-samkirk-v3.md) | Testing formalized, do-work integrated |
| Feb 6 | [master-test-SPECIFICATION.md](master-test-SPECIFICATION.md), [master-test-BLUEPRINT.md](master-test-BLUEPRINT.md), [master-test-TODO.md](master-test-TODO.md), [master-test-START-DEV.md](master-test-START-DEV.md), [test-catalog.md](test-catalog.md), [feature-test-matrix.md](feature-test-matrix.md), [verification-registry.md](verification-registry.md), [Prompts.md](Prompts.md), [cursor-markdown-preview-issue.md](cursor-markdown-preview-issue.md) | Master test suite restructured, traceability artifacts created |
| Feb 12 | [do-work-review-plan.md](do-work-review-plan.md), [hire-me-ux-fix-plan.md](hire-me-ux-fix-plan.md), [hire-me-tests.md](hire-me-tests.md) | Automation review, UX fixes, test documentation |
| Feb 13 | [test-results-BLUEPRINT.md](test-results-BLUEPRINT.md), [test-results-TODO.md](test-results-TODO.md), [online-test-cases.md](online-test-cases.md) | Test results viewer, real job test cases |
