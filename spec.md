# Specification

## Summary
**Goal:** Audit and fix all known bugs in the Friends Chat application introduced or discovered after the Version 5 deployment.

**Planned changes:**
- Fix public chat message feed: ensure messages load in order, sending works, and the feed auto-scrolls to the latest message.
- Fix Friends panel: user search, sending/accepting/declining friend requests, and online/offline status indicators.
- Fix private chat view: correct thread loading, message sending, and auto-scroll behavior.
- Fix video call modal: camera stream initialization, mute/camera toggles, end-call cleanup, and Escape key handling.
- Fix user profile setup flow: new users are prompted once, returning users skip the setup modal, and profile data persists correctly.
- Fix backend Motoko actor functions: ensure all public functions return correct results without trapping, handle concurrent message posting, atomic friend request state transitions, and correctly scoped private message threads.

**User-visible outcome:** All core features of the app (public chat, friends panel, private chat, video calls, and profile setup) work correctly without errors or unexpected behavior.
