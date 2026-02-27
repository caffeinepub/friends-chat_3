# Specification

## Summary
**Goal:** Build a simple group chat app where friends can post and read messages in a shared feed.

**Planned changes:**
- Backend actor that stores chat messages (sender name, text, timestamp) in stable storage, with `postMessage` and `getMessages` functions
- Frontend chat UI with a scrollable message feed showing sender, text, and time
- Display name prompt for new users before they can send messages
- Text input and Send button at the bottom; submits on Enter or click
- Auto-scroll to the latest message; feed updates via periodic polling
- Warm coral/amber color theme with rounded chat bubbles, card-based layout, and friendly sans-serif typography
- Visually distinct bubbles for the local user vs. others; responsive layout for desktop and mobile

**User-visible outcome:** Friends can open the app, set a display name, and exchange messages in a shared real-time-feeling chat feed with a warm, social visual design.
