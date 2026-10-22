# M2. No double-submit protection when completing a workout

> **Status:** Proposed · **Severity:** Medium · **Type:** Bug · **Confidence:** Likely · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m2-no-double-submit-protection-when-completing-a-workout)

## Problem
`frontend/src/app/(dashboard)/workouts/active/components/WorkoutClientProvider.tsx:78-136`: `completeWorkout` has no in-flight guard. It is reachable from the "Complete Workout" button (`:136`) and from `ExerciseDetails` via the `completeWorkout` prop (`:123`). Local state (`resetState`, `localStorage.removeItem`) is only cleared after the response. A double tap or a slow response can send two requests; the backend creates two workouts (no idempotency).

## Goal
One completion action produces one workout.

## Non-goals
Offline queueing or background sync.

## Proposed change
- Frontend: a `useRef`/state `isSubmitting` guard at the top of `completeWorkout`; disable both buttons and show a pending state (reuse the existing `Button` pending patterns); clear the guard in `finally` only on failure.
- Optional backend hardening: accept an `Idempotency-Key` (client-generated UUID created when the workout starts and stored in the persisted workout state) and store it on `workouts` with a unique index per user; return the existing workout on a repeat. Needs a migration; do only if duplicates are observed after the frontend fix.

## Acceptance criteria
- Double-clicking "Complete Workout" creates exactly one workout.
- On failure the button re-enables and the user can retry.

## Test plan
Manual: throttle the network and double-click. If the optional backend key is added: API test posting the same key twice returns the same workout id.

## Risks / rollout
Low for the frontend change. The optional key adds a nullable column and unique index.

## Dependencies
Group with [M1](M1-achievement-failure-after-commit.md) (the main cause of "failed save then retry").
