# Gains: Audit Findings

Date: 2026-10-22. Branch `main`, working tree clean at the start of the audit. No application code, dependencies, configuration or database state was modified.

Each finding has a spec in [`docs/specs/audit/`](../specs/audit/README.md) (index, ordering and dependencies are there).

**Confidence labels:** **Confirmed** = verified in code or tool output. **Likely** = strong code evidence, not reproduced at runtime. **Potential** = depends on deployment details that were not visible.

## What was checked

- Read in full: backend `app/` (models, schemas, routers, services, workers), Alembic migrations, `start.sh`/`worker_start.sh`, both Dockerfiles and `.dockerignore` files, backend tests.
- Read: frontend middleware, Axios instance, auth/workout/routine/exercise/achievement/notification actions and queries, Zustand stores, workout create/edit flows, demo flow, analytics and PWA config.
- Ran: `pytest` in `backend/` (25 passed, in-memory SQLite, no cache written), `npm audit --omit=dev`, `pip list --outdated`, secret scan of tracked files and full git history (no secrets found; every `.env*` is gitignored and excluded by `.dockerignore`).

## Executive summary

The codebase is small and consistently structured. Authorization is sound: every workout, routine, notification and achievement query is scoped by `user.id`, and no secrets are committed. The material risks are:

1. A data-corrupting bug in workout editing (duration multiplied by 60 on every save).
2. Auth cookie lifetime is wrong (about 2.8 hours instead of 7 days) and the JWT is returned to client JS.
3. No brute-force protection on login or registration.
4. Vulnerable `axios` / `next` versions (33 npm advisories, 2 critical, 22 high; mostly transitive but `axios` and `next` are direct).
5. Reliability gaps where work happens after commit or is not awaited (workout save, push subscribe, reminders).
6. Very little test coverage outside the demo feature, and no CI.

## Summary table

| ID | Title | Category | Severity | Confidence | Effort |
|---|---|---|---|---|---|
| H1 | Editing a workout multiplies duration by 60 | Bug / data integrity | High | Confirmed | S |
| H2 | Auth cookie expires after ~2.8 h instead of 7 days | Bug | High | Confirmed | S |
| H3 | Vulnerable dependencies (npm confirmed, Python unchecked) | Security | High | Confirmed (advisories) | S-M |
| H4 | No rate limiting on login/register | Security | High | Confirmed (absence) | M |
| M1 | Workout saved, then 500 if achievement award fails | Reliability | Medium | Likely | S-M |
| M2 | No double-submit protection when completing a workout | Bug | Medium | Likely | S |
| M3 | Push subscribe is fire-and-forget | Bug | Medium | Confirmed | S |
| M4 | JWT returned to client JS; no explicit `sameSite` | Security hardening | Medium | Confirmed | S |
| M5 | Server-side input validation gaps | Security / bug | Medium | Confirmed | M |
| M6 | Email not normalised; register race | Bug | Medium | Confirmed | S |
| M7 | Personal-record `value` stored as integer | Bug / data integrity | Medium | Confirmed schema, likely runtime | M |
| M8 | Reminder worker: timezone, dedupe, broken script, SSRF | Reliability / security | Medium | Confirmed code | M |
| M9 | Workout times likely shift with timezone | Bug | Medium | Likely | M |
| M10 | Unpaginated history endpoints and missing indexes | Performance | Medium | Confirmed | M |
| L1 | Dev builds fall back to the production backend URL | Config | Low | Confirmed | S |
| L2 | No 401 handling; `/settings` unprotected; `middleware.ts` renamed in Next 16 | Bug / maintainability | Low | Confirmed | S |
| L3 | `SECRET_KEY` / `ALGORITHM` default to empty strings | Security | Low | Confirmed | S |
| L4 | Duplicate login endpoints | Maintainability | Low | Confirmed | S |
| L5 | DB engine and startup reliability | Reliability | Low | Confirmed / potential | S-M |
| L6 | Containers run as root | Security hardening | Low | Confirmed | S |
| L7 | Persisted active workout not scoped per user | Bug / privacy | Low | Confirmed | S |
| L8 | Demo page redirect misuse; manual demo reset | Bug / ops | Low | Likely | S |
| L9 | Blank toast on form validation errors | Bug / UX | Low | Confirmed | S |
| L10 | Code hygiene items | Maintainability | Low | Confirmed | S |
| L11 | PWA plugin may be inert under Turbopack | Assumption | Low | Potential | S |

## Findings

### High

#### H1. Editing a workout multiplies its duration by 60
- **Category:** Bug / data integrity. **Severity:** High. **Confidence:** Confirmed. **Effort:** S.
- **Evidence:** `frontend/src/app/(dashboard)/workouts/components/WorkoutForm.tsx:70` loads `initialData.duration` (seconds, as returned by the API) straight into a field labelled "Duration (minutes)" (`:222`). `frontend/src/features/workout/actions.ts:33` multiplies by 60 on save. The edit page (`workouts/edit/[workoutId]/page.tsx`) performs no conversion.
- **Problem:** the form treats seconds as minutes when loading, then converts minutes to seconds when saving.
- **Impact:** any edit, even saving without changes, inflates the stored duration 60x and corrupts total-time stats. Workouts already edited are likely wrong in production.
- **Recommended fix:** convert seconds to minutes (rounded) when loading the form; keep x60 on save. Prepare a reviewed data-repair query for rows already edited.

#### H2. Auth cookie expires after about 2.8 hours instead of 7 days
- **Category:** Bug. **Severity:** High. **Confidence:** Confirmed. **Effort:** S.
- **Evidence:** `frontend/src/features/auth/actions.ts:11` sets `maxAge = 60 * 24 * 7` (seconds, = 10,080 s). The backend token lifetime is `ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7` minutes (`backend/app/services/user.py:19`).
- **Impact:** users are logged out roughly every three hours.
- **Recommended fix:** `60 * 60 * 24 * 7`, defined once and shared with the backend setting.

#### H3. Vulnerable dependencies
- **Category:** Security. **Severity:** High. **Confidence:** Confirmed advisories, exploitability varies. **Effort:** S-M.
- **Evidence:** `npm audit --omit=dev` reports 33 advisories (2 low, 7 moderate, 22 high, 2 critical). Direct: `axios@1.16.0` (high; affected range up to 1.19.0; used server-side for every API call) and `next@16.2.6` (advisories include a Server Actions DoS and a proxy bypass for Turbopack with single-locale i18n, which this app does not use; fix is after 16.3.7). The rest are mostly transitive via `shadcn` and `@ducanh2912/next-pwa`. `shadcn` (a CLI) sits in `dependencies` in `frontend/package.json`, pulling the MCP SDK, hono and others into the production install. Backend: `pip-audit` is not installed, so **Python advisories were not checked**; `pip list --outdated` shows `fastapi` 0.136.1 (latest 0.159.1), `starlette` 1.0.0 (1.9.0), `PyJWT` 2.12.1 (2.15.1), `cryptography` 49.0.0 (50.0.2), `bcrypt` 3.1.7, `pywebpush` 2.3.0 (2.5.0).
- **Impact:** known vulnerabilities in the request path; a bloated production dependency tree.
- **Recommended fix:** upgrade `axios` and `next`; move `shadcn` to `devDependencies` (or run via `npx`); `npm audit fix` and review; add `pip-audit` and `npm audit` to CI; bump backend packages after testing.

#### H4. No rate limiting or lockout on login and registration
- **Category:** Security. **Severity:** High. **Confidence:** Confirmed (absence). **Effort:** M.
- **Evidence:** `backend/app/routers/users.py` `/register`, `/login`, `/token`, `/demo` have no throttling; registration is open. Password policy is minimal (`schemas/user.py`: 8-72 chars with a digit, lower and upper case).
- **Impact:** credential stuffing and brute force; bcrypt CPU cost can exhaust an instance and raise Cloud Run costs.
- **Recommended fix:** per-IP and per-email throttling (for example `slowapi`, or Cloud Armor / API gateway rules), consistent error messages, optional lockout/backoff.

### Medium

#### M1. Workout saved, then HTTP 500 if achievement awarding fails
- **Category:** Reliability. **Severity:** Medium. **Confidence:** Likely. **Effort:** S-M.
- **Evidence:** `backend/app/services/workout.py:84-101`: the workout is committed, then `_award_achievements` runs inside the same `try`; any exception calls `rollback()` and re-raises (HTTP 500) although the workout is saved. Same pattern in `update_workout` (`:104-129`). Achievement helpers also commit separately (`services/achievement.py` `_commit_and_serialize`).
- **Impact:** the user sees a failure, retries, and gets a duplicate workout.
- **Recommended fix:** make awarding best-effort (own `try/except` with logging) or part of the same transaction with `commit=False`.

#### M2. No double-submit protection when completing a workout
- **Category:** Bug. **Severity:** Medium. **Confidence:** Likely. **Effort:** S.
- **Evidence:** `frontend/src/app/(dashboard)/workouts/active/components/WorkoutClientProvider.tsx:78-136`: `completeWorkout` has no in-flight guard and is reachable from two buttons; the backend has no idempotency key.
- **Impact:** duplicate workouts on double tap or slow network.
- **Recommended fix:** disable buttons while pending; optionally add a client-generated idempotency key stored server-side.

#### M3. Push subscribe is fire-and-forget
- **Category:** Bug. **Severity:** Medium. **Confidence:** Confirmed. **Effort:** S.
- **Evidence:** `frontend/src/features/notifications/actions.ts:10`: `api.post(...)` is not awaited. The action always returns `success: true`, errors (such as the demo 403) are swallowed and become unhandled rejections, and a server action may finish before the request is sent on serverless.
- **Impact:** users believe reminders are enabled when they are not.
- **Recommended fix:** `await` the call and return the `handleApiError` result.

#### M4. JWT returned to client JS; cookie has no explicit `sameSite`
- **Category:** Security hardening. **Severity:** Medium. **Confidence:** Confirmed. **Effort:** S.
- **Evidence:** `frontend/src/features/auth/actions.ts:30,45,65` return `{ success: true, data: token }` after setting the httpOnly cookie; cookie options (`:12-17`) omit `sameSite`.
- **Impact:** any XSS or malicious script can read the token from the action response, defeating `httpOnly`.
- **Recommended fix:** return `data: null`; set `sameSite: "lax"` explicitly.

#### M5. Server-side input validation gaps
- **Category:** Security / bug. **Severity:** Medium. **Confidence:** Confirmed. **Effort:** M.
- **Evidence:** `backend/app/schemas/user.py` (no `username` length rule; DB columns `username`/`email` are `String(50)`, so longer values fail on PostgreSQL with a 500); `schemas/workout.py` and `schemas/routine.py` (unbounded lists, no limits on reps, weight, duration, `day`, name length; values above int32 error in PostgreSQL); `routers/exercises.py:18-27` (`page`/`limit` unbounded; `page=0` gives a negative offset). `exercise_id` is not validated in workout/routine writes (nonexistent id gives FK 500; duplicate exercise in a routine gives a PK clash 500). Demo quota is enforced on create only, not on `PATCH` with a huge `sets` list.
- **Impact:** 500s on bad input, large-payload abuse, inconsistent error behaviour between SQLite (dev) and PostgreSQL (prod).
- **Recommended fix:** Pydantic `Field`/`conlist` constraints, `Query(ge=1, le=100)`, explicit existence checks, map `IntegrityError` to 400/409.

#### M6. Email not normalised; registration race
- **Category:** Bug. **Severity:** Medium. **Confidence:** Confirmed. **Effort:** S.
- **Evidence:** `backend/app/routers/users.py:14-24`, `services/user.py:76-97`: lookups and inserts are case-sensitive (`A@x.com` and `a@x.com` are different accounts); check-then-insert races surface as a 500 on `IntegrityError`.
- **Impact:** duplicate accounts, confusing logins, intermittent 500s.
- **Recommended fix:** lowercase on write and lookup (plus a data check for existing duplicates); catch `IntegrityError` and return 400.

#### M7. Personal-record `value` is stored as an integer
- **Category:** Bug / data integrity. **Severity:** Medium. **Confidence:** Confirmed schema; runtime effect likely. **Effort:** M.
- **Evidence:** `backend/app/models/achievement.py:50` `value: Mapped[float] = mapped_column(Integer)`; migration `0854434c69c3` creates `sa.Integer()`. The demo fixture validator rejects non-integer weights (`services/demo.py`), suggesting the limitation is known.
- **Impact:** on PostgreSQL, fractional weights and distances (62.5 kg) are rounded, so PR values display wrongly and comparisons (`_record_if_better`) misbehave. SQLite keeps the fraction, hiding the issue in development.
- **Recommended fix:** migration to `Float`, then re-run the achievement backfill (it deletes and rebuilds a user's achievements, so review before running).

#### M8. Reminder worker: timezone, duplicates, broken script, unvalidated push endpoint
- **Category:** Reliability / security. **Severity:** Medium. **Confidence:** Confirmed in code; impact depends on deployment. **Effort:** M.
- **Evidence:** `backend/app/workers/scheduler.py:66-69` uses server `datetime.now()` against user-local naive `Routine.start_time`; the `now..now+1h` window fails across midnight and duplicates if the job runs more than hourly (no dedupe). `backend/worker_start.sh:4` runs `python3 run_reminder.py` but the file is `backend/app/run_reminder.py`. `schemas/notification.py` accepts any `endpoint` string and `scheduler.py` POSTs to it with `webpush` (blind SSRF for any registered user). `scheduler.py:16` hard-codes a personal email in `VAPID_CLAIMS`; debug `print`s throughout.
- **Impact:** reminders at the wrong time, repeated, or never; server-side requests to arbitrary hosts; personal data in source.
- **Recommended fix:** store a user timezone, dedupe with a last-reminded marker, fix the script path, allow-list push-service hosts, move the contact email to an env var, use `logging`.

#### M9. Workout times likely shift with timezone
- **Category:** Bug. **Severity:** Medium. **Confidence:** Likely (not reproduced). **Effort:** M.
- **Evidence:** the client sends `completedAt` as an aware ISO string; the column is naive `DateTime` (`models/workout.py:19`); responses return naive strings; the browser parses them as local time (`WorkoutForm.tsx:67`). Streak maths uses server `date.today()` (`services/workout.py:62`).
- **Impact:** for non-UTC users, times display shifted, each edit round trip shifts again, and day/week boundaries (streaks, calendar) can be wrong.
- **Recommended fix:** store timezone-aware (or consistently UTC with an explicit `Z`) and compute day/week in the user's timezone. Requires a migration and a timezone decision.

#### M10. Unpaginated history endpoints and missing indexes
- **Category:** Performance. **Severity:** Medium. **Confidence:** Confirmed. **Effort:** M.
- **Evidence:** `GET /api/workouts` returns every workout with all sets, exercises and muscles (`services/workout.py:13-19`, `_workout_query`); used by the history page, routine page and calendar. `GET /exercises/{id}/workouts` is also unbounded. No indexes on `workouts.user_id`, `workouts.completed_at`, `workout_sets.workout_id`, `workout_sets.exercise_id`, `routines.user_id`, `user_achievements.user_id` (migrations only index exercise/muscle names, priority, achievement type and the demo flag). The exercise list aggregates all of a user's sets on each call (`services/exercise.py:17-28`).
- **Impact:** response time and memory grow with usage; PostgreSQL does not index foreign keys automatically.
- **Recommended fix:** add the indexes (migration), add limit/date-range parameters, return a slimmer calendar payload.

### Low

#### L1. Dev builds fall back to the production backend URL
`frontend/src/lib/axios.ts:5-7` defaults to the production Cloud Run URL when `NEXT_PUBLIC_BASE_URL` and `BASE_URL` are unset, so a misconfigured local run reads and writes production data. Fix: fail fast outside production.

#### L2. No 401 handling; `/settings` unprotected; middleware renamed in Next 16
No code redirects to login on API 401 (searched `src/`). `frontend/src/middleware.ts:8-14` omits `/settings` from `protectedPaths` and lists `/stats`, which does not exist. Next 16 renamed Middleware to Proxy (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Fix: handle 401 centrally, fix the path list, rename to `proxy.ts`, treat it as an optimistic check only.

#### L3. `SECRET_KEY` / `ALGORITHM` default to empty strings
`backend/app/services/user.py:17-18`. A missing env var would sign tokens with an empty key (or fail obscurely). Tests use an 11-byte key and trigger `InsecureKeyLengthWarning`. Fix: require both at startup, restrict the algorithm to an allow-list, enforce key length of 32 or more.

#### L4. Duplicate login endpoints
`/api/auth/login` (JSON, 401) and `/api/auth/token` (form, 400) in `routers/users.py` duplicate logic with different status codes and messages. Fix: keep `/token` only if OAuth2 docs auth is needed, delegate both to one service function.

#### L5. DB engine and startup reliability
`backend/app/database.py` has no `pool_pre_ping`, pool sizing or connect timeout for a managed PostgreSQL. `backend/start.sh` runs `alembic upgrade head` on every instance start (concurrent starts can race). `main.py:33` uses deprecated `@app.on_event("startup")` and seeds achievements on every boot (visible in the pytest deprecation warning).

#### L6. Containers run as root
Neither `backend/Dockerfile` nor `frontend/Dockerfile` sets `USER`; the backend final image keeps `gcc` and `libpq-dev`. Fix: non-root user, multi-stage build.

#### L7. Persisted active workout is not scoped per user
`frontend/src/features/workout/store.ts` persists `workout-storage` in localStorage; `logoutAction` / `LogoutButton` do not clear it. On a shared device the next user can resume and submit it. `WorkoutClientProvider.tsx:36-48` prefers stored data over the routine passed in.

#### L8. Demo page redirect misuse; manual demo reset
`frontend/src/app/demo/page.tsx:18` calls `redirect()` inside an async effect, which Next documents as render-time only; use `router.push`. The demo reset is manual (`seed_demo.py`), and the streak lapses if it is not run weekly (see `docs/specs/public-demo-mode.md`); the banner says "reset regularly".

#### L9. Blank toast on form validation errors
`WorkoutForm.tsx:194` shows `toast.error(response.error)`, which is `undefined` when the backend returns validation errors (they are in `errors`). `ActionResponse.errors` is also typed as an array but the backend may return a string `detail` (`apiTypes.ts`, `axios.ts:handleApiError`).

#### L10. Code hygiene
`console.log` in `features/analytics/init.ts:7-8`; hard-coded PostHog fallback key (public by design but belongs in env); hard-coded VAPID public key (`features/notifications/utils.ts`); unused `pprint` import (`routers/exercises.py:12`); `models/achievement.py:8` imports the Pydantic `Exercise` instead of the model; `schemas/achievement.py` bypasses the camelCase `BaseModel`; bare `except:` in `services/routine.py:101,122`; `pytest` in production `requirements.txt`; unbounded `GET /notifications`; `Notification`/`NotificationSubscription` foreign keys lack `ondelete`; `ILIKE` search does not escape `%` and `_`.

#### L11. PWA plugin may be inert under Turbopack (unverified)
`frontend/next.config.ts` configures `@ducanh2912/next-pwa` with aggressive navigation caching alongside `turbopack: {}`. I did not build, so I could not confirm whether the plugin runs; the committed `public/sw.js` is a hand-written push worker. Verify before relying on offline behaviour or worrying about cached authenticated pages.

## Testing and CI

- Backend: 25 tests, all for the demo feature (`backend/tests/test_demo.py`); all pass. None cover auth, workout/routine CRUD, cross-user authorization, streak and PR logic, or the reminder worker.
- Frontend: no tests.
- CI: no `.github/` directory, although both `.dockerignore` files reference it. No lint, type-check, audit or test automation was found.
- `ruff`, `mypy` and `pytest` configuration files are absent.

## Checks not performed

- `npm run lint`, `tsc` and `npm run build` (would write build output).
- Python dependency vulnerability scan (`pip-audit` unavailable).
- Production configuration (Cloud Run env vars, Cloud SQL settings, the scheduler that triggers the reminder job).
- Behaviour on PostgreSQL (all runtime checks were SQLite); M7 and M9 were not reproduced.
- Accessibility, visual and mobile layout review.

## Remediation roadmap

**1. Fix immediately** (small, mostly independent): H1, H2 with M4 (same file), M3, H3 (frontend part), M1 with M2.

**2. Fix next:** H4 with L3; M5 with M6; M10 indexes first, then pagination; backend dependency bump (H3 remainder); CI and core tests (auth, authorization, CRUD).

**3. Schedule:** M7 (migration then backfill); M9 together with M8 (timezone design, worker fixes); L2, L5-L9.

**4. Optional:** L10 clean-ups, L4, structured logging, enable Sentry (already in requirements), automate the demo reset, L11 check.

Suggested order and dependencies are in [`docs/specs/audit/README.md`](../specs/audit/README.md).
