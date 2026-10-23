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

```bash
cd backend && python -m pytest
cd frontend && npm run lint && npm run build
```

GitHub Actions runs the same checks, plus an advisory dependency audit, on every pull request.

## Reminders

The reminder job sends a push notification for routines starting within the next hour. Run it from `backend/` on a schedule, for example every hour:

```bash
python3 -m app.run_reminder
```

## API

The backend serves interactive docs at `/docs` while it is running.
