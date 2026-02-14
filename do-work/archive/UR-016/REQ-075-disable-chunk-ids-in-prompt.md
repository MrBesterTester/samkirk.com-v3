---
id: REQ-075
title: "Disable chunk IDs in interview prompt (future: structured citation)"
status: completed
created_at: 2026-02-14T12:00:00Z
user_request: UR-016
addendum_to: REQ-072
route: B
completed_at: 2026-02-14T12:05:00Z
---

# Disable chunk IDs in interview prompt

## What
Set `includeChunkIds: false` in the interview chat system prompt to stop chunk references from leaking into LLM output. The regex-stripping approach (REQ-070, REQ-072) is unreliable because the LLM keeps finding new ways to format the references.

## Context
- REQ-070 added `stripChunkReferences()` + prompt instruction to not leak chunk IDs
- REQ-072 broadened the regex when the LLM used `(chunks 1, 8, 12)` instead of `(chunk_abc123)`
- Root cause: giving the LLM chunk IDs and asking it not to mention them is inherently unreliable
- Fix: stop providing chunk IDs to the LLM entirely (`includeChunkIds: false`)
- This disables citation traceability for now — a future REQ should implement structured citation (e.g. separate JSON field or backend semantic matching) to restore traceability without leaking chunk IDs into chat

## Change
- `web/src/lib/interview-chat.ts:584`: `includeChunkIds: true` → `includeChunkIds: false`

## Future Work
When traceability is needed again (knowing which resume chunks informed each answer), implement one of:
1. **Structured output**: Have the LLM return citations in a separate JSON field (`{ "response": "...", "cited_chunks": [...] }`)
2. **Backend matching**: Map LLM response text to chunks after the fact using semantic similarity or keyword overlap

Either approach keeps chunk IDs out of the user-facing prose entirely.

## Testing
Manual — the change is a single boolean flag. Existing `stripChunkReferences()` tests remain as a safety net but should no longer be needed.
