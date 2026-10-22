# L8. Demo page redirect misuse; manual demo reset

> **Status:** Proposed · **Severity:** Low · **Type:** Bug / operations · **Confidence:** Likely (redirect), Confirmed (manual reset) · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l8-demo-page-redirect-misuse-manual-demo-reset)

## Problem
1. `frontend/src/app/demo/page.tsx:18`: `redirect("/routines")` is called from an async function inside `useEffect`. In Client Components `redirect` is meant for rendering, not event handlers or effects; the thrown `NEXT_REDIRECT` ends up as an unhandled promise rejection, and navigation may be unreliable. The effect also runs twice in dev (Strict Mode), calling `demoLoginAction` twice, and the `error` state is shown only after `loading` is set to false (the failure branch never sets `loading` to false, so the page can stay on "Loading demo..." forever).
2. Demo data reset is manual: per `docs/specs/public-demo-mode.md`, `python3 seed_demo.py --yes` must be run at least weekly or the demo streak lapses; there is no scheduler. All visitors share one demo user and can edit and delete each other's data; PATCH is not quota-limited (see [M5](M5-input-validation.md)). The banner (`DemoBanner.tsx`) says "Changes reset regularly" while the spec text said "nightly".

## Goal
The demo entry works reliably and the data reset runs without human action.

## Non-goals
Per-visitor demo accounts (the spec lists it as an alternative with its own trade-offs).

## Proposed change
- Demo page: use `useRouter().push("/routines")` (or `router.replace`), set `loading` to false on error, guard against double invocation with a ref; consider making `/demo` a Server Component/route handler that calls the login action and redirects server-side.
- Reset: schedule `seed_demo.py --yes` (Cloud Run Job + Cloud Scheduler, daily) and document it in the README; alert on failure (the script already exits non-zero on error). Confirm the reset runs under a DB role that can only touch demo rows if possible.
- Align banner copy with the real schedule.

## Acceptance criteria
- Visiting `/demo` always ends on `/routines` with a demo session or shows the error with a retry link; no unhandled rejection in the console.
- Demo data is refreshed daily without manual steps; streak numbers stay correct.

## Test plan
Manual in the Browser pane (success and with the backend returning 503/404); check the scheduler run logs.

## Risks / rollout
The reset deletes and recreates the demo user's rows; it is guarded to touch only `is_demo` users (see tests in `tests/test_demo.py`).

## Dependencies
None (related: [M5](M5-input-validation.md) for demo PATCH limits).
