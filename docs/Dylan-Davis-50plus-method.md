# Dylan Davis: The Three-Document System for AI App Development

> "I've built over 50 apps with AI, and every single one starts the same way with three documents, not code, not tutorials, just three files that tell AI exactly what to build and how to build it."

**Source:** [I've Built 50+ Apps with AI. I Start Every Single One the Same Way.](https://youtu.be/99FI5uZJ8tU?si=wxjnXQX-o7WaWrsI)  
**Speaker:** Dylan Davis, Gradient Labs  
**Duration:** ~16 minutes

---

## Table of Contents

1. [Overview of The 50+ / Three-Documents Method](#overview-of-the-50--three-documents-method)
2. [The Specification Document](#1-the-specification-document)
   - [The Specification Prompt](#the-specification-prompt)
   - [Providing Reference Materials](#providing-reference-materials)
   - [Keep the Scope Tight](#keep-the-scope-tight)
3. [The Blueprint Document](#2-the-blueprint-document)
   - [The Blueprint Prompt](#the-blueprint-prompt)
4. [The To-Dos Document](#3-the-to-dos-document)
   - [The To-Do Prompt](#the-to-do-prompt)
   - [Model Labels in TODO.md](#model-labels-in-todomd)
   - [Modus Operandi in Cursor](#modus-operandi-in-cursor) *(project slash commands defined here)*
5. [Tools & Models](#tools--models)
6. [Error Handling & Embedding Lessons](#error-handling--embedding-lessons)
   - [The Embed Lesson Prompt](#the-embed-lesson-prompt)
7. [Developer Setup (Cursor/Claude Code)](#developer-setup-cursorclaude-code)
   - [Project Initialization](#project-initialization)
   - [MCP Selection](#mcp-selection)
   - [LSP and Compiler Setup](#lsp-and-compiler-setup)
   - [Git Workflow Commands](#git-workflow-commands) *(global slash commands defined here)*
8. [Documentation Strategy](#documentation-strategy)
9. [What Belongs in Rules](#what-belongs-in-rules)
10. [The Complete Workflow](#the-complete-workflow)
    - [Checking It Off](#checking-it-off)

---

## Overview of The 50+ / Three-Documents Method

**Version:** January 29, 2026

| Document | Purpose | Answers |
|----------|---------|---------|
| **Spec** | Defines WHAT you're building | "What are we making?" |
| **Blueprint** | Defines HOW you're building it | "How do we build it?" |
| **To-Dos** | Acts as a roadmap & memory extension | "Where are we now?" |

**Why this structure works:**
- **Spec** is the foundation—all other documents grow from it
- **Blueprint** breaks complexity into manageable chunks
- **To-Dos** solves AI's memory problem as conversations grow
- Together, they create a self-reinforcing system that keeps AI on track

---

## 1. The Specification Document

The specification is the seed of everything else. It's created through a structured AI-led interview rather than you writing it yourself.

### How the Interview Works

1. You provide a specific prompt to the AI
2. The AI asks you questions **one at a time** (crucial—not multiple questions at once)
3. You answer each question
4. Go back and forth approximately 15-20 times
5. At the end, the AI produces a detailed specification document

### The Specification Prompt

Copy this prompt and paste it into Cursor, then add your app idea description:

```
Ask me one question at a time so we can develop a thorough, step-by-step spec for this idea. Each question should build on my previous answers, and our end goal is to have a detailed specification I can hand off to a developer. Let's do this iteratively and dig into every relevant detail. Remember, only one question at a time.

At any point during our conversation, I may provide prior work, examples, API documentation, or other reference materials. When I do, incorporate them into your understanding and adjust your questions accordingly.

When done at the end of our dialog, please write out the specification as @docs/SPECIFICATION.md.

Here's the idea: [describe your idea]
```

> **Important:** Replace `[describe your idea]` with YOUR OWN app idea description. Describe what you want to build in your own words. Use voice dictation for richer, more natural context.

### Providing Reference Materials

You can provide prior work, examples, or reference documents at any point during the specification interview:

**Provide early** if you want the AI to have full context from the start:
- Existing codebase you're extending or replacing
- API documentation the project must integrate with
- Design mockups or wireframes
- Similar apps you want to emulate

**Provide later** if you want the AI's unbiased perspective first:
- Wait for the AI to ask its initial questions
- See what the AI suggests before anchoring it to your examples
- Then provide references to refine or validate

Either approach works—the prompt tells the AI to accept materials at any stage.

### Keep the Scope Tight

> **The AI will get excited. Don't let it.**

During the interview, the AI will suggest ambitious features and "enterprise-ready" solutions. Your job is to push back and keep the scope tight. Aim for:

- ~~Feature-packed enterprise app~~
- ~~Robust multi-feature product~~
- **V1 — Simple & Focused**

Keep saying "no" to extra features. Focus on the very basic version that solves your specific problem. This is often referred to as an MVP, the Minimum Viable Product. You would be wise to do that first and add features later, especially if you're new to genAI for software development. (IMHO)

### Practical Tips for the Interview

- **Use dictation:** Speak to the AI instead of typing for richer context
- **Answer confidently:** If you don't know the answer, either ask AI for choices or have AI answer based on constraints
- **Tool:** Use ChatGPT specifically in Auto Mode (not thinking mode initially)
- **Timing:** Auto mode will take 10-15 minutes for the full interview

### Optional: Double-Check with a Smarter Model

After the interview, you can optionally validate your spec with:
- Claude Opus 4.5
- Gemini 3 Pro

---

## 2. The Blueprint Document

The blueprint is the "how" of building the product. It's the core component and provides detailed architecture for construction.

### Why Use a High-End Model?

Creating the blueprint requires a high-end AI model with extended reasoning and a long output window:

| Model | Notes |
|-------|-------|
| GPT-5.2 Thinking | Extended reasoning |
| Gemini 3 Pro | Advanced reasoning |
| **Claude Opus 4.5** | ✓ RECOMMENDED - Longest output, most detailed blueprints |

### The Blueprint Prompt

Reference your specification file at the top using Cursor's `@` convention, then paste the prompt:

```
@docs/SPECIFICATION.md

Draft a detailed, step-by-step blueprint for building this project. Then, once you have a solid plan, break it down into small, iterative chunks that build on each other. Look at these chunks and then go another round to break it into small steps.

Review the results and make sure that the steps are small enough to be implemented safely with strong testing, but big enough to move the project forward. Iterate until you feel that the steps are right sized for this project.

From here you should have the foundation to provide a series of prompts for a code-generation LLM that will implement each step in a test-driven manner. Make sure we're not using mock data, but real data when testing and real calls to APIs when relevant.

Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step.

Make sure and separate each prompt section. Use markdown. Each prompt should be tagged as text using code tags. The goal is to output prompts, but context is important as well.

When done, please write out the blueprint as @docs/BLUEPRINT.md.
```


### Blueprint Structure

The output is organized hierarchically:
- **Phases:** Major project sections (Setup, Core Logic, Integration, Polish)
- **Steps:** Individual implementation tasks within each phase
- **Embedded Prompts:** Ready-to-use AI instructions for each step
- **Testing Instructions:** How to validate each piece
  - In Cursor, the AI will automatically detect and fix errors it encounters

### Testing is Baked In

Testing is probably the most important thing for any AI to ensure it avoids and mitigates errors.

The workflow:
1. AI writes code for a small piece
2. AI runs tests on that code
3. If errors occur, AI self-corrects before you ask
4. Result: Fewer errors surface to you

> **Important:** Always use **real data and real API calls** in tests, not mock data. This prevents situations where tests pass but the app doesn't work in reality.

---

## 3. The To-Dos Document

The To-Dos acts like a roadmap and solves a critical problem: **AI memory decay.**

### The AI Memory Problem

As the AI works on your product over many messages, its memory starts to fade. It forgets what it did, what comes next, and can "go off the rails."

The To-Dos document grounds the AI in the macro picture, consistently bringing it back to the plan.

### The To-Do Prompt

Reference your blueprint file, then ask for a checklist:

```
@docs/BLUEPRINT.md

Can you make a TODO.md that I can use as a checklist? Be thorough. Please write it out as @docs/TODO.md.
```

The AI converts the blueprint into a detailed checklist with:
- Phase information
- Step information
- Checkbox format (`- [ ]`)

### Model Labels in TODO.md

The TODO.md contains implementation tasks from the Blueprint (not the meta-tasks of creating the three documents). The `/create-todo` command instructs the AI to annotate each implementation task with the recommended model:

```markdown
## Phase 1: Project Setup
- [ ] **[Codex/Opus]** 1.1 Initialize project structure and dependencies
- [ ] **[Codex/Opus]** 1.2 Set up database schema
- [ ] **[Codex/Opus]** 1.3 Configure environment and API keys

## Phase 2: Core Implementation
- [ ] **[Codex/Opus]** 2.1 Implement data models and types
- [ ] **[Opus 4.5]** 2.2 Build UI components
- [ ] **[Gemini 3 Pro]** 2.3 Test and debug integration

## Phase 3: Polish
- [ ] **[Sonnet 4]** 3.1 Fix minor bugs and edge cases
- [ ] **[Opus 4.5]** 3.2 Refine UI/UX details
```

**Model Selection Heuristics:**
| Task Type | Recommended Model | Rationale |
|-----------|-------------------|-----------|
| Specification interview | ChatGPT Auto Mode | Conversational, good at iterative Q&A |
| Blueprint/Architecture | Claude Opus 4.5 | Long output, detailed planning |
| UI/Frontend | Claude Opus 4.5 | Aesthetic sense, component design |
| Backend/Logic | Codex GPT-5.2 or Opus 4.5 | Strong at algorithms, APIs |
| Debugging/Testing | Gemini 3 Pro | Can interact with UI directly |
| Quick fixes | Sonnet 4 or fast model | Cost-effective for small changes |

### The Memory Refresh Workflow

After AI completes each step, you start a new conversation (to avoid context overflow). With the To-Dos:

1. New conversation starts with fresh context window
2. AI references the To-Dos document
3. AI checks which boxes are already marked complete
4. AI sees what's next and continues seamlessly
5. As it works, it checks off boxes

### Modus Operandi in Cursor

To codify the above in a procedure, just do the following:

**Starting a new step:**
1. Clear all chats (start fresh)
2. Use `/start-step 1.1`

**After completing a step:**
1. Verify all items in the current step are checked off in TODO.md
   - The last item of each step is labelled "TEST" — make sure this gets done, especially if UI testing with a browser is required
2. Clear all chats (start fresh again)
3. Use `/continue-step 1.2`

**Repeat** this pattern for each step: 1.3, 1.4, then 2.1, 2.2, etc.

**Slash Commands:** Create these in `.cursor/commands/`:

**`.cursor/commands/create-spec.md`:**
```markdown
---
description: Start the specification interview
---
@docs/Dylan-Davis-50plus-method.md

Ask me one question at a time so we can develop a thorough, step-by-step spec for this idea. Each question should build on my previous answers, and our end goal is to have a detailed specification I can hand off to a developer. Let's do this iteratively and dig into every relevant detail. Remember, only one question at a time.

At any point during our conversation, I may provide prior work, examples, API documentation, or other reference materials. When I do, incorporate them into your understanding and adjust your questions accordingly.

When done at the end of our dialog, please write out the specification as @docs/SPECIFICATION.md.

Here's the idea:
```

**`.cursor/commands/create-blueprint.md`:**
```markdown
---
description: Generate blueprint from specification
---
@docs/Dylan-Davis-50plus-method.md @docs/SPECIFICATION.md

Draft a detailed, step-by-step blueprint for building this project. Then, once you have a solid plan, break it down into small, iterative chunks that build on each other. Look at these chunks and then go another round to break it into small steps.

Review the results and make sure that the steps are small enough to be implemented safely with strong testing, but big enough to move the project forward. Iterate until you feel that the steps are right sized for this project.

From here you should have the foundation to provide a series of prompts for a code-generation LLM that will implement each step in a test-driven manner. Make sure we're not using mock data, but real data when testing and real calls to APIs when relevant.

Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step.

Make sure and separate each prompt section. Use markdown. Each prompt should be tagged as text using code tags. The goal is to output prompts, but context is important as well.

When done, please write out the blueprint as @docs/BLUEPRINT.md.
```

**`.cursor/commands/create-todo.md`:**
```markdown
---
description: Generate TODO checklist from blueprint
---
@docs/Dylan-Davis-50plus-method.md @docs/BLUEPRINT.md

Can you make a TODO.md that I can use as a checklist? Be thorough. Include model labels for each task using the Model Selection Heuristics from the methodology. Please write it out as @docs/TODO.md.
```

**`.cursor/commands/start-step.md`:**
```markdown
---
description: Start a new step from the TODO checklist
---
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Start with Step
```

**`.cursor/commands/continue-step.md`:**
```markdown
---
description: Continue to the next step in the TODO checklist
---
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Continue with Step
```

**Usage:** 
- `/create-spec [your idea]` — start specification interview
- `/create-blueprint` — generate blueprint from spec
- `/create-todo` — generate TODO checklist from blueprint
- `/start-step 1.1` or `/continue-step 8.4` — development steps

> **Why clear chats?** As conversations grow long, AI memory degrades. Starting fresh with the three documents gives AI full context without the "fog" of a long conversation history.

### Extended Memory Architecture

The three documents work together as an extended memory system:
- **Spec:** "Here's what we're building"
- **Blueprint:** "Here's the architectural plan"
- **To-Dos:** "Here's what we've done and what's next"

When you refresh the AI's memory in a new conversation, all three are provided together.

---

## Tools & Models

> "The process is always more important than the tool."

### Recommended Tool: Cursor

**Why Cursor?**
- Not the easiest, but best for serious builds
- Best UI/UX for this workflow
- Excellent for getting code generation running
- Integrates well with the three-document system

**Other options:**
- Replit Agent - Good for prototypes, not production-ready
- Google AI Studio - Good for prototypes, limited to Gemini

### Recommended Models (As of January 2026)

| Model | Best For | Notes |
|-------|----------|-------|
| **Codex (GPT-5.2)** | Daily driver, general code generation | One-shots problems. Gets it right first try. Can take entire phases at once. |
| **Claude Opus 4.5** | Frontend, UI/UX | Excellent aesthetic taste. Great for beautiful interfaces. |
| **Gemini 3 Pro** | Bug fixing, visual testing | Can interact with UI directly. Good at clicking buttons and collecting error data. |

> **#TBD:** There's a plugin for Codex in Cursor that allows use of Codex with GPT-5.2 even with Plus accounts on OpenAI.

### Working with Larger Chunks

With newer models, you can often give an entire phase at once:
- Copy the entire Phase from the blueprint
- Include the Spec, Blueprint, and To-Dos in context
- Include the rules file
- Wait 25-45 minutes for completion
- Often gets it right the first time

---

## Error Handling & Embedding Lessons

Errors will happen. Persistence and smart knowledge management is how you overcome them.

### The Knowledge Cutoff Problem

Most errors stem from AI knowledge cutoff dates:
- AI is trained and then frozen
- Anything after the training cutoff is unknown to the AI
- New APIs, new model versions, recent features—the AI doesn't know about them
- **Your job:** Provide current documentation to the AI
  - Simply ask the chatbot to search the web for current docs. Have it remember useful URLs (especially for MCPs), write out custom plans based on what it finds, or add lessons to Cursor Rules or CLAUDE.md

### The Error Resolution Workflow

1. **Error occurs** → AI runs tests and finds the problem
2. **You persist** → Ask AI to fix it (don't give up)
3. **AI self-corrects** → Usually fixes the issue
4. **Extract the lesson** → What did we learn?
5. **Embed for the future** → Store the fix so future AIs never make this mistake

### Embedding Lessons: The Rules File

Once you fix an error, add the lesson to your project's knowledge base:
- **Cursor:** `.cursor/rules` file
- **Claude Code:** `claude.md` file
- **Codex in Cursor:** `agents.md` file

### The Embed Lesson Prompt

```
We figured out how to fix this. Now I need you to update the claude.md file (or .cursor/rules or agents.md depending on the tool) with this lesson.

Write it briefly and information-dense. I want future AIs to see this and never make this mistake again.
```

> **Important:** Keep entries brief and information-dense because:
> - Every AI conversation includes this file in its context window
> - Large files consume token budget
> - Too much information can distract from the core task

### Making Lesson Embedding Automatic

You can configure Cursor to remind you (or automatically offer) to embed lessons when errors are fixed.

**Step 1: Create a rule file** at `.cursor/rules/error-lessons.mdc`:

```markdown
---
description: Embed lessons after fixing errors
globs: 
alwaysApply: true
---

# Error Resolution Protocol

When you fix an error or discover a workaround:
1. Fix the immediate problem
2. Ask: "Should I add this lesson to CLAUDE.md so future sessions avoid this mistake?"
3. If yes, write the lesson briefly and information-dense
```

**Step 2: Create a CLAUDE.md file** at your project root:

```markdown
# Project Lessons

## Protocol
When fixing errors caused by outdated knowledge or API changes, add the fix below.

## Lessons Learned
<!-- Lessons get added here -->
```

**How it works:**
- The rule in `.cursor/rules/` prompts the AI to suggest embedding lessons
- The `CLAUDE.md` file is where lessons get stored
- Both files are automatically loaded at the start of every Cursor session

This makes it semi-automatic — the AI will remind you and offer to do it, rather than requiring you to remember.

---

## Developer Setup (Cursor/Claude Code)

This section covers setup tasks to handle before starting the three-document workflow.

### Project Initialization

**Git Setup:**
```bash
git init
# Create appropriate .gitignore (see templates below)
git add .
git commit -m "Initial project scaffold"
```

**Language-Specific `.gitignore` Templates:**

<details>
<summary>TypeScript/JavaScript</summary>

```gitignore
node_modules/
dist/
build/
.next/
.env*
!.env.example
*.log
.DS_Store
coverage/
```
</details>

<details>
<summary>Rust</summary>

```gitignore
/target/
Cargo.lock
*.pdb
.env*
!.env.example
.DS_Store
```
</details>

<details>
<summary>Julia</summary>

```gitignore
.julia/
Manifest.toml
*.jl.cov
*.jl.mem
.env*
!.env.example
.DS_Store
```
</details>

<details>
<summary>General (Language-Agnostic)</summary>

```gitignore
.env*
!.env.example
.DS_Store
*.log
.vscode/
!.vscode/settings.json
.idea/
```
</details>

### MCP Selection

Model Context Protocol servers extend AI capabilities. Choose based on your project needs:

| MCP Server | Use Case | Safety | Install |
|------------|----------|--------|---------|
| `github-mcp` | Issue tracking, PR creation | Requires PAT with minimal scopes | `npx -y github-mcp@latest` |
| `cursor-browser-extension` | Frontend testing, visual validation | Safe (browser interaction) | Browser extension |
| `context7` | Documentation lookup | Safe (read-only) | `npx -y context7-mcp@latest` |
| `filesystem-mcp` | Advanced file operations | Caution—can modify outside workspace | `npx -y @anthropic/filesystem-mcp` |

**Recommended Minimum:** `github-mcp` + `cursor-browser-extension` for most web projects.

**Configuration** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "github-mcp@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### LSP and Compiler Setup

Proper LSP support enables real-time error detection, which is critical for AI-assisted development.

**TypeScript:**
```bash
npm init -y
npm install -D typescript @types/node
npx tsc --init
```
Cursor includes TypeScript support out of the box.

**Rust:**
```bash
# Install rustup (includes cargo, rustc)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install rust-analyzer extension in Cursor
# Cursor → Extensions → Search "rust-analyzer"
```

**Julia:**
```bash
# Install juliaup for version management
curl -fsSL https://install.julialang.org | sh

# Install Julia extension in Cursor
# Cursor → Extensions → Search "Julia"
```

### Git Workflow Commands

Create global slash commands for consistent git workflow. Place these in `~/.cursor/commands/`:

**`~/.cursor/commands/git-commit-local.md`:**
```markdown
---
description: Commit outstanding work to local repo
---
Review all staged and unstaged changes using git status and git diff. Stage appropriate files (exclude .env, credentials, and other secrets). Write a clear, descriptive commit message summarizing the work. Commit to the local repository only—do not push.
```

**`~/.cursor/commands/git-commit-push.md`:**
```markdown
---
description: Commit and push to remote
---
Review all staged and unstaged changes using git status and git diff. Stage appropriate files (exclude .env, credentials, and other secrets). Write a clear, descriptive commit message summarizing the work. Commit and push to the remote repository.
```

**Usage:** Type `/git-commit-local` or `/git-commit-push` in any project.

---

## Documentation Strategy

### When to Search the Web
- New API versions released after AI's training cutoff
- Framework migration guides (e.g., React 18 → 19)
- Security advisories and CVEs
- MCP installation instructions (these change frequently)

### When to Create Local Summaries
Store frequently-referenced patterns in `.cursor/rules/`:
- API authentication patterns for your project
- Project-specific conventions and naming
- Error resolutions (already covered in Error Handling section)

### Documentation MCPs
A coding-focused MCP like `context7` can fetch documentation on demand, often making separate documentation MCPs unnecessary. However, for specialized domains (e.g., specific cloud providers), dedicated documentation MCPs may be worthwhile.

**Recommendation:** Start with web search and `context7`. Add specialized MCPs only if you find yourself repeatedly providing the same documentation.

---

## What Belongs in Rules

### DO Include
- **Tech stack** (10-20 lines): Languages, frameworks, key dependencies
- **Conventions** (5-10 lines): Naming, file structure, patterns
- **Error resolutions** (brief): Root cause → fix, information-dense
- **API quirks**: Version-specific gotchas, workarounds
- **Testing requirements**: Real data policy, browser testing needs
- **Model preferences** (optional): Which model for which task type

### DO NOT Include
- Full copies of Spec/Blueprint/TODO—use `@` references instead
- Generic methodology explanations—link to this document
- Redundant information already in the three documents
- Verbose explanations—keep it information-dense

### Recommended Rule Structure (~50-100 lines)

```markdown
---
description: Project conventions and lessons
alwaysApply: true
---

# Project: [Name]

**Stack:** TypeScript, React 19, Rust backend, PostgreSQL

## Conventions
- Components in `src/components/`, one per file
- API routes in `src/api/`, named `[resource].ts`
- Use `zod` for all runtime validation

## Model Preferences
- Frontend/UI: Opus 4.5
- Backend logic: Codex or Opus
- Debugging: Gemini 3 Pro

## Lessons Learned
- [2026-01-15]: Gemini 3 Flash API changed from v2.5. Always specify `model: "gemini-3-flash"` explicitly.
- [2026-01-20]: React 19 useTransition requires Suspense boundary. Wrap async components.
```

**Key Insight from Experience:** A 50-100 line rules file is sufficient. The 253-line methodology dump in Jira-structure was overkill—summaries work better than full copies.

---

## Common Mistakes to Avoid

1. **Not keeping it simple** - Letting AI talk you into enterprise-grade complexity
2. **Skipping real data testing** - Using mock data means tests pass but real functionality fails
3. **Giving up on errors** - Errors are inevitable; persist and have AI fix them
4. **Not updating the rules file** - If you don't embed lessons, future AIs make the same mistakes
5. **Asking multiple questions at once** - Always require AI to ask one question at a time in the spec interview
6. **Using wrong models** - Each phase requires appropriate models

---

## The Complete Workflow

The checklist below is the **single active meta-process checklist** for this methodology. It tracks project setup, the three-document workflow (Spec → Blueprint → TODO), and the development loop.

**Model reminders:** Each phase below is annotated with the **recommended model** from the methodology. When starting or continuing a phase, the assistant should remind you which model to use for that phase.

**Checkbox meaning**
- `- [x]` done in *this* workspace (or done by us in this session)
- `- [ ]` not done yet / to do

**Owner tags**
- **[You]**: requires Sam to do an action (accounts, approvals, choosing stack, etc.)
- **[AI]**: work the assistant can do in Cursor once prerequisites are met

**Current workspace state (observed)**
- This methodology file exists in docs/ (e.g. docs/Dylan-Davis-50plus-method.md)
- `docs/Proposal.md` exists
- Git repository initialized (`.git/` exists)
- Project slash commands exist in `/.cursor/commands/`
- No `docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, or `docs/TODO.md` yet
- Workflow setup rule exists: `/.cursor/rules/workflow-setup.mdc` (guards against forgetting global git commands)

---

### Prerequisites (from “The Complete Workflow”)

- [x] **[You] Cursor IDE installed** (you're using Cursor right now)
- [x] **[You] ChatGPT access for the spec interview** (you're using GPT-5.2 in Cursor right now)
- [x] **[You] Verify access to Claude Opus 4.5 (needed for blueprint generation)**  
  Steps:
  - Confirm you can select **Claude Opus 4.5** in Cursor (or another tool you'll use for blueprint generation).
  - If not available, pick an alternative high-end reasoning model (document which) and use it consistently for `docs/BLUEPRINT.md`.
  - Evidence: You confirmed Opus 4.5 access.
- [x] **[You] App idea clearly in mind**  
  Steps:
  - Write a 3–10 sentence "idea blurb" (problem, user, core workflow, success criteria).
  - You can paste this into `/create-spec` when ready.
  - Evidence: You drafted a proposal file and will provide it during Phase 1.

---

### Phase 0: Minimal Setup (Pre-Specification)

**Model:** Any

- [x] **0.1 [You + AI] Create project folder and load methodology**
  - [x] **[You] Create project folder**  
    Evidence: workspace exists at `/Users/sam/Projects/samkirk-v3`.
  - [x] **[You] Create `docs/` subfolder**  
    Evidence: `docs/` exists.
  - [x] **[You] Copy the methodology into `docs/Dylan-Davis-50plus-method.md`**  
    Evidence: file exists and contains the workflow.
  - [x] **[AI] Review methodology**  
    Evidence: assistant read and extracted "The Complete Workflow".

- [x] **0.2 [AI] Initialize Git**
  - [x] **[AI] Create `.gitignore` (minimal, language-agnostic)**  
    Steps:
    - Create a file at the repo root: `/.gitignore`
    - Use this minimal baseline (expand later after spec):

```gitignore
.env*
!.env.example
.DS_Store
*.log
```

  - [x] **[AI] Run `git init`**  
    Steps (run from repo root):

```bash
git init
```

  - [x] **[AI] Create initial commit**  
    Steps (run from repo root):

```bash
git add .
git commit -m "Initial project scaffold"
```

    Evidence: initial commit exists (`d4914d1`).

  - [x] **[You] (Optional) Create a remote and push**  
    Steps (run from repo root):

```bash
git branch --show-current
git branch -M main
git remote set-url origin "https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git"
git push -u origin main
```

    Evidence:
    - `origin` is set (verify with `git remote -v`)
    - current branch is `main`

- [x] **0.3 [AI] Create Cursor slash commands (project + global)**

  - [x] **[AI] Create project commands in `.cursor/commands/`**  
    Steps:
    - Create the folder: `/.cursor/commands/`
    - Create each file below *exactly* (these implement the three-document workflow).

  - [x] **[AI] Create `/.cursor/commands/create-spec.md`**

```markdown
---
description: Start the specification interview
---
@docs/Dylan-Davis-50plus-method.md

Ask me one question at a time so we can develop a thorough, step-by-step spec for this idea. Each question should build on my previous answers, and our end goal is to have a detailed specification I can hand off to a developer. Let's do this iteratively and dig into every relevant detail. Remember, only one question at a time.

At any point during our conversation, I may provide prior work, examples, API documentation, or other reference materials. When I do, incorporate them into your understanding and adjust your questions accordingly.

When done at the end of our dialog, please write out the specification as @docs/SPECIFICATION.md.

Here's the idea:
```

  - [x] **[AI] Create `/.cursor/commands/create-blueprint.md`**

```markdown
---
description: Generate blueprint from specification
---
@docs/Dylan-Davis-50plus-method.md @docs/SPECIFICATION.md

Draft a detailed, step-by-step blueprint for building this project. Then, once you have a solid plan, break it down into small, iterative chunks that build on each other. Look at these chunks and then go another round to break it into small steps.

Review the results and make sure that the steps are small enough to be implemented safely with strong testing, but big enough to move the project forward. Iterate until you feel that the steps are right sized for this project.

From here you should have the foundation to provide a series of prompts for a code-generation LLM that will implement each step in a test-driven manner. Make sure we're not using mock data, but real data when testing and real calls to APIs when relevant.

Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step.

Make sure and separate each prompt section. Use markdown. Each prompt should be tagged as text using code tags. The goal is to output prompts, but context is important as well.

When done, please write out the blueprint as @docs/BLUEPRINT.md.
```

  - [x] **[AI] Create `/.cursor/commands/create-todo.md`**

```markdown
---
description: Generate TODO checklist from blueprint
---
@docs/Dylan-Davis-50plus-method.md @docs/BLUEPRINT.md

Can you make a TODO.md that I can use as a checklist? Be thorough. Include model labels for each task using the Model Selection Heuristics from the methodology. Please write it out as @docs/TODO.md.
```

  - [x] **[AI] Create `/.cursor/commands/start-step.md`**

```markdown
---
description: Start a new step from the TODO checklist
---
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Start with Step
```

  - [x] **[AI] Create `/.cursor/commands/continue-step.md`**

```markdown
---
description: Continue to the next step in the TODO checklist
---
@docs/SPECIFICATION.md @docs/BLUEPRINT.md @docs/TODO.md

Continue with Step
```

  - [x] **[AI] Verify global git workflow commands in `~/.cursor/commands/` (create only if missing)**  
    Notes:
    - These live in your home folder, not this repo.
    - If you already have equivalents, do not overwrite unless you explicitly want them updated.

    Create `~/.cursor/commands/git-commit-local.md`:

```markdown
---
description: Commit outstanding work to local repo
---
Review all staged and unstaged changes using git status and git diff. Stage appropriate files (exclude .env, credentials, and other secrets). Write a clear, descriptive commit message summarizing the work. Commit to the local repository only—do not push.
```

    Create `~/.cursor/commands/git-commit-push.md`:

```markdown
---
description: Commit and push to remote
---
Review all staged and unstaged changes using git status and git diff. Stage appropriate files (exclude .env, credentials, and other secrets). Write a clear, descriptive commit message summarizing the work. Commit and push to the remote repository.
```

---

### Phase 0 Summary of Work: Slash Commands Created

**Project slash commands (in this repo: `/.cursor/commands/`)**
- `/create-spec` → `create-spec.md` — Start the specification interview (one question at a time); outputs `docs/SPECIFICATION.md`.
- `/create-blueprint` → `create-blueprint.md` — Generate blueprint from spec; outputs `docs/BLUEPRINT.md`.
- `/create-todo` → `create-todo.md` — Generate TODO checklist from blueprint; outputs `docs/TODO.md`.
- `/start-step` → `start-step.md` — Start a new implementation step from the TODO checklist.
- `/continue-step` → `continue-step.md` — Continue to the next step in the TODO checklist.

**Global slash commands (for all projects: `~/.cursor/commands/`)**  
Git workflow commands live only in your home folder; Phase 0.3 verifies or creates them there. Use `/git-commit-local` and `/git-commit-push` in any repo once they exist globally.

**Project Cursor rule (in this repo: `/.cursor/rules/`)**
- `phase-model-reminder.mdc` — Reminds you which model to use when starting or continuing a phase; applies automatically in every chat (including new sessions)—no slash command needed.

---

### Phase 1: Specification (output: `docs/SPECIFICATION.md`)

**Model:** ChatGPT Auto Mode

- [x] **1.1 [You + AI] Complete specification interview (one question at a time)**  
  - Evidence: `docs/SPECIFICATION.md` created (commit `fe7f87c`).
  Steps:
  - Ensure `/.cursor/commands/create-spec.md` exists (Phase 0.3).
  - Start a fresh chat in Cursor.
  - Run: `/create-spec` and paste your idea after "Here's the idea:".
  - Answer **one question at a time** until the assistant writes `docs/SPECIFICATION.md`.
  - While answering, actively keep scope tight (push back on "enterprise" extras).

  Acceptance criteria:
  - `docs/SPECIFICATION.md` exists and is detailed enough to hand to a developer.

---

### Phase 1.5: Project-Specific Setup (Post-Specification)

**Model:** Any

- [x] **1.5.1 [AI] Update `.gitignore` for the stack chosen in `docs/SPECIFICATION.md`**  
  - Evidence: updated `/.gitignore` with Next.js/TypeScript ignores (node_modules, `.next`, build outputs, coverage).
  Steps:
  - Read `docs/SPECIFICATION.md` and identify languages/frameworks.
  - Update `/.gitignore` by adding the relevant block below.

  **TypeScript/JavaScript**:

```gitignore
node_modules/
dist/
build/
.next/
.env*
!.env.example
*.log
.DS_Store
coverage/
```

  **Rust**:

```gitignore
/target/
Cargo.lock
*.pdb
.env*
!.env.example
.DS_Store
```

  **Julia**:

```gitignore
.julia/
Manifest.toml
*.jl.cov
*.jl.mem
.env*
!.env.example
.DS_Store
```

  **General additions (if needed)**:

```gitignore
.vscode/
!.vscode/settings.json
.idea/
```

- [x] **1.5.2 [You + AI] Select and configure MCPs (based on `docs/SPECIFICATION.md`)**  
  - Evidence: using `cursor-browser-extension` for frontend/visual testing; GitHub access via existing `user-github` MCP (no secrets committed).
  Steps:
  - Decide which MCP servers you actually need (examples from methodology):
    - `github-mcp` for issues/PRs (requires token)
    - `cursor-browser-extension` for frontend/visual testing
    - `context7` for docs lookup (optional)
  - If using `github-mcp`:
    - **[You]** create a GitHub Personal Access Token with minimal scopes needed
    - **[You]** add it to `~/.cursor/mcp.json` (don't commit tokens to git)
  - Example `~/.cursor/mcp.json` snippet (edit to match what you actually install/use):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "github-mcp@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

- [x] **1.5.3 [You + AI] Set up LSP/compiler/tooling for the chosen stack**  
  - Evidence: bootstrapped Next.js + TypeScript (strict) app in `web/` via `create-next-app` (includes `web/tsconfig.json` with `"strict": true`).
  Steps (pick what matches the spec):
  - TypeScript:

```bash
npm init -y
npm install -D typescript @types/node
npx tsc --init
```

  - Rust:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

    Then install the `rust-analyzer` extension in Cursor.

  - Julia:

```bash
curl -fsSL https://install.julialang.org | sh
```

    Then install the Julia extension in Cursor.

- [x] **1.5.4 [AI] Create project rules file (project conventions + lessons)**  
  - Evidence: created `/.cursor/rules/project.mdc` (stack + conventions filled from `docs/SPECIFICATION.md`).
  Steps:
  - Create `/.cursor/rules/` (if missing).
  - Create `/.cursor/rules/project.mdc` with this template, then fill stack details from `docs/SPECIFICATION.md`:

```markdown
---
description: Project conventions and lessons
alwaysApply: true
---

# Project: (fill from SPECIFICATION.md)

## Stack
- (fill: languages/frameworks/tools)

## Conventions
- (fill: folder structure, naming, testing approach)

## Model preferences
- Frontend/UI: (e.g., Opus 4.5)
- Backend/logic: (e.g., GPT-5.2)
- Debugging/visual testing: (e.g., Gemini 3 Pro)

## Lessons learned
<!-- Add brief, information-dense entries when problems are solved -->
```

- [x] **1.5.5 [AI] Create `README.md` + commit**  
  - Evidence: created `/README.md` with setup/run instructions and doc pointers.
  Steps:
  - Create `/README.md` with:
    - Project summary
    - Setup/run instructions
    - Test commands
    - Where the three docs live (`docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, `docs/TODO.md`)
  - Commit (local) after README is correct.

---

### Phase 2: Blueprint (output: `docs/BLUEPRINT.md`)

**Model:** Claude Opus 4.5

- [x] **2.1 [You + AI] Generate blueprint from `docs/SPECIFICATION.md`**
  - Evidence: created `docs/BLUEPRINT.md`.
  Steps:
  - Ensure `docs/SPECIFICATION.md` exists (Phase 1).
  - Ensure `/.cursor/commands/create-blueprint.md` exists (Phase 0.3).
  - Use a high-end reasoning model (per prerequisites).
  - Run: `/create-blueprint`
  - Confirm it writes `docs/BLUEPRINT.md`.

  Acceptance criteria:
  - `docs/BLUEPRINT.md` contains phases + small iterative steps + testing instructions + "embedded prompts".

---

### Phase 3: TODO Checklist (output: `docs/TODO.md`)

**Model:** Claude Opus 4.5 (same session as Phase 2)

- [ ] **3.1 [AI] Generate TODO checklist from `docs/BLUEPRINT.md`**
  Steps:
  - Ensure `docs/BLUEPRINT.md` exists (Phase 2).
  - Ensure `/.cursor/commands/create-todo.md` exists (Phase 0.3).
  - Run: `/create-todo`
  - Confirm it writes `docs/TODO.md` with:
    - `- [ ]` checkboxes
    - phase/step grouping
    - model labels for each task

---

### Phase 4: Development Loop (drives implementation; tracked in `docs/TODO.md`)

**Model:** As specified in `docs/TODO.md` for each task (e.g. Opus 4.5, Codex/GPT-5.2, Gemini 3 Pro, Sonnet 4)

- [ ] **4.1 [You + AI] Start first implementation step in a fresh chat**
  Steps:
  - Start a fresh chat (avoid long-context "fog").
  - Run: `/start-step 1.1`
  - The assistant should:
    - read `docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, `docs/TODO.md`
    - implement Step 1.1
    - run tests
    - check off completed items in `docs/TODO.md`

- [ ] **4.2 [You + AI] Continue steps (fresh chat after each step)**
  Steps:
  - Start a fresh chat.
  - Run: `/continue-step 1.2` (or the next incomplete step)
  - Repeat until all TODO items are complete.

  Policy (from methodology):
  - Prefer **real data / real API calls** in tests when relevant (avoid "tests pass, app fails").

---

### Phase 5: Error Resolution (ongoing during Phase 4)

**Model:** Any (match to task: debugging → Gemini 3 Pro; quick fixes → Sonnet 4 or fast model)

- [ ] **5.1 [You + AI] Fix errors and embed lessons**
  Steps:
  - When an error occurs, persist until it's fixed (don't abandon the approach prematurely).
  - If the fix depends on current docs (post-training-cutoff changes), search the web and apply the update.
  - After a fix, write a short, information-dense "lesson learned" into `/.cursor/rules/project.mdc`.

  Optional automation (from methodology):
  - Create `/.cursor/rules/error-lessons.mdc` that reminds the assistant to embed lessons after fixes.

---

### Phase 6: Commit and Wrap Up (ongoing during development)

**Model:** Any

- [ ] **6.1 [You + AI] Commit after milestones**
  Steps:
  - After meaningful progress (end of phase / major feature):
    - Run `/git-commit-local` (if you created the global command) or do it manually.
  - Always exclude secrets (`.env`, credentials) from commits.

- [ ] **6.2 [You] Push when ready**
  Steps:
  - When you want to publish changes:
    - Run `/git-commit-push` (if created) or do `git push`.

---

### Notes: What this checklist is (and isn't)

- **This section (The Complete Workflow)**: tracks the *meta workflow* for this methodology.
- **`docs/TODO.md` (to be generated later)**: tracks *implementation tasks* from the Blueprint during development.

---

### Workflow Summary

| Phase | Model | Input | Output |
|-------|-------|-------|--------|
| 0. Minimal Setup | Any | Project folder | Git, slash commands, docs/ folder |
| 1. Specification | ChatGPT Auto | App idea | `docs/SPECIFICATION.md` |
| 1.5. Project Setup | Any | Specification | MCPs, LSP, rules, README, .gitignore |
| 2. Blueprint | Opus 4.5 | Specification | `docs/BLUEPRINT.md` |
| 3. TODO | Opus 4.5 | Blueprint | `docs/TODO.md` |
| 4. Development | Per task | `/start-step`, `/continue-step` | Working code |
| 5. Error Resolution | Any | Errors | Fixes + rules updates |
| 6. Commit | Any | `/git-commit-*` | Git history |

### Checking It Off

There are two checklists that track progress:

1. **The Complete Workflow** (this section, in this document) — the only meta-process checklist; it tracks setting up the project, creating the three documents, and managing the development loop. The chatbot checks these off as it completes each phase.

2. **docs/TODO.md** (separate file, created in Phase 3) — tracks the implementation tasks from the Blueprint. The chatbot checks these off during Phase 4 as it completes each development step.

When both checklists are fully checked off, the project is complete.

> **Note:** The "Model Labels in TODO.md" section earlier in this document is just an *example* showing the format of what `docs/TODO.md` will look like when generated. It's illustrative, not an active checklist. The only active checklist in this methodology document is The Complete Workflow above.

---

## The Meta-Insight

> The system works because it gives AI clear boundaries and structure. AI is best when given explicit requirements, architectural guidance, and feedback loops. The three documents provide all three.

**50+ apps built. Same system every time. This is how modern app development works.**
