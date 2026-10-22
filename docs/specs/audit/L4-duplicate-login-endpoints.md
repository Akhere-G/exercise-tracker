# L4. Duplicate login endpoints

> **Status:** Proposed · **Severity:** Low · **Type:** Maintainability · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l4-duplicate-login-endpoints)

## Problem
`backend/app/routers/users.py` has two login routes that do the same thing: `POST /api/auth/token` (OAuth2 password form, status 400 and "Incorrect email or password", `:27-38`) and `POST /api/auth/login` (JSON, status 401 and "Incorrect password or email", `:41-51`). The frontend uses `/auth/login` only. Two endpoints mean two places to patch for rate limiting ([H4](H4-auth-rate-limiting.md)), timing and logging, and the 400 versus 401 inconsistency.

## Goal
One code path for credential checking; consistent status code and message.

## Non-goals
Removing OAuth2 form login if the Swagger "Authorize" button is still wanted.

## Proposed change
- Extract `authenticate_user(db, email, password) -> User | None` into `services/user.py` (include a dummy hash verification when the user is not found to equalise timing).
- Both routes call it; return 401 with one message in both.
- Keep `/token` only for the OAuth2 scheme (`OAuth2PasswordBearer(tokenUrl="api/auth/token")`); note in a docstring that the frontend uses `/login`.

## Acceptance criteria
- Wrong password via either route returns the same status and body.
- Login with valid credentials via either route returns a token.

## Test plan
API tests for both routes (success, wrong password, unknown email).

## Risks / rollout
Clients depending on 400 from `/token` (none known) would see 401.

## Dependencies
Do before [H4](H4-auth-rate-limiting.md) if you want to rate-limit a single function.
