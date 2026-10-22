# H2. Auth cookie expires after about 2.8 hours instead of 7 days

> **Status:** Proposed · **Severity:** High · **Type:** Bug · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#h2-auth-cookie-expires-after-about-28-hours-instead-of-7-days)

## Problem
`frontend/src/features/auth/actions.ts:11`: `maxAge = 60 * 24 * 7` is in seconds (10,080 s, about 2 h 48 min). The backend issues tokens valid for `ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7` minutes (7 days, `backend/app/services/user.py:19`). The demo path correctly uses seconds (`DEMO_SESSION_SECS = 60 * 60 * 2`).

## Goal
The session cookie lives as long as the token it carries.

## Non-goals
Refresh tokens or sliding sessions; changing the 7-day lifetime itself.

## Proposed change
- Replace the default with `const SESSION_SECS = 60 * 60 * 24 * 7;` and use it in `setAccessToken`.
- Keep the demo value (`DEMO_SESSION_SECS`) as is; it already matches `DEMO_TOKEN_TTL = 2 hours`.
- Optional: document the 7-day value in one comment next to the backend constant so both stay aligned.

## Acceptance criteria
- After login, the `access_token` cookie `Max-Age` is 604800.
- After demo login it is 7200.
- A user stays signed in for more than 3 hours.

## Test plan
Manual: log in, inspect the cookie in devtools (Application -> Cookies) or via the Browser pane. No automated harness exists for server actions yet.

## Risks / rollout
Longer-lived sessions increase the value of a stolen cookie; this is the intended behaviour and is mitigated by [M4](M4-token-exposure-samesite.md) (stop returning the token to client code). Ship together with M4 (same file).

## Dependencies
Group with [M4](M4-token-exposure-samesite.md).
