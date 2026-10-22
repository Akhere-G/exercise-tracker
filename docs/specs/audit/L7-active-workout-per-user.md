# L7. Persisted active workout is not scoped per user

> **Status:** Proposed · **Severity:** Low · **Type:** Bug / privacy · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l7-persisted-active-workout-is-not-scoped-per-user)

## Problem
`frontend/src/features/workout/store.ts` persists the in-progress workout in localStorage under the fixed key `workout-storage` (Zustand `persist`). `WorkoutClientProvider.tsx:36-48` restores it on mount and prefers it over the routine passed to the page. `logoutAction` / `LogoutButton` do not clear it (only the cookies). On a shared browser, the next account that opens `/workouts/active` can resume, see, and submit the previous user's exercises and sets as their own. The persisted `startedAt` is a `Date` serialised to a string and revived by `new Date(startedAt)` at completion, which works but is not typed.

## Goal
An in-progress workout belongs to one user and is removed on logout.

## Non-goals
Server-side draft workouts or cross-device sync.

## Proposed change
- Clear the store and remove `workout-storage` (and any timer state) on logout: in `LogoutButton.tsx` `onSubmit` (client side, before the form action), call `useWorkout.getState().resetState()` and `localStorage.removeItem(workoutStorageKey)`.
- Key the storage by user: add `userId` to the persisted state (the layout can provide it from a cheap `/auth/me` call, or store a hash of the cookie owner) and ignore stored data whose `userId` differs.
- When a different `routine` is passed to `WorkoutClientProvider` than the stored `routineId`, ask or discard instead of silently resuming the stored one (the start flows already call `removeItem` in `StartWorkoutDialog.tsx:48` and `StartEmptyWorkoutButton.tsx:18`; keep that behaviour).

## Acceptance criteria
- Log out and log in as another user: no resume prompt and an empty active workout.
- Same user reloading mid-workout still resumes.

## Test plan
Manual with two accounts in the Browser pane.

## Risks / rollout
Low; users may lose an unsaved workout if they log out mid-session (intended).

## Dependencies
None.
