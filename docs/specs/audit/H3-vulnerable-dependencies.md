# H3. Vulnerable dependencies

> **Status:** Proposed · **Severity:** High · **Type:** Security · **Confidence:** Confirmed (advisories); exploitability varies · **Effort:** S-M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#h3-vulnerable-dependencies)

## Problem
- `npm audit --omit=dev` in `frontend/`: 33 advisories (2 low, 7 moderate, 22 high, 2 critical).
  - Direct: `axios@1.16.0` (high; affected up to 1.19.0) and `next@16.2.6` (critical-rated advisories including a Server Actions DoS, an SSRF in Server Actions on custom servers, and a proxy bypass for Turbopack with single-locale i18n; fixed after 16.3.7). This app uses Server Actions and `middleware.ts` but no i18n and no custom server, so the bypass and SSRF do not apply as configured; the DoS may.
  - Transitive: mostly through `shadcn` (MCP SDK, hono, express-style packages) and `@ducanh2912/next-pwa` (glob/micromatch/brace-expansion chain). `proxy-addr` (critical) and others come from this tree.
  - `shadcn` is a CLI but is listed in `dependencies`, so it ships in the production install.
- Backend: Python advisories **not checked** (`pip-audit` not installed). `pip list --outdated` shows `fastapi` 0.136.1 (latest 0.159.1), `starlette` 1.0.0 (1.9.0), `PyJWT` 2.12.1 (2.15.1), `cryptography` 49.0.0 (50.0.2), `pywebpush` 2.3.0 (2.5.0), `aiohttp` 3.14.1 (3.14.5), `bcrypt` 3.1.7 (5.0.0), `python-multipart` 0.0.27 (0.0.32). `passlib` 1.7.4 is unmaintained; `bcrypt` 4+/5 breaks passlib's version probing, so do not bump `bcrypt` without testing.

## Goal
No known high/critical advisories in production dependencies that are reachable in this app; a repeatable check in CI.

## Non-goals
Replacing `passlib`; major-version upgrades of FastAPI/SQLAlchemy beyond what advisories require.

## Proposed change
Frontend (`frontend/package.json`):
1. Upgrade `axios` to the latest 1.x and `next` / `eslint-config-next` to the latest patched 16.x (keep both at the same version).
2. Move `shadcn` to `devDependencies` (components are already generated; `components.json` stays). Rebuild the lockfile.
3. Run `npm audit fix` (no `--force`) and review each change; re-run `npm audit --omit=dev` and record what remains with a reason.
4. Run `npm run lint` and `npm run build`.

Backend (`backend/requirements.txt`):
1. Install and run `pip-audit -r requirements.txt` in a throwaway venv; record the results in this spec.
2. Bump packages with advisories, plus `fastapi`/`starlette`/`PyJWT`/`cryptography`/`pywebpush` minors; keep `bcrypt` pinned below the passlib-incompatible range unless tested.
3. Move `pytest` to a `requirements-dev.txt`.
4. Run `pytest` in `backend/`.

CI: see [CI and core tests](README.md#ci-and-core-tests); add `npm audit --omit=dev --audit-level=high` and `pip-audit` jobs.

## Acceptance criteria
- `npm audit --omit=dev --audit-level=high` exits 0, or each remaining advisory is documented as not reachable.
- `pip-audit` reports no known vulnerabilities (or documented exceptions).
- `npm run build` and `pytest` pass; login, create workout and push-subscribe smoke-tested.

## Test plan
Run lint, build and the backend test suite; smoke test the auth cookie, a server action (create routine), and the Axios error path.

## Risks / rollout
Next patch upgrades occasionally change behaviour of server actions or caching; deploy to a preview revision first. `axios` 1.x bumps are low risk.

## Dependencies
Pairs with the CI work; independent of other fixes.
