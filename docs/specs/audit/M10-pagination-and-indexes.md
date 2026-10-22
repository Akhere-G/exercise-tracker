# M10. Unpaginated history endpoints and missing indexes

> **Status:** Proposed · **Severity:** Medium · **Type:** Performance · **Confidence:** Confirmed · **Effort:** M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m10-unpaginated-history-endpoints-and-missing-indexes)

## Problem
- `GET /api/workouts` (`routers/workouts.py:27-33`, `services/workout.py:13-19`) returns every workout of the user with all sets, each set's exercise, the exercise's muscles and each muscle (`_workout_query`, four chained `selectinload`s). It is called by `workouts/(history)/page.tsx`, `routines/[routineId]/page.tsx` and the calendar. `GET /api/exercises/{id}/workouts` is also unbounded. Payload, queries and memory grow linearly with history; each set embeds the full exercise (instructions text, image URLs) repeatedly.
- No indexes on the hot foreign keys and filters: `workouts.user_id`, `workouts.completed_at`, `workouts.routine_id`, `workout_sets.workout_id`, `workout_sets.exercise_id`, `routines.user_id`, `user_achievements.user_id` / `(achievement_id, exercise_id)`, `notifications.user_id`, `notification_subscriptions.user_id`. PostgreSQL does not create indexes for foreign keys. Existing indexes are only on exercise/muscle names, exercise priority, achievement type and the demo flag.
- `services/exercise.py:get_exercises` aggregates all of a user's sets (`usage` subquery) on every list/search call.

## Goal
Response time stays flat as a user's history grows.

## Non-goals
Changing the response shape for existing consumers without a migration path.

## Proposed change
1. **Indexes (do first, low risk):** add `index=True` (or composite `Index`) in the models and generate/review an Alembic migration: `workouts(user_id, completed_at)`, `workouts(routine_id)`, `workout_sets(workout_id)`, `workout_sets(exercise_id)`, `routines(user_id)`, `user_achievements(user_id)`, `notifications(user_id)`, `notification_subscriptions(user_id)`. On PostgreSQL create concurrently if tables are large (autogenerate does not; edit the migration).
2. **Pagination / filtering:** add optional `limit` (default 50, max 200), `offset` or a `before` cursor, and `from`/`to` date parameters to `GET /api/workouts`; keep the default response compatible for existing pages by having callers pass the range they need (calendar: current month +/- 1; history: infinite list).
3. **Slimmer payloads:** a lightweight workout summary schema for lists (no embedded instructions; exercise id and name only), with the full shape only on `GET /workouts/{id}`. Reuse the `ExerciseResponseSimple` idea in `schemas/exercise.py`.
4. **Exercise usage:** if the exercise list is slow after indexing, precompute per-user usage (materialised counts) or cache per request.
5. Check query plans with `EXPLAIN ANALYZE` on a production-sized copy before and after.

## Acceptance criteria
- `EXPLAIN` shows index scans for the user's workouts and sets queries.
- With a seeded user of 2,000 workouts, history and calendar pages respond within an agreed budget (for example under 300 ms server time) and transfer less than 200 KB.
- Existing frontend pages render the same data.

## Test plan
Seed script for a large user (use the demo fixture generator pattern in `services/demo.py`); API tests for `limit`/`from`/`to`; before/after timing recorded in the spec.

## Risks / rollout
Index creation locks tables briefly on PostgreSQL without `CONCURRENTLY`; run off-peak. API changes must be backward compatible for the deployed frontend, so ship backend first, then frontend.

## Dependencies
Indexes can ship independently and first. Pagination should follow [M5](M5-input-validation.md) (bounded `limit` pattern).
