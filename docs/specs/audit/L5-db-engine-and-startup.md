# L5. DB engine and startup reliability

> **Status:** Proposed · **Severity:** Low · **Type:** Reliability · **Confidence:** Confirmed (code); production impact potential · **Effort:** S-M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l5-db-engine-and-startup-reliability)

## Problem
- `backend/app/database.py:15-21`: the PostgreSQL engine uses defaults: no `pool_pre_ping` (stale connections after Cloud SQL restarts or idle timeouts fail the first request), no `pool_size`/`max_overflow` tuned to Cloud Run concurrency and the DB connection limit, no `connect_timeout`, no `pool_recycle`.
- `backend/start.sh:3-8`: every container start runs `alembic upgrade head`; when several instances start together (scale-out, rollout) they race on the same migration. A failing migration also prevents the app from starting at all.
- `backend/app/main.py:33`: `@app.on_event("startup")` is deprecated (FastAPI/Starlette warns in test output) and `seed_achievements` runs and commits on every boot.
- `start.sh` uses `python3 -m uvicorn ... --port 8080` with defaults: no `--proxy-headers`, no worker or timeout settings (relevant to [H4](H4-auth-rate-limiting.md)).

## Goal
Resilient database connections and a predictable startup and migration path.

## Non-goals
Moving off Cloud Run or changing databases.

## Proposed change
- Engine: `create_engine(..., pool_pre_ping=True, pool_recycle=1800, pool_size=5, max_overflow=5, connect_args={..., "connect_timeout": 10})`, sized from env (`DB_POOL_SIZE`), keeping SQLite args as they are.
- Migrations: run `alembic upgrade head` as a one-off Cloud Run Job (or pre-deploy step) instead of in `start.sh`; keep `start.sh` migration for local development behind an env flag (`RUN_MIGRATIONS=true`).
- Replace `on_event` with a FastAPI `lifespan` context manager; seed achievements only when missing (it already checks by type) and keep it idempotent.
- Add `--proxy-headers --forwarded-allow-ips` (trusted proxy) to uvicorn for correct client IPs.

## Acceptance criteria
- No deprecation warning from `on_event` in `pytest`.
- App survives a DB restart without a failed request burst (`pool_pre_ping`).
- Deploy with two simultaneous instances does not run migrations twice.

## Test plan
Run `pytest`; test locally with SQLite and against a local PostgreSQL; simulate a dropped connection.

## Risks / rollout
Moving migrations out of `start.sh` requires the deploy pipeline change first; do it in staging. Pool sizes that exceed the DB limit cause connection errors.

## Dependencies
Related to [L3](L3-secret-key-fail-fast.md) (shared settings module).
