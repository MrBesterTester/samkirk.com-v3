---
id: REQ-092
title: Add READMEs for web/src/ tree
status: pending
created_at: 2026-02-16T19:00:00Z
user_request: UR-029
related: [REQ-091, REQ-093]
batch: missing-readmes
---

# Add READMEs for web/src/ tree

## What
Create README.md files for the five web/src folders that currently lack them:
- `web/src/` — source root
- `web/src/app/` — Next.js App Router pages and API routes
- `web/src/components/` — shared React components
- `web/src/lib/` — core business logic (40+ modules)
- `web/src/test/` — test utilities

## Context
The web/src/lib/ folder is the most complex folder in the project with 40+ modules of core business logic. web/src/app/ contains all pages and API routes. Neither has any orientation documentation. The existing web/README.md covers the application at a high level but doesn't detail the source tree.

## Detailed Requirements
- Each README should explain the folder's purpose, key files/subfolders, and conventions
- `web/src/lib/` is highest value — should list or categorize the major modules
- `web/src/app/` should explain the routing structure and API route conventions
- `web/src/components/` should note any component organization patterns
- `web/src/test/` should explain available test utilities and how they're used
- Follow the project's existing README style (concise, practical)

## Builder Guidance
- Certainty level: Firm on which folders; flexible on depth
- Scope cues: web/src/lib/ deserves the most detail; others can be brief
- The builder should explore the actual folder contents to write accurate descriptions

---
*Source: See UR-029/input.md for full verbatim input*
