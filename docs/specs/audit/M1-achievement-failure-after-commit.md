# M1. Workout saved, then HTTP 500 if achievement awarding fails

> **Status:** Proposed · **Severity:** Medium · **Type:** Reliability · **Confidence:** Likely (not reproduced) · **Effort:** S-M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m1-workout-saved-then-http-500-if-achievement-awarding-fails)

## Problem
`backend/app/services/workout.py:84-101` (`create_workout`): the workout is committed, then `_award_achievements` runs inside the same `try`. Any exception there triggers `db.rollback()` and re-raises, so the API returns 500 although the workout row is already persisted. `update_workout` (`:104-129`) has the same shape. The achievement helpers in `services/achievement.py` also commit on their own (`_commit_and_serialize`), so awarding is not atomic with the workout either. The frontend shows "Could not save workout" and keeps the local state, so the user retries and creates a duplicate.

## Goal
A committed workout always returns success; achievement problems are logged and never surface as a failed save.

## Non-goals
Changing PR/streak rules, or making achievements transactional with the workout (a larger redesign).

## Proposed change
- In `services/workout.py`, call `_award_achievements` after the workout commit outside the main `try`/`except` that rolls back, wrapped in its own `try/except Exception` that calls `db.rollback()` and `logger.exception(...)`.
- Return the refreshed workout regardless (`db.refresh(workout)` after the rollback to avoid expired state).
- Add a module logger (`logging.getLogger(__name__)`), consistent with `workers/scheduler.py`.
- Keep `backfill_user_achievements` as the repair path for missed awards (`backfill_achievements.py`; review before running because it deletes and rebuilds a user's achievements).

## Acceptance criteria
- Forcing `check_and_award_prs` to raise still returns 201 for create and 200 for update, with the workout persisted and an error logged.
- No duplicate workout is created by a single request.

## Test plan
Backend tests (use the existing `db`/`engine` fixtures in `tests/conftest.py`): monkeypatch `achievement_service.check_and_award_prs` to raise; assert the workout exists and the call does not raise. Repeat for update.

## Risks / rollout
Silent achievement gaps if the failure is persistent; mitigate with logging/Sentry (already in requirements, not initialised: see [L10](L10-code-hygiene.md)).

## Dependencies
Group with [M2](M2-double-submit-workout.md). Related: [M7](M7-achievement-value-float.md).
