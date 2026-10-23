# Gains

Gains is a full-stack fitness tracker. Build routines, log workouts as you train, and follow your progress through history, personal records and achievements.

**[Live deployment](https://exercise-tracker-frontend-752853711822.europe-west1.run.app/exercises/2330)**

## Features

- **Routines:** plan workouts with exercises, target sets and a weekly schedule. Start times are stored in UTC and shown in your local time.
- **Live workouts:** log sets, reps, weight and rest in an active session that survives a page refresh, then review a summary when you finish.
- **History:** a calendar of past workouts, loaded one month at a time, with editing of any logged workout.
- **Exercise library:** search the exercises, see your past performance for each one and your estimated 1-rep max over time.
- **Achievements and personal records:** streaks and records are awarded when a workout is saved.
- **Reminders:** optional web push notifications before a scheduled routine.
- **Demo mode:** a shared demo account so visitors can try the app without registering (off by default).

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 16 (App Router, server actions), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic |
| Database | SQLite for development, PostgreSQL in production |
| Auth | JWT stored in an httpOnly cookie, bcrypt password hashing |
| Other | slowapi rate limiting (optional Redis), pywebpush reminders, PostHog analytics |

## Project structure

```text
backend/    FastAPI app (routers, services, models, schemas), Alembic migrations, tests
frontend/   Next.js app (src/app routes, src/features per feature, src/components shared UI)
```

See [AGENTS.md](AGENTS.md) for the coding conventions.

## Running locally

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
# create backend/.env with the variables below (SECRET_KEY and ALGORITHM are required)
alembic upgrade head
python3 -m uvicorn app.main:app --port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend reads `NEXT_PUBLIC_BASE_URL` (or `BASE_URL`) for the API address. Set it to `http://localhost:8080/api` for local development; if neither is set it falls back to the deployed backend.

## Configuration

Backend variables, read from the environment or `backend/.env`:

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `SECRET_KEY` | yes | JWT signing key, at least 32 characters |
| `ALGORITHM` | yes | `HS256`, `HS384` or `HS512` |
| `DATABASE_URL` | no | Defaults to a local SQLite file |
| `DB_CA_CERT_PATH` | no | CA certificate for PostgreSQL connections |
| `FRONTEND_ORIGIN` | no | Allowed CORS origin, defaults to `http://localhost:3000` |
| `DEMO_MODE_ENABLED` | no | `true` enables `POST /api/auth/demo` |
| `TRUSTED_PROXY_COUNT` | no | Turns on per-IP rate limiting for the auth routes; set it to the number of proxies in front of the API |
| `REDIS_URL` | no | Shared storage for rate limits across instances, in-memory otherwise |
| `VAPID_PRIVATE_KEY` | no | Needed to send push reminders |

Frontend variables: `NEXT_PUBLIC_BASE_URL`, `BASE_URL`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`.

Never commit `.env` files.

## Testing

| Level | Tool | Command | Covers |
| --- | --- | --- | --- |
| Backend unit + integration | pytest | `cd backend && python -m pytest` | Streaks, personal bests, schema validation, auth and access control, persistence and integrity, error handling |
| Frontend unit | Vitest | `cd frontend && npm test` | Volume, estimated 1RM, formatting helpers, Yup schemas, `handleApiError`, server actions, route protection |
| Frontend integration | Vitest + Testing Library | `cd frontend && npm test` | Active workout with the real Zustand store, localStorage persistence and recovery, failed saves, routine form |
| End to end | Playwright (Chromium) | `cd frontend && npm run e2e` | Sign-in, creating a routine, logging and completing a workout, progress pages, recovery after reload |

Other checks: `cd frontend && npm run lint && npm run typecheck && npm run build`.

**Isolation.** Backend tests run on in-memory SQLite and set `DATABASE_URL` before the app is imported, so they never touch a real database. The E2E run starts its own backend on a throwaway SQLite file (`frontend/e2e/.tmp/e2e.db`, recreated each run) and its own frontend build in `.next-e2e`, on ports 8765 and 3100. It ignores `backend/.env` (Redis, rate limiting, demo mode) and blocks the PostHog and exercise-image hosts, so it does not disturb a running `npm run dev`.

**First-time E2E setup.** Run `npx playwright install chromium` once. The backend needs its dependencies installed (`backend/.venv` is used if present, otherwise set `E2E_PYTHON`). The first run builds the frontend, so allow a few minutes.

**What is mocked.** Frontend tests replace only external boundaries: the axios transport (`tests/apiStub.ts`), Next's router and cookies, toasts, and the exercise-picker drawer in the routine form test. Zustand, localStorage, validation and the components under test are real. Server Components cannot be rendered by Vitest, so they are covered by the E2E specs.

**Offline behaviour.** There is no offline queue. The active workout is saved to localStorage after every change and restored on reload or after closing the browser. Corrupt saved data is ignored and the workout restarts from its routine. If saving to the API fails, the session stays on the device and the user can retry.

### Known issues

Found while writing the suite and deliberately left unfixed:

- Backend: achievement `value` is an integer column but holds floats (matters on PostgreSQL); streak backfill uses today's date, so old history gets no streak achievements; a notification subscription endpoint can be taken over by another user; the reminder job misses the 23:00-midnight window and re-sends on repeated runs; datetimes are stored naive; workout lists are unordered; `get_exercises` combines `DISTINCT` with an `ORDER BY` that PostgreSQL may reject; sets are not checked against the exercise's metrics; `/auth/token` returns 400 where `/auth/login` returns 401; empty `sets` and `routineItems` are accepted on update paths; duplicate-workout detection is a check-then-insert, so two simultaneous identical requests can both succeed.
- Frontend: the calendar buckets workouts by UTC date but renders local dates; `removeExercise` in the active workout always picks the first exercise (operator precedence); `StoredWorkout` never clears its timer on unmount; the demo page spins forever if demo login fails; the login page ignores `callbackUrl`; "Max pace" shows the slowest pace; the exercise-picker `addExercises` throws if nothing is selected for an empty workout.

## Reminders

The reminder job sends a push notification for routines starting within the next hour. Run it from `backend/` on a schedule, for example every hour:

```bash
python3 -m app.run_reminder
```

## API

The backend serves interactive docs at `/docs` while it is running.
