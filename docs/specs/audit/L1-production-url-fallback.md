# L1. Dev builds fall back to the production backend URL

> **Status:** Proposed · **Severity:** Low · **Type:** Config · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l1-dev-builds-fall-back-to-the-production-backend-url)

## Problem
`frontend/src/lib/axios.ts:5-7`: `baseURL = NEXT_PUBLIC_BASE_URL || BASE_URL || "https://exercise-tracker-backend-752853711822.europe-west2.run.app/api"`. If both env vars are missing (fresh clone, CI, a typo), local development silently reads and writes the production API.

## Goal
A missing configuration fails loudly in development and CI; production behaviour is unchanged.

## Non-goals
Changing how env vars are supplied (Cloud Run, `.env`).

## Proposed change
- Remove the hard-coded URL; if neither variable is set, throw an error at module load when `NODE_ENV !== "production"` (and log a clear error in production).
- Add `frontend/.env.example` (the `.dockerignore` already keeps `.env.example`) listing `BASE_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` with local defaults (`http://localhost:8080/api`); same for `backend/.env.example`.
- Confirm the production deploy sets one of the variables (Cloud Run env not visible to this audit) before removing the fallback.

## Acceptance criteria
- `npm run dev` without env vars shows a clear configuration error; with `.env.example` copied it works against the local backend.
- Production build/deploy still reaches the production API.

## Test plan
Run dev with and without env vars; confirm in a preview deployment.

## Risks / rollout
If production relies on the fallback, removing it breaks the site; verify the Cloud Run configuration first.

## Dependencies
None.
