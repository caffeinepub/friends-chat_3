# Specification

## Summary
**Goal:** Audit and fix all bugs in the video call feature of the Friends Chat app so the full call lifecycle works correctly end-to-end.

**Planned changes:**
- Fix the video call button in `FriendListItem` (Friends panel) and `PrivateChatView` header to correctly open the `VideoCallModal`
- Fix the `useVideoCall` hook to successfully request and initialise the local camera/microphone media stream without errors
- Fix mute (audio) toggle so it correctly mutes/unmutes the audio track and reflects the proper state in the UI
- Fix camera toggle so it correctly enables/disables the video track and reflects the proper state in the UI
- Fix the simulated "Calling…" → "Connected" state transition to work as intended
- Fix the "End Call" action to stop all media tracks, release the stream, and cleanly close/unmount the `VideoCallModal`
- Eliminate all unhandled promise rejections and console errors during the full call lifecycle

**User-visible outcome:** Users can open a video call from either the Friends panel or the private chat header, see their local camera feed, toggle mute and camera on/off, experience the simulated connected state, and end the call cleanly — all without errors.
