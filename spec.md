# Specification

## Summary
**Goal:** Fix remote audio not being audible during video calls in the VideoCallModal.

**Planned changes:**
- Update `useVideoCall.ts` to request both `audio: true` and `video: true` in `getUserMedia`
- Ensure the `VideoCallModal` renders a dedicated audio/video element for the remote stream with `srcObject` set to the remote stream, `autoPlay` enabled, and not muted
- Ensure the remote audio/video element's `srcObject` is cleared and all media tracks are stopped when the call ends

**User-visible outcome:** Users can hear the remote party's audio during a video call.
