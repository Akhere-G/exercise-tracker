# M6. Email not normalised; registration race

> **Status:** Proposed · **Severity:** Medium · **Type:** Bug · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#m6-email-not-normalised-registration-race)

## Problem
`backend/app/routers/users.py:14-24` and `services/user.py:76-97` compare and store emails exactly as typed. `users.email` is `unique=True` but case-sensitive, so `Alex@x.com` and `alex@x.com` become two accounts and a user who registers as one and logs in as the other is told the credentials are wrong. Registration does check-then-insert: two concurrent requests for the same email can both pass the check; the loser hits `IntegrityError`, which `create_user` rolls back and re-raises, producing HTTP 500.

## Goal
Emails are unique case-insensitively and a duplicate registration always returns a clean 400.

## Non-goals
Email verification.

## Proposed change
- Add a `normalize_email` step (strip + lower-case) as a Pydantic validator on `UserBase`/`UserLogin` in `schemas/user.py`, and also lower-case the `form_data.username` in `/token`.
- `services/user.py:create_user`: catch `IntegrityError` after rollback and raise a domain error that the router maps to the existing 400 message.
- Migration: before enforcing, run a read-only duplicate check (`SELECT lower(email), count(*) ... HAVING count(*) > 1`) in production. If clean, add a unique index on `lower(email)` (PostgreSQL functional index; SQLite supports expression indexes too) and a data migration that lower-cases existing emails. If duplicates exist, resolve them manually first.
- JWT `sub` is the email (`get_access_token`); existing tokens carrying mixed-case emails keep working only if lookups also lower-case, so lower-case in `get_user_by_email` as well.

## Acceptance criteria
- Registering `A@x.com` then `a@x.com` returns 400 on the second.
- Logging in with either casing works.
- Two simultaneous registrations for one email return one 201 and one 400 (no 500).

## Test plan
API tests for casing and for the `IntegrityError` path (monkeypatch `get_user_by_email` to return `None` once to simulate the race).

## Risks / rollout
The data migration touches every user row; take a backup and run in staging. The demo user email (`demo@gains-demo.app`) is already lower-case.

## Dependencies
Group with [M5](M5-input-validation.md).
