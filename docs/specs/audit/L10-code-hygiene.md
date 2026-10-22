# L10. Code hygiene

> **Status:** Proposed (optional) · **Severity:** Low · **Type:** Maintainability · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l10-code-hygiene)

A checklist of small items; do them together in one clean-up PR or alongside the file they touch.

## Items
1. `frontend/src/features/analytics/init.ts:7-8`: remove the `console.log` lines (they print the host and key presence in every visitor's console). Move the hard-coded PostHog fallback key (`:3-5`) into env only (it is a public project token, but a fallback hides misconfiguration).
2. `frontend/src/features/notifications/utils.ts`: move the VAPID public key into `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; remove `console.log` at `:25`.
3. `backend/app/routers/exercises.py:12`: unused `from pprint import pprint`.
4. `backend/app/models/achievement.py:8`: imports the Pydantic `Exercise` from `app.schemas.exercise` instead of the SQLAlchemy model; the relationship works only because it resolves by string name. Import from `.exercise` (watch for circular imports; use `TYPE_CHECKING`).
5. `backend/app/schemas/achievement.py`: uses plain `pydantic.BaseModel` with `class Config`, bypassing `app/schemas/base.py`; align with the project camelCase convention (check frontend `features/achievements/types.ts` expectations before changing the JSON shape; this is a breaking API change, so do it with the frontend).
6. `backend/app/services/routine.py:101,122`: bare `except:`; use `except Exception:`.
7. `backend/requirements.txt`: `pytest` (and `fastapi-cloud-cli`, `rich`/`typer` extras if unused) in production requirements; split into `requirements-dev.txt`.
8. `GET /api/notifications` (`services/notification.py:6-8`) is unbounded and unordered; add order by `created_at desc` and a limit.
9. `Notification` and `NotificationSubscription` `user_id` foreign keys have no `ondelete` (`models/notifications.py`); decide on `CASCADE` (needs a migration). The demo reset deletes them by hand because of this (`services/demo.py:_delete_demo_data`).
10. `ilike` filters in `services/exercise.py:45,51,57` do not escape `%` and `_` (see [M5](M5-input-validation.md)).
11. `print` debugging in `workers/scheduler.py` (see [M8](M8-reminder-worker.md)) and unused debug code.
12. Initialise Sentry (`sentry-sdk` is in `requirements.txt` but is not used anywhere in `app/`) with `SENTRY_DSN` from env, or remove the dependency.
13. `README.md` describes routes (`/stats`) and a tech matrix that do not match the app (the AGENTS.md describes the real stack); update it with run/deploy instructions.

## Goal
Remove dead code and noise, and align the code with the conventions in `AGENTS.md`.

## Non-goals
Behaviour changes beyond the items listed.

## Acceptance criteria
`npm run lint` and `pytest` pass; no behaviour change except items 5, 8, 9, where API/DB changes are called out in their own PRs.

## Test plan
Lint, build and the test suite; spot-check the affected screens.

## Risks / rollout
Items 5 and 9 change contracts or schema; keep them separate from the pure clean-ups.

## Dependencies
None.
