# M4. JWT returned to client JS; no explicit `sameSite`

> **Status:** Proposed · **Severity:** Medium · **Type:** Security hardening · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m4-jwt-returned-to-client-js-cookie-has-no-explicit-samesite)

## Problem
`frontend/src/features/auth/actions.ts` sets the token in an httpOnly cookie, then returns it: `loginAction` (`:30`), `registerAction` (`:45`), `demoLoginAction` (`:65`) all `return { success: true, data: token }`. Server action results are serialised to the browser, so client code (and any injected script) can read the JWT, which defeats the purpose of `httpOnly`. Cookie options (`:12-17`, `:57-62`) do not set `sameSite`.

## Goal
The JWT is only ever readable by the server.

## Non-goals
Moving to short-lived tokens plus refresh (separate project).

## Proposed change
- Return `{ success: true, data: null }` from the three actions (`ActionResponse<null>`); update the callers that read `data` (login, register, demo pages/forms: grep for `loginAction`, `registerAction`, `demoLoginAction`) and `Token` use in `features/auth/schema.ts`.
- Add `sameSite: "lax"` to every `cookieStore.set` call in `auth/actions.ts`, including `demo_session`.
- Keep `secure` for production as is.

## Acceptance criteria
- The server action response contains no `access_token` (check the network payload).
- Login, register, demo and logout still work; protected pages load.
- Cookies show `SameSite=Lax`, `HttpOnly`, `Secure` (production).

## Test plan
Manual in the Browser pane: inspect the action response and cookies for each flow.

## Risks / rollout
Low. Callers that relied on `data.access_token` (none found in `src/`, to be re-checked) would need updating.

## Dependencies
Ship with [H2](H2-auth-cookie-maxage.md) (same file).
