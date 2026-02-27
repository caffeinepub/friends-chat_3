# Specification

## Summary
**Goal:** Fix the Internet Identity login flow so that users can successfully log in to the Friends Chat app.

**Planned changes:**
- Audit and fix the login button rendering so it is visible and interactive when the user is unauthenticated
- Fix the Internet Identity popup flow so it opens without console errors and completes without hanging
- Ensure the app transitions correctly after successful login (to profile setup for new users, or main chat for returning users)
- Handle login cancellation or failure gracefully, returning to the login screen without crashing
- Audit the actor initialisation sequence to ensure an authenticated actor is created and non-null after login
- Add a retry mechanism for actor initialisation failures and surface a user-facing error message instead of silently hanging

**User-visible outcome:** Users can click the login button, complete Internet Identity authentication, and be taken into the app without errors or blank screens.
