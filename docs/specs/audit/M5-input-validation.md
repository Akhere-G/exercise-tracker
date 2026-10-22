# M5. Server-side input validation gaps

> **Status:** Proposed · **Severity:** Medium · **Type:** Security / bug · **Confidence:** Confirmed · **Effort:** M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m5-server-side-input-validation-gaps)

## Problem
Pydantic schemas validate shape but not size or range, so bad or hostile input reaches the database:
- `backend/app/schemas/user.py`: `username` has no min/max length; the column is `String(50)`, and `email` is also `String(50)` while `EmailStr` allows up to 254 characters. SQLite (dev) does not enforce `String` length, PostgreSQL (prod) raises `DataError` -> 500.
- `schemas/workout.py`: `sets` is an unbounded list; `reps`, `weight`, `distance_meters`, `duration_secs`, `set_index`, `duration` have no bounds (negatives, `inf`, values above int32 -> DB error).
- `schemas/routine.py`: `name` unbounded (column `String(255)`), `day` not limited to 0-6, `target_sets`/`target_reps`/`order` unbounded, `routine_items` unbounded.
- `routers/exercises.py:18-27`: `page` and `limit` unbounded; `page=0` yields a negative offset (PostgreSQL error); `limit=1000000` is accepted.
- `exercise_id` in workout sets and routine items is not checked: a nonexistent id raises an FK error (500); the same exercise twice in a routine violates the composite primary key (500).
- Demo quota (`services/demo.py:is_quota_exceeded`) is applied on create only; `PATCH` with a huge `sets` list is not limited.

## Goal
Invalid input returns 422/400/409 with a clear message on every database; no payload can create unbounded work.

## Non-goals
Changing business rules (what a valid workout is) beyond bounds.

## Proposed change
- Schemas: `Field(min_length=1, max_length=50)` for `username`; `email` max 50 (or widen the column in a migration; prefer the limit to match the column); `max_length` on `sets` (for example 500) and `routine_items` (for example 100); `ge/le` on numeric fields (`reps` 0-10,000; `weight` 0-10,000 and finite; `duration_secs` 0-86,400; `distance_meters` 0-1,000,000; `day` 0-6; `target_sets` 1-100; `duration` 0-86,400).
- Router: `page: int = Query(1, ge=1)`, `limit: int = Query(10, ge=1, le=100)`.
- Services (`services/workout.py`, `services/routine.py`): verify all `exercise_id`s exist with one `select(Exercise.id).where(Exercise.id.in_(...))` (reuse the pattern in `achievement._get_exercises`); reject duplicates in routine items; raise `HTTPException(400/404)`-mapped errors from the router.
- Catch `IntegrityError`/`DataError` in services and return 409/400 instead of 500.
- Apply the demo cap on `PATCH` too (limit the `sets` length for demo users).
- Escape `%` and `_` in `ilike` search terms (`services/exercise.py:45,51,57`).
- Mirror the key limits in the frontend Yup schemas (`features/*/schema.ts`) for earlier feedback.

## Acceptance criteria
- Each case above returns a 4xx with a readable detail on both SQLite and PostgreSQL; no 500s.
- Existing demo tests still pass; valid payloads are unchanged.

## Test plan
Add API tests (see [CI and core tests](README.md#ci-and-core-tests)): oversize username/email, negative weight, 10k-set payload, nonexistent and duplicate exercise ids, `page=0`, `limit=1000`.

## Risks / rollout
Limits that are too tight reject real data; choose generous bounds and check existing rows (`SELECT max(...)`) first.

## Dependencies
Group with [M6](M6-email-normalisation.md). Tests depend on the CI/test setup.
