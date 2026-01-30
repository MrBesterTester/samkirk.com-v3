## Setup Checklist (Dylan Davis “50+ apps” workflow)

This file is the **meta-process checklist** derived from the section **“The Complete Workflow”** in `docs/Dylan-Davis-50plus-method.md`. It tracks project setup + the three-document workflow (Spec → Blueprint → TODO) + the development loop.

**Model reminders:** Each phase below is annotated with the **recommended model** from the methodology. When starting or continuing a phase, the assistant should remind you which model to use for that phase.

**Checkbox meaning**
- `- [x]` done in *this* workspace (or done by us in this session)
- `- [ ]` not done yet / to do

**Owner tags**
- **[You]**: requires Sam to do an action (accounts, approvals, choosing stack, etc.)
- **[AI]**: work the assistant can do in Cursor once prerequisites are met

**Current workspace state (observed)**
- `docs/Dylan-Davis-50plus-method.md` exists
- `docs/Proposal.md` exists
- `docs/Setup.md` exists (this file)
- Git repository initialized (`.git/` exists)
- Project slash commands exist in `/.cursor/commands/`
- No `docs/SPECIFICATION.md`, `docs/BLUEPRINT.md`, or `docs/TODO.md` yet
- Workflow setup rule exists: `/.cursor/rules/workflow-setup.mdc` (guards against forgetting global git commands)

---

### Prerequisites (from “The Complete Workflow”)

- [x] **[You] Cursor IDE installed** (you’re using Cursor right now)
- [x] **[You] ChatGPT access for the spec interview** (you’re using GPT-5.2 in Cursor right now)
- [x] **[You] Verify access to Claude Opus 4.5 (needed for blueprint generation)**  
  Steps:
  - Confirm you can select **Claude Opus 4.5** in Cursor (or another tool you’ll use for blueprint generation).
  - If not available, pick an alternative high-end reasoning model (document which) and use it consistently for `docs/BLUEPRINT.md`.
  - Evidence: You confirmed Opus 4.5 access.
- [x] **[You] App idea clearly in mind**  
  Steps:
  - Write a 3–10 sentence “idea blurb” (problem, user, core workflow, success criteria).
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
  - [x] **[You] Create `docs/Setup.md`**  
    Evidence: this file exists.
  - [x] **[AI] Review methodology**  
    Evidence: assistant read and extracted “The Complete Workflow” and is converting it into this checklist.

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
- `/git-commit-local` → `git-commit-local.md` — Stage, message, and commit locally; do not push.
- `/git-commit-push` → `git-commit-push.md` — Commit and push to remote.

**Project Cursor rule (in this repo: `/.cursor/rules/`)**
- `phase-model-reminder.mdc` — Reminds you which model to use when starting or continuing a phase; applies automatically in every chat (including new sessions)—no slash command needed.

---

### Phase 1: Specification (output: `docs/SPECIFICATION.md`)

**Model:** ChatGPT Auto Mode

- [ ] **1.1 [You + AI] Complete specification interview (one question at a time)**
  Steps:
  - Ensure `/.cursor/commands/create-spec.md` exists (Phase 0.3).
  - Start a fresh chat in Cursor.
  - Run: `/create-spec` and paste your idea after “Here’s the idea:”.
  - Answer **one question at a time** until the assistant writes `docs/SPECIFICATION.md`.
  - While answering, actively keep scope tight (push back on “enterprise” extras).

  Acceptance criteria:
  - `docs/SPECIFICATION.md` exists and is detailed enough to hand to a developer.

---

### Phase 1.5: Project-Specific Setup (Post-Specification)

**Model:** Any

- [ ] **1.5.1 [AI] Update `.gitignore` for the stack chosen in `docs/SPECIFICATION.md`**
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

- [ ] **1.5.2 [You + AI] Select and configure MCPs (based on `docs/SPECIFICATION.md`)**
  Steps:
  - Decide which MCP servers you actually need (examples from methodology):
    - `github-mcp` for issues/PRs (requires token)
    - `cursor-browser-extension` for frontend/visual testing
    - `context7` for docs lookup (optional)
  - If using `github-mcp`:
    - **[You]** create a GitHub Personal Access Token with minimal scopes needed
    - **[You]** add it to `~/.cursor/mcp.json` (don’t commit tokens to git)
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

- [ ] **1.5.3 [You + AI] Set up LSP/compiler/tooling for the chosen stack**
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

- [ ] **1.5.4 [AI] Create project rules file (project conventions + lessons)**
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

- [ ] **1.5.5 [AI] Create `README.md` + commit**
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

- [ ] **2.1 [You + AI] Generate blueprint from `docs/SPECIFICATION.md`**
  Steps:
  - Ensure `docs/SPECIFICATION.md` exists (Phase 1).
  - Ensure `/.cursor/commands/create-blueprint.md` exists (Phase 0.3).
  - Use a high-end reasoning model (per prerequisites).
  - Run: `/create-blueprint`
  - Confirm it writes `docs/BLUEPRINT.md`.

  Acceptance criteria:
  - `docs/BLUEPRINT.md` contains phases + small iterative steps + testing instructions + “embedded prompts”.

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
  - Start a fresh chat (avoid long-context “fog”).
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
  - Prefer **real data / real API calls** in tests when relevant (avoid “tests pass, app fails”).

---

### Phase 5: Error Resolution (ongoing during Phase 4)

**Model:** Any (match to task: debugging → Gemini 3 Pro; quick fixes → Sonnet 4 or fast model)

- [ ] **5.1 [You + AI] Fix errors and embed lessons**
  Steps:
  - When an error occurs, persist until it’s fixed (don’t abandon the approach prematurely).
  - If the fix depends on current docs (post-training-cutoff changes), search the web and apply the update.
  - After a fix, write a short, information-dense “lesson learned” into `/.cursor/rules/project.mdc`.

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

### Notes: What this checklist is (and isn’t)

- **This file (`docs/Setup.md`)**: tracks the *meta workflow* from “The Complete Workflow”.
- **`docs/TODO.md` (to be generated later)**: tracks *implementation tasks* from the Blueprint during development.
