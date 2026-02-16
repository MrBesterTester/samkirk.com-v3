# do-work/

Autonomous work queue for processing tasks. Part of the [do-work skill](../.claude/skills/do-work/).

Tasks enter as REQ files in this root folder (the queue), get claimed into `working/`, and archive into `archive/` when done. Each REQ links back to a User Request (UR) folder that preserves the original input.

## Lifecycle

```
User input → UR folder (user-requests/) + REQ file (queue)
                                            │
                                    claimed → working/
                                            │
                                 completed → archive/UR-NNN/
```

## Folder Structure

```
do-work/
├── REQ-*.md            # Pending queue (picked up in order)
├── user-requests/      # Incoming UR folders with verbatim input
├── working/            # REQ currently being processed
└── archive/            # Completed work (organized by UR)
```

## File Naming

- **REQ files**: `REQ-NNN-short-slug.md` — YAML frontmatter tracks status, timestamps, route
- **UR folders**: `UR-NNN/` — contains `input.md` (verbatim) and completed REQ files after archival

## Key Commands

- `do work <description>` — capture a new task (creates UR + REQ)
- `do work run` — process the queue
- `do work list` — show queue status
- `do work verify` — evaluate captured REQs
- `do work cleanup` — consolidate the archive

## Further Reading

- [Skill documentation](../.claude/skills/do-work/) — full action specs and routing logic
- [CLAUDE.md](../CLAUDE.md) — project-level workflow instructions
