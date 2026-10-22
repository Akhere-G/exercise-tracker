# L2. No 401 handling; `/settings` unprotected; middleware renamed in Next 16

> **Status:** Proposed · **Severity:** Low · **Type:** Bug / maintainability · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l2-no-401-handling-settings-unprotected-middleware-renamed-in-next-16)

## Problem
- Nothing in `frontend/src/` reacts to an API 401 (searched for `401`, `redirect(`): `handleApiError` (`lib/axios.ts`) turns it into `{ success: false, errors: "Could not validate credentials" }`, and pages render empty or "not found" states. This occurs when a token is invalid (secret rotation, deleted user) while the cookie still exists, or when the backend token expires before the cookie.
- `frontend/src/middleware.ts:8-14`: `protectedPaths` omits `/settings` (it renders the shell and a logout button without a session) and includes `/stats`, which has no route. Only cookie presence is checked, never validity.
- Next.js 16 renamed Middleware to Proxy (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`: file `proxy.ts`, exported function `proxy`). The file still works today but the convention is deprecated.
- `handleApiError` assumes `err.response?.data.detail`; network errors or non-JSON bodies yield `errors: undefined` (see [L9](L9-error-toasts.md)).

## Goal
An invalid or expired session sends the user to login (clearing the cookie); every authenticated route is covered by the same check.

## Non-goals
Authorization in the proxy; keep it as an optimistic check, as the Next docs recommend. The backend remains the source of truth.

## Proposed change
- Rename `src/middleware.ts` to `src/proxy.ts` and the export to `proxy` (verify against the installed docs, including the `config.matcher` form).
- Build `protectedPaths` from the actual routes: add `/settings`, remove `/stats` (or invert the logic: public paths = `/`, `/login`, `/register`, `/demo`, assets; everything else protected).
- Central 401 handling: in the Axios instance add a response interceptor (server side) that, on 401, deletes the `access_token`/`demo_session` cookies via a server action or redirects to `/login?callbackUrl=...`. Note cookies can only be modified in server actions / route handlers; the simplest pattern is a small server action `logoutAction`-style redirect, or have `handleApiError` return a typed `unauthorized` flag that page components act on with `redirect("/login")`.
- Make `handleApiError` robust: `err.response?.data?.detail`, a fallback message, and a typed `errors: string | ValidationError[]` in `lib/apiTypes.ts`.

## Acceptance criteria
- Visiting `/settings` while logged out redirects to `/login`.
- Replacing the cookie with a garbage value and loading `/routines` lands on `/login`, not an empty page.
- No `middleware.ts` deprecation warning at build.

## Test plan
Manual with the Browser pane (clear and corrupt cookies); `npm run build`.

## Risks / rollout
Redirect loops if the login page itself fetches authenticated data or the proxy redirects authenticated users away from `/login` while the token is invalid: delete the cookie before redirecting.

## Dependencies
Pairs with [M4](M4-token-exposure-samesite.md) and [H2](H2-auth-cookie-maxage.md) (cookie handling), and [L9](L9-error-toasts.md).
