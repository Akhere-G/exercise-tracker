# H4. No rate limiting or lockout on login and registration

> **Status:** Proposed · **Severity:** High · **Type:** Security · **Confidence:** Confirmed (absence) · **Effort:** M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#h4-no-rate-limiting-or-lockout-on-login-and-registration)

## Problem
`backend/app/routers/users.py` exposes `/api/auth/register`, `/login`, `/token` and `/demo` with no throttling. Registration is open. Password policy is 8-72 characters with at least one digit, lower-case and upper-case letter (`schemas/user.py`). bcrypt verification is deliberately CPU-heavy, so a flood of attempts also drives CPU use and Cloud Run cost.

## Goal
Make online guessing and signup/login floods expensive without hurting normal users.

## Non-goals
CAPTCHA, MFA, email verification or password-reset flows (separate work). Do not add Redis unless the deployment already has it.

## Proposed change
Pick one layer (recommended: both a coarse edge limit and a fine app limit):
1. **Edge (preferred, no code):** Cloud Armor / load-balancer rate rule on `/api/auth/*` (for example 10 requests per minute per IP).
2. **App:** add `slowapi` (in-memory) or a small DB-backed counter:
   - `/login`, `/token`: 5 failures per 15 minutes per (IP, email) then HTTP 429 with `Retry-After`.
   - `/register`: 5 per hour per IP.
   - `/demo`: 30 per minute per IP.
   - In-memory counters are per-instance on Cloud Run; accept that as best effort, or store counters in the database for accuracy.
3. Use the real client IP (`X-Forwarded-For` behind Cloud Run; configure uvicorn `--proxy-headers` and trusted hosts so it cannot be spoofed).
4. Keep a single generic failure message; run a dummy bcrypt verify for unknown emails to even out timing (see [L4](L4-duplicate-login-endpoints.md) for consolidating the endpoints first).
5. Log throttle events (no passwords or tokens).

Files: `backend/app/main.py` (limiter setup), `backend/app/routers/users.py` (decorators/dependencies), `backend/requirements.txt`.

## Acceptance criteria
- The sixth bad login for the same IP and email within 15 minutes returns 429 with `Retry-After`.
- Normal login, register and demo flows are unaffected under the limits.
- Rate limit state does not break tests (limiter disabled or reset in `conftest.py`).

## Test plan
Backend tests with FastAPI `TestClient`: repeated failed logins hit 429; success after the window; register flood; limiter bypass attempt with a forged `X-Forwarded-For` does not work when untrusted.

## Risks / rollout
Shared NAT/office IPs can lock out several users: key on (IP, email) for login. In-memory limits reset on deploy and differ per instance.

## Dependencies
Do with [L3](L3-secret-key-fail-fast.md) (auth hardening in the same area); consolidate endpoints first via [L4](L4-duplicate-login-endpoints.md) if you want to limit one route instead of two.
