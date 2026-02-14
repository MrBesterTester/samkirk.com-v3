---
id: REQ-073
title: Chat text box doesn't scroll during conversation
status: pending
created_at: 2026-02-14T10:52:00Z
user_request: UR-014
---

# Chat text box doesn't scroll during conversation

## What
The chat message area on the Hire Me page doesn't auto-scroll to show new messages during a conversation. When new messages are added, the user has to manually scroll down to see them.

## Context
- ChatStream component: `web/src/components/hire-me/ChatStream.tsx`
- ChatStream has fixed height `h-[28rem] sm:h-[32rem]` with `overflow-y-auto`
- There is existing auto-scroll logic using `useRef` with smooth scroll to bottom on new messages — it may be broken or not triggering correctly
- Could also be that the scroll container ref isn't attached to the right element, or the scroll fires before the DOM updates

---
*Source: the text box during the chat doesn't scroll.*
