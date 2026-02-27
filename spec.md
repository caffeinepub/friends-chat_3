# Specification

## Summary
**Goal:** Fix the infinite "Loading your profile…" spinner in ChatView that permanently blocks the app UI on startup.

**Planned changes:**
- Audit `useQueries.ts` `getUserProfile` hook to ensure it has a proper `enabled` condition that prevents firing before the actor is ready, and that it correctly transitions out of loading state once the actor resolves.
- Fix ChatView's loading gate so it evaluates to false on any terminal query state (success with data, success with null, or error) — not only when data is truthy.
- Add a timeout/fallback (≤10 seconds) so the spinner is dismissed even if the backend call errors, times out, or returns null/undefined.
- If the query resolves with no profile, exit the loading state and show the profile setup flow (DisplayNamePrompt or ProfileSetupModal).
- If the query resolves with a valid profile, exit the loading state and render the main chat UI.
- Ensure no unhandled promise rejections or console errors occur during the profile loading lifecycle.

**User-visible outcome:** The app no longer hangs on the "Loading your profile…" spinner; users are taken to either the profile setup flow or the main chat UI within a few seconds of opening the app.
