# L6. Containers run as root

> **Status:** Proposed · **Severity:** Low · **Type:** Security hardening · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l6-containers-run-as-root)

## Problem
- `backend/Dockerfile`: single stage on `python:3.11-slim`; installs `gcc` and `libpq-dev` into the final image; no `USER` directive, so uvicorn runs as root; `COPY . .` copies tests, seed scripts and the demo fixture into the image (secrets are excluded by `.dockerignore`: `.env`, `.env.*`, `*.db`).
- `frontend/Dockerfile`: the runner stage (`node:20-alpine`) has no `USER`; uses legacy `ENV key value` syntax (`ENV NODE_ENV production`).
- `psycopg2-binary` is used, so `gcc`/`libpq-dev` are not needed at runtime.

## Goal
Run both services as an unprivileged user with a smaller image.

## Non-goals
Image signing, SBOMs or a distroless migration.

## Proposed change
- Backend: create a non-root user (`useradd -r -u 10001 app`), `chown` `/app`, `USER app`; drop `gcc`/`libpq-dev` (psycopg2-binary needs neither) or use a build stage; add `requirements-dev.txt` split so `pytest` is not installed (see [L10](L10-code-hygiene.md)); keep `chmod +x start.sh`.
- Frontend: add `USER node` (alpine image has it) in the runner stage after copying files with `--chown=node:node`; switch to `ENV NODE_ENV=production`, `ENV PORT=3000`, `ENV HOSTNAME=0.0.0.0`.
- Keep `.dockerignore` entries; add `tests/` to the backend ignore list if tests are not needed in the image.

## Acceptance criteria
- `docker build` succeeds for both images; containers run as non-root (`docker run --rm image id`).
- App starts and serves requests on 8080 and 3000; migrations still run if enabled (see [L5](L5-db-engine-and-startup.md)).

## Test plan
Build and run locally with Docker; hit `/` health check and the frontend home page.

## Risks / rollout
File permission problems (write access to `/app` for SQLite in dev only; production uses PostgreSQL). Test a preview revision on Cloud Run.

## Dependencies
Independent.
