# M3. Push subscribe is fire-and-forget

> **Status:** Proposed · **Severity:** Medium · **Type:** Bug · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m3-push-subscribe-is-fire-and-forget)

## Problem
`frontend/src/features/notifications/actions.ts:10`: `api.post("/notifications/subscribe", sub)` is not awaited inside the `try`. The action returns `{ success: true }` immediately, so the `catch` never sees request errors (for example the demo 403 from `routers/notifications.py`, or validation errors). The rejected promise becomes an unhandled rejection, and in a serverless runtime the action may complete before the request is sent.

## Goal
The UI reports the real outcome of subscribing.

## Non-goals
Validating the push endpoint (see [M8](M8-reminder-worker.md)).

## Proposed change
- `await api.post("/notifications/subscribe", sub);`
- Check how `NotificationsPrompt.tsx` handles the response and make sure a failure shows a toast using the existing `handleApiError` pattern (and does not leave the browser subscribed while the server has no record; optionally call `subscription.unsubscribe()` on failure).

## Acceptance criteria
- Subscribing as a normal user stores a row in `notification_subscriptions` and the UI shows success.
- Subscribing as the demo user shows the backend message ("Notifications are disabled in demo mode.") instead of success.
- Stopping the backend shows an error, not success.

## Test plan
Manual in the Browser pane with the backend running and stopped; check the table after success.

## Risks / rollout
Low.

## Dependencies
None.
