# H1. Editing a workout multiplies its duration by 60

> **Status:** Proposed · **Severity:** High · **Type:** Bug / data integrity · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#h1-editing-a-workout-multiplies-its-duration-by-60)

## Problem
`WorkoutForm.tsx:70` loads `initialData.duration` (seconds from the API) into a field labelled "Duration (minutes)" (`:222`). `features/workout/actions.ts:33` multiplies by 60 on update. The edit page (`workouts/edit/[workoutId]/page.tsx`) passes the API workout as `initialData` with no conversion. Every save of an edited workout therefore stores `seconds * 60`.

## Goal
Duration round-trips correctly: a workout saved with 3,600 s shows 60 minutes in the form and is stored as 3,600 s after saving unchanged.

## Non-goals
Changing the stored unit (stays seconds) or the create flow (`createWorkout` receives seconds from the live timer and must not be multiplied).

## Proposed change
- `frontend/src/app/(dashboard)/workouts/components/WorkoutForm.tsx:70`: `setValue("duration", Math.round((initialData.duration ?? 0) / 60))`.
- Keep `duration * 60` in `updateWorkout` (`features/workout/actions.ts:33`). Check that the form is not also used for create with a seconds value; the only callers found are the edit page (`submitAction` -> `updateWorkout`).
- Optional: extract `secondsToMinutes` / `minutesToSeconds` helpers into `features/workout/utils.ts` and use them in both places.
- **Data repair (separate, reviewed step, not part of the code change):** identify workouts whose `duration` was inflated by edits (`updated_at > created_at` and duration implausibly large, for example above 24 h) and propose a divide-by-60 fix per affected row. Run a `SELECT` first, review with the owner, back up, then update inside a transaction. Not automatable safely because a workout may have been edited several times (60^n).

## Acceptance criteria
- Opening the edit page for a workout with `duration = 3600` shows `60`.
- Saving without changes leaves `duration = 3600` in the database.
- Changing the field to 45 stores `2700`.
- Create-workout flow is unchanged.

## Test plan
- Unit test for the conversion helpers (frontend has no test runner yet; see [CI and core tests](README.md#ci-and-core-tests)); until then, manual check through the UI with a seeded workout.
- Backend: add an API test that `PATCH /api/workouts/{id}` with `duration: 2700` stores 2700 (documents that the backend expects seconds).

## Risks / rollout
Low. Ship before running any data repair, otherwise repaired rows get corrupted again on the next edit.

## Dependencies
None. Related: [M9](M9-workout-timezone.md) (same form).
