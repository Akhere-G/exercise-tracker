# M9. Workout times likely shift with timezone

> **Status:** Proposed (needs a design decision) · **Severity:** Medium · **Type:** Bug · **Confidence:** Likely (not reproduced) · **Effort:** M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m9-workout-times-likely-shift-with-timezone)

## Problem
- The frontend sends `completedAt` as `Date` -> ISO string with `Z` (UTC).
- Backend: `Workout.completed_at` is a naive `DateTime` (`models/workout.py:19`); `WorkoutBase.completed_at: datetime` is accepted aware. PostgreSQL converts an aware value to a naive timestamp using the session timezone (typically UTC); SQLite stores the UTC wall clock.
- The API serialises naive datetimes with no offset (for example `2026-10-21T09:00:00`). Browsers parse that as local time (`new Date(initialData.completedAt)`, `WorkoutForm.tsx:67`), so for a user at UTC+1 a workout completed at 10:00 local displays as 09:00, and editing and saving shifts it by another hour each time.
- Day and week grouping (calendar, `_week_start`, `date.today()` in `services/workout.py:62,76,194`) uses the server date and UTC wall clock, so late-evening or early-morning workouts can land on the wrong day or week for non-UTC users, affecting streaks and achievements.

(Not reproduced; test in a browser with a non-UTC timezone before changing anything.)

## Goal
A workout shows the time the user logged, never shifts on edit, and streak/week boundaries follow the user's timezone.

## Non-goals
Rewriting historical data without review.

## Proposed change
Decide the model first (recommended): store UTC with timezone awareness and keep the user's IANA timezone for day/week maths.
1. Migration: `workouts.completed_at` to `DateTime(timezone=True)` (treat existing naive values as UTC); same for other user-visible timestamps if displayed (`unlocked_at`).
2. Serialisation: return ISO strings with offset/`Z` (aware datetimes), so browsers convert correctly.
3. Add `users.timezone` (shared with [M8](M8-reminder-worker.md)); thread the user's timezone into `get_stats`, `calculate_current_frequency_streaks`, `_recent_week_counts` (replace `date.today()` and `completed_at.date()` with the user-local date).
4. Frontend: no manual offset handling; keep `new Date(isoWithZ)`, and `datetime-local` conversion helpers (`toDatetimeLocal`) in `workoutFormUtils.ts` should format in local time.

## Acceptance criteria
- Creating a workout at 23:30 local (UTC+1 and UTC-8 test timezones) shows 23:30 in history, edit form and summary, and stays after saving the edit form unchanged.
- Weekly streaks respect the user's Monday boundary.
- Existing tests (frozen date fixtures) are updated, and new tests cover timezones.

## Test plan
Backend unit tests with injected timezones for streak/week functions; manual browser tests with `resize_window`/timezone override (devtools Sensors) for create/edit.

## Risks / rollout
Schema and semantics change; take a backup, run the migration in staging, and compare a sample of rows before and after. Do together with the frontend change.

## Dependencies
Shares the timezone design with [M8](M8-reminder-worker.md); touches the same form as [H1](H1-edit-workout-duration.md) (ship H1 first).
