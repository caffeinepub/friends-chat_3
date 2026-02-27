# Specification

## Summary
**Goal:** Restore the missing main UI sections (message feed, friends panel, and video call UI) in the Friends Chat application so all three are visible and accessible after login.

**Planned changes:**
- Fix ChatView's conditional rendering logic so that after profile setup is complete, the full UI renders unconditionally without being gated or hidden.
- Ensure the public message feed (MessageFeed + MessageInput) is always mounted and visible in ChatView.
- Ensure the Friends panel (FriendsPanel) is always mounted as a sidebar alongside the message feed, not replacing it.
- Ensure the video call button is present in both FriendListItem rows and the PrivateChatView header, and that VideoCallModal opens correctly with camera feed and controls.
- Fix any state management issues that cause sections to disappear when navigating between public chat, private chat, and the friends panel.

**User-visible outcome:** Users see the complete chat UI on load — a scrollable public message feed with input bar, a friends sidebar with search/friend requests/friend list, and working video call buttons — with no blank screens or missing sections.
