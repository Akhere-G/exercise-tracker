# M7. Personal-record `value` is stored as an integer

> **Status:** Proposed · **Severity:** Medium · **Type:** Bug / data integrity · **Confidence:** Confirmed (schema); runtime effect likely (not tested on PostgreSQL) · **Effort:** M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m7-personal-record-value-is-stored-as-an-integer)

## Problem
`backend/app/models/achievement.py:50`: `value: Mapped[float] = mapped_column(Integer, nullable=True)`; the migration `0854434c69c3_add_achievement_system.py:53` creates `sa.Integer()`. The service stores floats (`check_and_award_prs` uses `weight` and `distance_meters`, which are `Float`). SQLite stores the fraction in an INTEGER-affinity column, PostgreSQL rounds on assignment. Consequences in production: a 62.5 kg PR displays as 63 (or 62), and `_record_if_better` (`value <= existing.value`) compares against the rounded value so some real improvements are missed or recorded as ties. `services/demo.py` rejects non-integer weights in the fixture, which suggests the limit is known.

## Goal
PR values keep their precision on every database.

## Non-goals
Revoking achievements when a workout is edited or deleted (separate design question: `workout_id` becomes `NULL` on delete and the PR remains).

## Proposed change
1. Model: `mapped_column(Float, nullable=True)`.
2. Alembic migration (autogenerate then review): `batch_alter_table` (for SQLite) to alter `user_achievements.value` to `Float`. On PostgreSQL this is a plain `ALTER COLUMN ... TYPE double precision`.
3. After the migration, rebuild stored values from workout history using `achievement_service.backfill_user_achievements` (via `backfill_achievements.py`). **Note:** the backfill deletes and re-creates each user's achievements, which also resets `unlocked_at`. Review whether that is acceptable, test on a copy, and consider a narrower repair (update `value` from the underlying set data) instead.
4. Remove the integer-only restriction in the demo fixture validator only if desired (optional).

## Acceptance criteria
- Logging a 62.5 kg set creates a PR with value 62.5 on PostgreSQL and SQLite.
- A later 62.6 kg set registers as a new PR.
- Migration upgrades and downgrades cleanly (the existing `test_migration_downgrade_and_upgrade` should still pass).

## Test plan
Unit test in `backend/tests/` using the `db` fixture: log fractional PRs and assert stored values; run the same against a local PostgreSQL if available.

## Risks / rollout
Backfill is destructive per user; run on a copy first and take a backup. Run in a maintenance window.

## Dependencies
Related: [M1](M1-achievement-failure-after-commit.md). Independent otherwise.
