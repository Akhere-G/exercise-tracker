# M8. Reminder worker: timezone, duplicates, broken script, unvalidated push endpoint

> **Status:** Proposed · **Severity:** Medium · **Type:** Reliability / security · **Confidence:** Confirmed in code; impact depends on deployment · **Effort:** M
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m8-reminder-worker-timezone-duplicates-broken-script-unvalidated-push-endpoint)

## Problem
1. **Timezone:** `backend/app/workers/scheduler.py:66-69` uses server `datetime.now()` to select routines whose naive `start_time` was entered in the user's local time. Users outside the server timezone get reminders at the wrong time or never.
2. **Window and duplicates:** it selects routines with `start_time` between now and now+1 hour on today's weekday. At 23:30 the upper bound wraps to 00:30, so `start_time >= 23:30 AND start_time <= 00:30` matches nothing. If the job runs more often than hourly, the same routine is notified on each run (no record of what was sent). The Notification row is committed before pushes are sent.
3. **Broken launcher:** `backend/worker_start.sh:4` runs `python3 run_reminder.py`, but the file is `backend/app/run_reminder.py`; the script fails as written (unless the job is started another way; not visible).
4. **Unvalidated endpoint (blind SSRF):** `schemas/notification.py` accepts any `endpoint` string; `scheduler.py` calls `webpush(...)` to it. Any registered user can make the worker send POST requests to an arbitrary URL, including internal addresses.
5. `save_subscription` (`services/notification.py:27-39`) re-assigns an existing endpoint to whoever posts it.
6. Hard-coded personal email in `VAPID_CLAIMS` (`scheduler.py:16`); `print` debugging instead of logging; failed pushes other than 404/410 are not retried or counted.

## Goal
Reminders arrive once, at the user's local time, only to legitimate push services, and the job runs from a documented command.

## Non-goals
A full notification platform or per-user notification preferences UI.

## Proposed change
- Add `users.timezone` (IANA name, default `UTC`; migration) and send it from the browser on registration/settings (`Intl.DateTimeFormat().resolvedOptions().timeZone`); compute "now" per user with `zoneinfo`. Coordinate with [M9](M9-workout-timezone.md) so one timezone decision serves both.
- Replace the window with explicit logic: remind when `start_time - lead` falls in the current run interval; handle the midnight wrap; record `last_reminded_on` (date) on the routine or a `reminders_sent` table and skip if already sent that day.
- Fix `worker_start.sh` (`python3 -m app.run_reminder` from `backend/`) and document the Cloud Run Job / scheduler command in the README.
- Validate `endpoint` in the schema: `https` only, hostname in an allow-list of push services (`fcm.googleapis.com`, `*.push.services.mozilla.com`, `*.notify.windows.com`, `web.push.apple.com`) or at minimum reject private/loopback/link-local IPs and non-443 ports.
- Only update an existing subscription if it belongs to the same user, otherwise replace it explicitly after validation.
- Read the VAPID contact from `VAPID_SUBJECT` env; switch `print` to `logging`; count and log failures.

## Acceptance criteria
- A routine set for 07:00 in `Europe/London` triggers one push at about 06:00 London time regardless of server timezone, and not again that day.
- A routine at 00:15 is reminded at 23:15 the previous day (or documented as same-day only).
- Subscribing with `http://169.254.169.254/...` or an unlisted host is rejected with 422.
- `worker_start.sh` runs successfully in the container.

## Test plan
Unit tests for the due-reminder selection with injected `now` and timezones; endpoint validator tests; a dry-run mode for the worker that logs instead of pushing.

## Risks / rollout
New columns/migration; existing routines default to UTC until users set a timezone, so reminder times may stay off until the frontend sends it. Roll out the allow-list in warn-only mode first to catch legitimate hosts.

## Dependencies
Coordinate with [M9](M9-workout-timezone.md) and [M3](M3-push-subscribe-not-awaited.md).
