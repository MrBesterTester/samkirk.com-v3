---
id: REQ-074
title: Remove up-arrow button that creates new chat threads
status: pending
created_at: 2026-02-14T10:55:00Z
user_request: UR-015
---

# Remove up-arrow button that creates new chat threads

## What
The up-arrow send button on the chat input box is creating a new conversation thread/frame each time it's used instead of continuing the existing conversation. Remove it — a single continuous chat thread should be sufficient. Users should just press Enter to send.

## Context
- Chat input component: `web/src/components/hire-me/ChatInput.tsx`
- The blue up-arrow button is the submit/send button in the chat input form
- It appears to be triggering `newConversation()` or creating a new `conversationId` on each submit instead of reusing the existing one
- The `+ New Conversation` button in the actions bar already exists for explicitly starting fresh — the send button shouldn't also do this
- Fix: ensure the send button continues the current conversation, OR remove the button entirely and rely on Enter key to send (hint text "Press Enter to send" already exists)

---
*Source: The up arrow box on the chat input box is creating a new frame, i.e., a new chat thread. Please drop it.*
