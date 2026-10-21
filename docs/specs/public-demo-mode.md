# Public Demo Mode — Implementation Specification

> **Status:** Implemented. Decisions on §12: shared demo user; writes allowed with quotas; achievements derived via the existing backfill; banner included; demo email as specified; production is at Alembic revision `0854434c69c3`. Deviations: the reset is run **manually** (no scheduler/lazy reset; run `python3 seed_demo.py --yes` at least once a week or the streak lapses); rate limiting is out of scope; `seed_demo.py` has no `--as-of` flag (tests pass `today` directly).

## 1. Context and goal

Recruiters should be able to click **Try demo** on the landing page or login page, be signed in automatically as one designated demo user through the existing JWT/cookie flow, and land on `/routines` with a believable five-week training history. They must not need to register. The feature should reuse existing pages, queries and components, and add as little new surface as possible.

Approach, as briefed:

1. Add `users.is_demo` (boolean).
2. Add an idempotent seed/reset script that finds or creates the demo user, deletes only that user's data, and recreates it from a committed JSON fixture.
3. Add one public endpoint that issues a short-lived token for the demo user, and one server action plus button on the frontend.

## 2. What the codebase inspection found

These findings drive the design. Each was checked against the code, not assumed.

### 2.1 Schema and relationships (`backend/app/models/`)

| Table | Scoped to user by | FK `ondelete` | Notes |
|---|---|---|---|
| `users` | — | — | `username` String(50), `email` String(50) unique, `password_hash`, `AuditMixin`. No role/flag columns today. |
| `routines` | `user_id` | CASCADE | `day` int (**0 = Monday**, matches `datetime.weekday()` and the `RoutineForm` day picker), `start_time` nullable `Time`. |
| `routine_items` | via `routine_id` | CASCADE (lower-case `"cascade"`) | Composite PK `(routine_id, exercise_id)` → an exercise can appear **once per routine**. `target_sets`, `target_reps`, `target_duration_secs`, `order`. |
| `workouts` | `user_id` | CASCADE; `routine_id` SET NULL | `completed_at` naive `DateTime` (the **end** time), `duration` int = **seconds** (the active-workout provider writes seconds). `routine_id` nullable → ad-hoc workouts are legal. |
| `workout_sets` | via `workout_id` | CASCADE; `exercise_id` CASCADE | `set_index` (1-based, per exercise), `reps`, `weight` (float), `distance_meters`, `duration_secs`. |
| `user_achievements` | `user_id` | CASCADE; `workout_id`/`exercise_id` SET NULL | `value` is declared `Mapped[float]` but the column is **`Integer`** (see §2.4). Append-only history: a new row per improvement. |
| `notifications`, `notification_subscriptions` | `user_id` | **none** | These FKs have no `ondelete`, so Postgres will reject deleting a `users` row that still has them, and nothing cascades. |
| `exercises`, `muscles`, `exercise_muscles`, `achievements` | global | — | Shared catalogue/definitions. **Must never be touched** by the reset. |

### 2.2 Things that change the design

1. **SQLite does not enforce foreign keys here** (`PRAGMA foreign_keys` returns `0` on `backend/database.db`; `database.py` never sets it), so `ON DELETE CASCADE` / `SET NULL` do not fire in development but do in Postgres. **Decision (from review): enable SQLite foreign keys** with a connect-time hook (§4), so dev matches production and the reset script can lean on database cascades instead of deleting every child table by hand. A read-only `PRAGMA foreign_key_check` on the local `database.db` returned no violations, so turning enforcement on will not trip over existing rows.
2. **The streak is calculated relative to *today*, not stored.** `services/workout.py::_recent_week_counts` bails out if the newest workout is older than last week, and `_current_streak` starts from this week (falling back to last week). A fixture with absolute dates would silently lose its streak about one Monday after seeding. Fixture dates must be **relative offsets resolved at seed time**, and the reset must run **at least weekly** (this spec specifies daily).
3. **Achievements are derived, not authored.** `check_and_award_prs` / `check_and_award_frequency_streaks` write append-only `UserAchievement` rows with `unlocked_at = now`. Hand-writing those rows in JSON would duplicate logic and drift. The repo already has `backend/backfill_achievements.py::backfill_user_achievements`, which deletes one user's achievements and replays their workouts chronologically through the real award functions with `commit=False`. The seeder reuses it (§5).
4. **Metrics come from the database, not from the exercise name.** `seed.py::infer_metrics` assigns `metrics` at seed time, and it differs from what the names suggest (§6.1). Notably the two "hanging knee raise" exercises are `duration`, and the body-weight raises are `reps` with no weight.
5. **`UserAchievement.value` is an `Integer` column.** Fractional weights are truncated/rounded by the database, so PR comparisons (`value <= existing.value`) can silently swallow small increments. Fixture loads for tracked lifts must be **whole kilograms**.
6. **There is no logout, no password change, no email change and no account deletion** anywhere in the app (`settings/page.tsx` is all "Coming Soon"). Consequences: (a) a visitor cannot lock others out of the demo account; (b) once the `access_token` cookie is set, `middleware.ts` redirects `/login` and `/register` to `/routines`, so a recruiter could never reach registration. The demo therefore needs an **Exit demo** action.
7. **The reminder worker would message the demo user.** `workers/scheduler.py::check_routine_reminders` selects routines by `day`/`start_time` and writes `Notification` rows plus Web Push to every subscription of the owner. Demo routines must have `start_time = NULL` (a NULL never satisfies the `>=`/`<=` filter) and demo subscriptions must be blocked.
8. **`WorkoutCalendar.tsx` buckets days with `new Date(completedAt).toISOString()`**, i.e. after parsing the naive timestamp in the viewer's local zone. Workout times of **11:00–14:00** keep the calendar date stable for every UTC offset from −11 h to +11 h.
9. **Alembic state mismatch (must be resolved before generating a migration).** The repo's only head is `0854434c69c3`. The local `database.db` is stamped `54554881c8de`, a revision that was added in `a6d1f2e` and deleted in `28c9a44`. It was data-only (swapped streak achievement rows; startup `seed_achievements` now covers that), but `alembic` will refuse to run against a DB stamped with a missing revision. See §10.1.
10. **Existing conventions to follow:** root-level seed scripts beside a JSON data file (`seed.py` + `exercises.json`); services own logic; routers are thin and use `Annotated` dependencies; server actions set the `access_token` httpOnly cookie and return `ActionResponse<Token>` via `handleApiError`; feature code lives in `src/features/<feature>/`; `render_as_batch=True` is already set in `alembic/env.py` so SQLite `ALTER` works.
11. **No test infrastructure exists** (no `backend/tests`, no pytest in `requirements.txt`, no frontend test runner; only `npm run lint`). Tests in §9 therefore introduce `pytest` for the backend only.
12. **Latent bug noticed, not in scope:** `auth/actions.ts` sets cookie `maxAge: 60 * 24 * 7`. Next.js expects **seconds**, so that is ~2.8 hours, not 7 days (the JWT itself lasts 7 days). The demo action sets its own explicit value and does not depend on this. Flagged in §11.

## 3. Architecture

```
Landing / Login page
   └─ <DemoLoginButton/> (client)  ── demoLoginAction() (server action)
                                         └─ POST {BASE_URL}/auth/demo      ← new public endpoint
                                               ├─ DEMO_MODE_ENABLED? else 404
                                               ├─ SELECT user WHERE is_demo   (else 503)
                                               └─ create_access_token(sub=email, exp=2h)   ← existing function
                                      sets httpOnly `access_token` (2 h) + `demo_session=1`
                                      → router.push("/routines")
   everything after that is the unmodified app: same pages, same queries, same get_current_user

Nightly job: python seed_demo.py --yes
   └─ services/demo.py::reset_demo_user()
        1 validate fixture + catalogue (no writes)
        2 one transaction: lock → find/create user → scoped deletes → insert → backfill achievements → fix unlocked_at → commit
```

Design decisions:

- **One shared demo user.** Matches the brief ("a designated demo user"). Trade-off: visitors see each other's edits until the next reset. The alternative (ephemeral per-visitor clone with TTL cleanup) is stronger isolation but needs a clone path, a cleanup job and abuse controls. See open question Q1.
- **Authentication reuses the existing system end to end.** The token is minted by the existing `create_access_token` (which already accepts `expires_delta`) and validated by the unchanged `get_current_user`. The demo user's password hash is a random, discarded bcrypt hash, so `/auth/login` can never succeed for it.
- **The database flag is the source of truth.** Backend guards read `user.is_demo` from the DB, never a JWT claim or a cookie. The `demo_session` cookie only drives UI (banner, Exit button).
- **No change to read paths.** Dashboard, workouts, achievements, exercises, routines all keep working through the same endpoints and queries.

## 4. Files to create or modify

### Backend

| File | Change |
|---|---|
| `backend/app/database.py` | Add `enable_sqlite_foreign_keys(engine)`: when `DATABASE_URL` starts with `sqlite`, `event.listen(engine, "connect", …)` runs `PRAGMA foreign_keys=ON` on every new DBAPI connection (the pragma is per-connection and cannot be changed mid-transaction, so the connect event is the correct hook). Called right after the existing `create_engine` branch. **Placement note:** you suggested `main.py`, but `seed_demo.py`, tests and other root scripts never import `main.py`, so the pragma would be off exactly where the reset runs. Defining and applying it in `database.py` (next to the engine) covers the API, scripts and tests; `main.py` needs no change. Say so if you still want it called from `main.py`. |
| `backend/alembic/env.py` | No change required; it builds its own engine, and its batch-mode SQLite migrations run with FKs off as before. |
| `backend/app/models/user.py` | Add `is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default=sa.false())` and a **partial unique index** so at most one demo user can exist: `Index("uq_users_single_demo", "is_demo", unique=True, postgresql_where=text("is_demo"), sqlite_where=text("is_demo"))`. |
| `backend/alembic/versions/<new>_add_is_demo_to_users.py` | Autogenerated, then reviewed by hand (§10.2). `down_revision = "0854434c69c3"`. |
| `backend/app/services/demo.py` | **New.** `load_fixture`, `validate_fixture`, `reset_demo_user`, `get_demo_user`, plus `DemoSeedError`. All business logic lives here (AGENTS.md). |
| `backend/app/services/achievement.py` | **Move** `backfill_user_achievements` here from `backfill_achievements.py` (body unchanged) so a service can call it without importing a root-level script. |
| `backend/backfill_achievements.py` | Import `backfill_user_achievements` from the service; behaviour of `backfill_all_user_achievements` unchanged. |
| `backend/seed_demo.py` | **New** CLI wrapper in the style of `seed_achievements.py`. Flags: `--fixture PATH`, `--as-of YYYY-MM-DD` (testing only), `--dry-run` (runs everything, then rolls back and prints the summary), `--yes` (required for any non-SQLite database). |
| `backend/demo_fixture.json` | **New**, beside `exercises.json`. Structure in §6. |
| `backend/app/services/user.py` | Add `get_demo_access_token(user)` (calls `create_access_token({"sub": user.email, "demo": True}, timedelta(hours=2))`, returns `Token`). Add `DEMO_TOKEN_TTL` constant. |
| `backend/app/routers/users.py` | Add `POST /api/auth/demo` (§7). |
| `backend/app/routers/notifications.py` | `POST /subscribe`: reject demo users with 403. |
| `backend/app/routers/workouts.py`, `routines.py` | On `POST` create: if `user.is_demo` and the user already has ≥ `DEMO_MAX_ROWS` (workouts 100, routines 20), return 403. Small shared helper in `services/demo.py` (`assert_demo_quota`). |
| `backend/app/workers/scheduler.py` | Defence in depth: join `User` and filter `User.is_demo.is_(False)` in `check_routine_reminders`. |
| `backend/requirements.txt` | Add `pytest` (version pinned at implementation time). |
| `backend/tests/…` | New (§9). |

`app/models/__init__.py` needs no change (no new model). `main.py` needs no change (the endpoint lives in the existing `users` router). `alembic/env.py` already imports `User`.

### Frontend

| File | Change |
|---|---|
| `frontend/src/features/auth/actions.ts` | Extract the repeated cookie block into a private `setAccessToken(token, maxAgeSecs)` helper (reduces duplication across three actions). Add `demoLoginAction()` (calls `api.post("/auth/demo")`, sets `access_token` with `maxAge: 60 * 60 * 2` and a `demo_session` cookie, returns `ActionResponse<Token>` via `handleApiError`). Add `logoutAction()` (deletes `access_token` and `demo_session`, then `redirect("/")`; declared as a no-argument async function so it can be used directly as a `<form action>`). |
| `frontend/src/features/auth/components/LogoutButton.tsx` | **New** small component: `<form action={logoutAction}>` wrapping the existing `Button` (`type="submit"`, `variant` outline/destructive per existing button variants, `LogOut` icon from `lucide-react`). Works as a server-rendered form with no client JS, and is shared by the Settings page and the demo banner. |
| `frontend/src/app/(dashboard)/settings/page.tsx` | Add an **Account** card (same `bg-card border border-border rounded-2xl p-6` styling as the existing cards, spanning both columns) containing `<LogoutButton/>`. Shown to **all** users, not only the demo. |
| `frontend/src/features/auth/components/DemoLoginButton.tsx` | **New** client component. Calls `demoLoginAction`, `router.push("/routines")` on success, inline error text on failure (matches the login page pattern). Uses the existing `Button`. |
| `frontend/src/features/auth/components/DemoBanner.tsx` | **New** slim banner: "You're exploring a demo. Changes reset nightly." plus **Exit demo** (the shared `LogoutButton`, labelled "Exit demo") and a **Create account** `Link`. Tailwind design tokens only. |
| `frontend/src/app/page.tsx` | Add `<DemoLoginButton/>` as the primary CTA beside "Create Your Account". |
| `frontend/src/app/(auth)/login/page.tsx` | Add the same button under the form. |
| `frontend/src/app/(dashboard)/layout.tsx` | Read `demo_session` via `cookies()` (server component) and render `<DemoBanner/>` at the top of the scroll area when present, without changing the existing `h-[90vh]` / bottom-nav layout. |

`middleware.ts` needs **no change**: `/` is neither protected nor an auth page, and `/login` with a token already redirects to `/routines`.

Before writing frontend code, check `node_modules/next/dist/docs/` for server-action cookie/redirect behaviour (AGENTS.md; Next 16.2.6). The existing actions already use `await cookies()` and `cookieStore.set`, so follow that pattern.

## 5. Seed / reset algorithm

`reset_demo_user(db, fixture, *, today=None) -> DemoResetSummary`

**Phase A — preflight (no writes; any failure aborts with `DemoSeedError`)**

1. Parse fixture; check `schemaVersion == 1`.
2. Run `validate_fixture` (§6.3), using one `SELECT id, name, metrics FROM exercises WHERE id IN (…)` as the catalogue. Every exercise ID must exist, its title-cased name must equal the fixture's `exercises[].name`, and every set must satisfy that exercise's `metrics`.
3. Resolve dates: `monday = today - timedelta(days=today.weekday())`; `completed_at = datetime.combine(monday + 7 * weekOffset + weekday days, time)`; all resolved timestamps must be `< now`.
4. Resolve the target user, **read-only**: `SELECT … WHERE email = :fixture.user.email`.
   - exists and `is_demo` → proceed.
   - exists and **not** `is_demo` → **abort**. This blocks the hijack where a real person registered the demo email first. The script never flips a real user to demo and never deletes a non-demo user's data.
   - absent → create in Phase B.
5. If more than one `is_demo` user exists → abort (should be impossible once the partial unique index is in place).

**Phase B — one transaction, atomic**

```
try:
    if postgres: SELECT pg_advisory_xact_lock(<constant>)          # serialise concurrent resets
    user = find_or_create_demo_user()                              # is_demo=True; username from fixture;
                                                                   # password_hash = hash(secrets.token_urlsafe(32)), secret discarded
    assert user.is_demo is True and user.id is not None            # re-checked inside the transaction
    demo_id = user.id

    # every statement below is parameterised ONLY by demo_id; foreign keys are enforced on both
    # dialects (§4 database.py), so the existing ON DELETE CASCADE rules remove the children
    DELETE user_achievements          WHERE user_id = :demo_id
    DELETE workouts                   WHERE user_id = :demo_id     # cascades to workout_sets
    DELETE routines                   WHERE user_id = :demo_id     # cascades to routine_items
    DELETE notifications              WHERE user_id = :demo_id     # no ondelete on these FKs,
    DELETE notification_subscriptions WHERE user_id = :demo_id     # so they are deleted explicitly

    insert routines (+ items)            → keep {routineKey: new_id}
    insert workouts (+ sets, in fixture order so set ids ascend)
    db.flush()

    backfill_user_achievements(db, demo_id)                        # existing logic, commit=False
    UPDATE user_achievements SET unlocked_at =
        (SELECT w.completed_at FROM workouts w WHERE w.id = user_achievements.workout_id)
    WHERE user_id = :demo_id AND workout_id IS NOT NULL            # realistic dates instead of "now"

    verify(expectations)                                           # §6.4; mismatch → raise → rollback
    db.commit()
except Exception:
    db.rollback()
    raise
```

Properties:

- **Idempotent.** Re-running yields the same logical data. Database IDs for the demo user's rows change on each reset (they are never hard-coded; hard-coding would collide with real rows). Only the user's own ID and the exercise IDs are stable.
- **Cannot touch other users.** Every write is scoped by the vetted `demo_id`; global tables are never written; the user row itself is only ever updated, never deleted (so no `notifications`/`subscriptions` FK problem and existing tokens stay valid). Verified by tests that capture every executed SQL statement (§9).
- **Foreign keys.** With SQLite FK enforcement enabled, the script behaves identically on SQLite and Postgres. `user_achievements` is deleted first so no row briefly points at a deleted workout (its `workout_id` is `SET NULL` anyway). `workout_sets` and `routine_items` rely on cascade. The reset script asserts at start that FK enforcement is on (`PRAGMA foreign_keys` returns 1 on SQLite) and aborts otherwise, so it can never run in a mode where the cascades silently do nothing and leave orphan sets.
- **Side effect of enabling SQLite FKs (dev behaviour now matches prod):** deleting a routine now really sets `workouts.routine_id` to NULL, and inserts referencing missing parents now fail. `seed.py` must be re-run once against a fresh SQLite file with the hook active to confirm its insert order (muscles → exercises → `exercise_muscles`) is FK-safe.
- **Atomic for readers.** On Postgres (`READ COMMITTED`) in-flight requests see either the old or the new demo data, never an empty user. Writers on demo rows block for the length of the transaction (~400 inserts, well under a second).
- **External resources.** The demo uses no uploads or files. The only external state is Web Push: subscriptions are deleted by the reset and blocked at the API, and routines have no `start_time`, so the reminder worker has nothing to send. Exercise images are remote URLs already used by the app.
- **Why not a row-count check.** Comparing non-demo row counts before/after was considered and rejected: concurrent real activity would cause false failures. Isolation is enforced by scoping plus tests instead.

## 6. Fixture design — `backend/demo_fixture.json`

### 6.1 Exercise IDs verified

All 32 requested IDs exist in `backend/exercises.json` with exactly the requested names (after the title-casing that `seed.py` applies), and the ones present in the local `database.db` were confirmed read-only. Metrics are what `infer_metrics` produces; fixture sets must follow them.

| `metrics` | Required set fields | Exercises |
|---|---|---|
| `reps+weight` | `reps`, `weight`; no duration/distance | 1350, 596, 1723, 572, 1347, 32, 334, 9, 171, 968, 285, 1452, 50, 577, 2406, 2318, 43, 30, 2611, 294, 58, 2330, 586, 597, 602, 312 |
| `reps` (body weight) | `reps`; `weight` null | 2963, 491 |
| `duration` | `durationSecs`; no reps/weight | 1761, 11 |
| `duration+distance` | `durationSecs`, `distanceMeters` | 2311, 3666 |

Notes:

- **ID 577 `Lever Chest Press`** has a lower-case twin with ID 576 in `exercises.json`. `seed.py` keeps the first title-cased name it sees, which is 577 (confirmed in the local DB). The preflight name check guards against this drifting in another environment.
- **Assisted machines (9, 572, 11):** 9 and 572 are logged by assistance weight and held **constant**, with reps progressing, because `pr_weight` rewards the heaviest value and a falling assistance weight would never register as a record.
- **Production database:** I could only verify against the local SQLite file. Preflight verifies against whichever database the script runs on.

### 6.2 Structure

Keys are camelCase to match the API's alias convention. Local string `key`s link entities; **no workout/routine/achievement database IDs appear in the file.** Only `exerciseId` (stable catalogue IDs) is a real database ID.

```jsonc
{
  "schemaVersion": 1,
  "user": { "username": "Alex Demo", "email": "demo@gains-demo.app" },   // email ≤ 50 chars (column limit)

  "exercises": [                       // preflight cross-check table
    { "id": 577,  "name": "Lever Chest Press",              "metrics": "reps+weight" },
    { "id": 1761, "name": "Hanging Oblique Knee Raise",      "metrics": "duration" }
    // … all 32
  ],

  "routines": [
    {
      "key": "push", "name": "Push Day", "day": 0, "startTime": null,   // null on purpose: no reminder pushes
      "items": [
        { "exerciseId": 577,  "order": 1, "targetSets": 4, "targetReps": 10, "targetDurationSecs": null },
        { "exerciseId": 2318, "order": 2, "targetSets": 3, "targetReps": 10, "targetDurationSecs": null }
        // …
      ]
    }
  ],

  "workouts": [
    {
      "key": "s01",
      "routineKey": "push",             // or null for an ad-hoc workout
      "weekOffset": -5,                 // whole ISO weeks before the current week; must be ≤ -1
      "weekday": 2,                     // 0 = Monday … 6 = Sunday
      "completedTime": "12:20",         // local naive time; 11:00–14:00 only
      "durationSecs": 3180,
      "sets": [
        { "exerciseId": 577, "setIndex": 1, "reps": 10, "weight": 40, "durationSecs": null, "distanceMeters": null },
        { "exerciseId": 577, "setIndex": 2, "reps": 10, "weight": 40, "durationSecs": null, "distanceMeters": null },
        { "exerciseId": 577, "setIndex": 3, "reps": 10, "weight": 40, "durationSecs": null, "distanceMeters": null },
        { "exerciseId": 577, "setIndex": 4, "reps": 9,  "weight": 40, "durationSecs": null, "distanceMeters": null },
        { "exerciseId": 1761, "setIndex": 1, "reps": null, "weight": null, "durationSecs": 20, "distanceMeters": null },
        { "exerciseId": 3666, "setIndex": 1, "reps": null, "weight": null, "durationSecs": 1200, "distanceMeters": 1700 }
      ]
    }
  ],

  "expectations": {                    // asserted after derivation, NOT inserted (see Q3)
    "workoutCount": 14,
    "weeklyStreak": 5,
    "frequencyStreaks": { "1": 5, "2": 5, "3": 4, "4": 0, "5": 0 },
    "prExerciseIds": [577, 2318, 32, 43, 1350, 2963, 1761, 3666]
  }
}
```

Sets reuse the existing Pydantic validators: each set is passed through `WorkoutSetCreate` and each routine item through `RoutineItemCreate` (`schemas/workout.py`, `schemas/routine.py`), so the "reps or duration required" rules are not re-implemented.

### 6.3 Validation rules (`validate_fixture`)

- Unique `key`s; every `routineKey` resolves; `weekday` in 0–6; `weekOffset` ≤ −1; time within 11:00–14:00; every resolved datetime is in the past.
- Every `exerciseId` exists, with the expected name and metrics.
- Per workout, per exercise: `setIndex` values are exactly 1..n.
- Metric-specific field rules from §6.1.
- Routine items: unique `exerciseId` per routine (composite PK), unique `order`.
- Tracked-lift weights are whole numbers, and each exercise's per-session maximum is non-decreasing over time (so integer-column rounding cannot hide a PR).
- Every one of the 32 requested exercise IDs is referenced at least once (a test, not a runtime rule).

### 6.4 History plan (14 workouts over 5 weeks)

Week offsets are relative to the week containing the seed date. Week `−5` is a lighter start-up week (two sessions) so the three-per-week streak is exactly **four** weeks; weeks `−4 … −1` have three sessions each. The current week is intentionally empty so the dashboard has room to add a first workout, and so the streak is unaffected by what day of the week the reset runs.

| Key | Week | Day | Time | Duration | Routine | Exercises (IDs) |
|---|---|---|---|---|---|---|
| s01 | −5 | Wed | 12:20 | 53 min | Push | 577, 2318, 171, 334, 1723 |
| s02 | −5 | Fri | 12:45 | 57 min | Legs & Core | 43, 2611, 586, 597, 1452, 1761 |
| s03 | −4 | Mon | 12:10 | 62 min | Push | 577, 2318, 596, 334, 1723, 2406 |
| s04 | −4 | Wed | 12:30 | 59 min | Pull | 1350, 2330, 1347, 572, 602, 294 |
| s05 | −4 | Fri | 12:40 | 65 min | Legs & Core | 43, 32, 2611, 586, 597, 1452, 11 |
| s06 | −3 | Mon | 12:15 | 63 min | Push | 30, 2318, 171, 334, 1723, 9 |
| s07 | −3 | Wed | 12:35 | 61 min | Pull | 1350, 2330, 1347, 572, 602, 294, 312 |
| s08 | −3 | Sat | 11:20 | 48 min | *none (ad-hoc)* | 32, 58, 3666, 491, 2963 |
| s09 | −2 | Tue | 12:25 | 60 min | Push | 577, 50, 171, 334, 2406, 9 |
| s10 | −2 | Thu | 12:30 | 58 min | Pull | 1350, 2330, 1347, 572, 285, 968 |
| s11 | −2 | Sat | 11:45 | 55 min | Cardio & Core | 2311, 3666, 1761, 11, 2963, 491 |
| s12 | −1 | Mon | 12:10 | 64 min | Push | 577, 2318, 596, 334, 1723, 9 |
| s13 | −1 | Wed | 12:30 | 62 min | Pull | 1350, 2330, 1347, 572, 602, 294, 312 |
| s14 | −1 | Fri | 12:50 | 68 min | Legs & Core | 43, 32, 2611, 586, 58, 597, 1452, 1761 |

All 32 requested exercises appear at least once. Durations in the file are seconds.

**Routines (4):** Push Day (Mon, day 0), Pull Day (Wed, day 2), Legs & Core (Fri, day 4), Cardio & Core (Sat, day 5). All have `startTime: null`. Cardio items use `targetSets: 1` with `targetDurationSecs` (e.g. 1200 for 3666); duration-metric core items use `targetDurationSecs: 30`; the rest use `targetReps`.

**Loads (kg, whole numbers, in chronological order of appearance).** Sets per exercise are 3, or 4 for the first lift of the day. Reps hold at target; when the load rose since the last exposure, the final set drops 1–2 reps.

| Exercise | Sets × reps | Loads by session |
|---|---|---|
| 577 Lever Chest Press | 4×10 | 40, 45, 50, 55 |
| 2318 Lever Shoulder Press V. 3 | 3×10 | 25, 30, 30, 35 |
| 171 Cable Incline Fly | 3×12 | 10, 12, 14 |
| 334 Dumbbell Lateral Raise | 3×15 | 4, 4, 6, 6, 8 |
| 1723 Cable One Arm Tricep Pushdown | 3×12 | 8, 10, 10, 12 |
| 2406 Cable Reverse Grip Triceps Pushdown… | 3×12 | 15, 20 |
| 596 Lever Seated Fly | 3×12 | 30, 35 |
| 30 Barbell Close-Grip Bench Press | 4×8 | one session; sets ramp 30, 40, 40, 40 |
| 50 Barbell Incline Shoulder Raise | 3×12 | 10 |
| 9 Assisted Chest Dip (Kneeling) | 3×8 → reps 6/7/8 | 40 assistance, constant |
| 1350 Lever Seated Row | 4×10 | 45, 50, 50, 55 |
| 2330 Cable Lat Pulldown FROM | 3×10 | 40, 45, 45, 50 |
| 1347 Lever One Arm Lateral Wide Pulldown | 3×10 | 20, 25, 25, 30 |
| 572 Lever Assisted Chin-Up | reps 5→8 | 35 assistance, constant |
| 602 Lever Seated Reverse Fly | 3×12 | 25, 30, 30 |
| 294 Dumbbell Biceps Curl | 3×12 | 10, 10, 12 |
| 312 Dumbbell Hammer Curl V. 2 | 3×12 | 10, 10, 12 |
| 285 Dumbbell Alternate Biceps Curl | 3×10 | 10 |
| 968 Band Alternating Biceps Curl | 3×15 | 7 (band resistance estimate) |
| 43 Barbell Full Squat | 4×8 | 50, 60, 70 |
| 32 Barbell Deadlift | 3×5 | 70, 80, 90 |
| 2611 Lever Horizontal One Leg Press | 3×12 | 40, 45, 55 |
| 586 Lever Lying Leg Curl | 3×12 | 25, 30, 35 |
| 597 Lever Seated Hip Abduction | 3×15 | 35, 40, 45 |
| 58 Barbell Lying Lifting (On Hip) | 3×10 | 40, 50 |
| 1452 Lever Seated Crunch | 3×15 | 20, 25, 30 |
| 2963 Captains Chair Straight Leg Raise (reps) | 3 sets | 10/10/8 → 12/11/10 |
| 491 Incline Leg Hip Raise (reps) | 3 sets | 12/12/10 → 14/12/12 |
| 1761 Hanging Oblique Knee Raise (duration, s) | 3 sets | 20/20/20 → 30/30/25 → 40/35/35 |
| 11 Assisted Hanging Knee Raise (duration, s) | 3 sets | 30/30/25 → 40/35/35 |
| 3666 Walking On Incline Treadmill | 1 set | 1200 s / 1700 m → 1500 s / 2200 m |
| 2311 Walking On Stepmill | 1 set | 900 s / 550 m |

**Fixture generation.** ~330 sets is too large to hand-type reliably. The implementer generates the expanded JSON once from the tables above with a throwaway script (not committed), commits the **fully expanded, explicit** file, and reviews the diff. The committed file contains no generator logic.

### 6.5 Expected derived state (the contract for tests)

For any seed date, with the current week empty and today anywhere inside it:

| Quantity | Value | Why |
|---|---|---|
| Workouts | 14 | table above |
| Week counts (oldest → newest) | 2, 3, 3, 3, 3, then 0 for the current week | |
| `get_stats().weeklyStreak` | **5** | `_current_streak` falls back from the empty current week to last week and counts 5 weeks with ≥1 |
| `calculate_current_frequency_streaks` | `{1: 5, 2: 5, 3: 4, 4: 0, 5: 0}` | the two-session week stops the ≥3 streak at four weeks |
| Streak `UserAchievement` rows | `freq_streak_1` values 1–5, `freq_streak_2` 1–5, `freq_streak_3` 1–4 | `backfill_user_achievements` appends a row per improvement; the achievements page shows only the latest per type (`get_user_achievements`) |
| PR rows | At least one per tracked exercise, with strictly increasing values for the progressing lifts | derived; tests assert invariants, not exact totals |

Known quirk of the existing backfill (documented, not changed): because all workouts are inserted before it replays, a week's streak value is awarded on that week's *first* workout rather than its third. This is existing project behaviour and acceptable for demo data.

## 7. Demo authentication flow

1. Visitor clicks **Try demo** (`/` or `/login`).
2. `DemoLoginButton` calls the server action `demoLoginAction()`.
3. The action `POST`s `{BASE_URL}/auth/demo` through the configured Axios instance.
4. **`POST /api/auth/demo`** (router in `routers/users.py`, logic in `services/user.py` / `services/demo.py`):
   - `DEMO_MODE_ENABLED` (env, default `false`) not true → `404` (looks like the route doesn't exist).
   - No row with `is_demo = true` → `503 {"detail": "Demo is temporarily unavailable."}`.
   - Else return `Token` (`access_token`, `token_type`) with `sub = user.email`, `demo = true` claim (informational), `exp = now + 2 h`.
5. The action sets httpOnly `access_token` with `maxAge: 7200` seconds (secure in production, `path: "/"`, same options as the existing actions) and a `demo_session=1` cookie with the same lifetime.
6. Client navigates to `/routines`. From here on `middleware.ts`, Axios interceptor and `get_current_user` behave exactly as for any user.
7. **Logout / Exit demo:** the Settings page **Log out** button (any user) and the demo banner's **Exit demo** both submit `logoutAction`, which deletes `access_token` and `demo_session` and redirects to `/`, where Register and Sign in work again (the middleware only blocks them while the token cookie exists).
8. Token expiry (2 h): the cookie expires with it, so the next navigation redirects to `/login` (existing middleware behaviour) where **Try demo** is still available.

## 8. Security and data-integrity considerations

| Risk | Mitigation |
|---|---|
| Unauthenticated token minting | Only ever mints a token for the single `is_demo` user; no input accepted; 2 h TTL; kill switch `DEMO_MODE_ENABLED`; rate limiting delegated to infrastructure (no limiter exists in the app; see Q5). |
| Demo account takeover / lock-out | Password hash is a random discarded secret, so `/auth/login` and `/auth/token` always fail; no endpoints exist to change email/password/delete the account. |
| Registration collision on the demo email | `/auth/register` rejects duplicates; seeding aborts if the email belongs to a non-demo user. |
| Reset touching real users | Preflight vetting, `assert user.is_demo`, every write scoped by `demo_id`, global tables never written, partial unique index guarantees a single demo user, statement-capture tests (§9), `--dry-run`, and `--yes` required for non-SQLite databases. |
| Wrong database targeted | Script prints dialect/host/database name before writing and refuses non-SQLite targets without `--yes`. |
| Shared-state abuse (spam, giant payloads) | Per-user row quotas for workouts/routines on the demo user; nightly reset; existing request validation unchanged. |
| Push notification spam / data capture | Subscribe returns 403 for demo; reset deletes subscriptions; routines have `startTime: null`; worker excludes demo users. |
| Public data exposure | The demo user's data is public by design; the fixture contains no real personal data and the demo email is on a non-personal address. `is_demo` is not exposed by any current response schema. |
| Stale streak (silent decay) | Daily reset; relative-date fixture; test that the streak holds on Sunday 23:59 of the current week. |
| Stale browser tabs after reset | Workout/routine IDs change; existing 404 handling covers it. Reset runs at 03:00 UTC to minimise overlap. |
| Concurrent resets | Postgres advisory transaction lock; SQLite is single-writer. |
| Partial failure | Single transaction with rollback on any error (AGENTS.md "roll back failed writes"). |
| `demo_session` cookie spoofing | UI-only; backend authority is `users.is_demo`. |

## 9. Tests

There is no test setup today, so this adds `pytest` for the backend (in-memory SQLite engine created per test through the same `enable_sqlite_foreign_keys` hook, so tests run with FKs enforced like production). Catalogue rows are loaded with the existing `seed.py` functions (`seed_all_muscles`, `seed_exercises_and_junctions`) against `exercises.json`, and achievement definitions with `seed_achievements`. "Today" is frozen by patching `app.services.workout.date`.

**Backend (essential)**

1. **Fixture validity:** the committed file passes `validate_fixture` against the real catalogue; all 32 requested IDs are referenced; mutation cases fail (unknown ID, wrong name, wrong metrics for a set, future date, duplicate key, bad weekday, fractional tracked weight, non-contiguous `setIndex`).
2. **Derived state:** after reset, §6.5 values hold for frozen dates of Monday 00:00, Wednesday, and Sunday 23:59 of the current week; `get_stats` gives `weeklyStreak == 5`.
3. **Idempotency:** two consecutive resets produce an identical normalised snapshot (IDs stripped), exactly one demo user, no duplicate `Achievement` definitions.
4. **Isolation (most important):** create two other users with routines, workouts, achievements, notifications and subscriptions; snapshot every non-demo row; reset; the snapshot is byte-identical. Also assert the reset refuses to run if FK enforcement is off, and add a test that `database.py` turns the pragma on for a SQLite engine and leaves other dialects alone.
5. **Statement capture:** register a `before_cursor_execute` listener during reset; assert every `DELETE`/`UPDATE` is scoped to the demo user (bind parameter equals `demo_id` or filtered through a `user_id = demo` sub-select) and that no statement targets `exercises`, `muscles`, `exercise_muscles` or `achievements`.
6. **Hijack guard:** a non-demo user already holding the demo email → `DemoSeedError`, nothing modified.
7. **Atomicity:** force an exception halfway through inserts → the demo user's previous data is intact.
8. **Endpoint:** flag off → 404; no demo user → 503; success → token accepted by `/api/auth/me`; `/api/auth/login` with the demo email fails; `exp` ≈ 2 h; `POST /notifications/subscribe` as demo → 403; quota → 403.
9. **Migration:** `alembic upgrade head` on a fresh SQLite DB works, existing users get `is_demo = false`, a second `is_demo = true` row violates the unique index, `downgrade -1` succeeds.

**Frontend** (no test runner exists, so manual plus lint/build)

- `npm run lint` and `npm run build` pass.
- From `/` and `/login`, **Try demo** lands on `/routines` with data; no registration prompt.
- Calendar shows 14 workouts across five weeks; the dashboard streak shows 5; the Achievements page shows the 1x/week and 2x/week streaks at 5 and the 3x/week streak at 4 (§6.5), plus PR entries; a seeded workout's summary page, an exercise detail page (e.g. 577) and the routines page all render; searching exercises ranks used exercises first.
- Banner is visible on all dashboard pages and does not break the bottom nav at mobile width.
- **Log out** on the Settings page (as a normal user and as the demo user) and **Exit demo** on the banner both clear the cookies, land on `/`, and leave `/login` and `/register` reachable; a protected route then redirects to `/login`.
- Backend returning 404/503 shows an inline error instead of a blank page.

## 10. Deployment and rollout

### 10.1 Pre-flight: Alembic state

1. In every environment run `alembic current`.
2. The local DB is stamped `54554881c8de`, which no longer exists in the repo. Confirm the deleted revision was data-only (it was: see `git show a6d1f2e:backend/alembic/versions/54554881c8de_*.py`), then `alembic stamp 0854434c69c3` locally. **Check production's `alembic_version` first**; if it also reports the deleted revision, `start.sh`'s `alembic upgrade head` will fail on deploy, so stamp production to `0854434c69c3` before releasing.

### 10.2 Migration

```bash
cd backend
alembic revision --autogenerate -m "add is_demo to users"
# review by hand: server_default false, NOT NULL, partial unique index with both
# postgresql_where and sqlite_where, batch mode on SQLite, working downgrade
alembic upgrade head
```

### 10.3 Release steps

1. Merge and deploy backend. `start.sh` runs `alembic upgrade head`; the demo endpoint stays dark because `DEMO_MODE_ENABLED` is unset.
2. Dry run against production: `python3 seed_demo.py --dry-run` (rolls back, prints what it would do).
3. First real seed: `python3 seed_demo.py --yes`.
4. Set `DEMO_MODE_ENABLED=true` on the backend service; deploy the frontend.
5. Create a scheduled job for the nightly reset: `python3 seed_demo.py --yes` at `0 3 * * *` UTC, mirroring how `worker_start.sh` / `run_reminder.py` are run today (same image, same DB credentials and CA cert). The README links Cloud Run deployments, so a Cloud Run job plus Cloud Scheduler is the assumed mechanism (confirm in Q4).
6. Smoke test the §9 manual checklist on the live URL.
7. **Rollback:** set `DEMO_MODE_ENABLED=false` (instant; the button then shows its error state and can be removed in a follow-up). The `is_demo` column is harmless to leave in place.

### 10.4 Environment variables

| Var | Where | Purpose |
|---|---|---|
| `DEMO_MODE_ENABLED` | backend | Kill switch for `POST /api/auth/demo` (default off). |
| existing `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `DB_CA_CERT_PATH` | backend job | The reset job reuses the service's configuration. |

No new frontend variables. Update AGENTS.md's environment list when implemented.

## 11. Out of scope / follow-ups

- Fixing the `maxAge: 60 * 24 * 7` cookie lifetime bug in `auth/actions.ts` (noticed, unrelated).
- Per-visitor ephemeral demo accounts.
- `/stats` is linked from the landing page and middleware but no route exists in the repo; untouched.

## 12. Unresolved questions

1. **Shared vs. per-visitor demo user.** The brief says "a designated demo user", so this spec uses one shared account that is reset nightly. Concurrent recruiters will see each other's edits until the next reset. Is that acceptable, or do you want ephemeral clones?
2. **Demo write access.** Should recruiters be able to log and edit workouts (current spec: yes, with quotas), or should the demo be read-only (simpler to reason about, but "Start workout" would fail)?
3. **Achievements: derived vs. fully authored.** The brief asks the JSON to "define all demo data". This spec defines workouts, sets and routines explicitly but derives achievement rows through the existing award logic and only asserts them via `expectations`, because hand-written rows would drift from the real logic. Do you want achievements hand-authored in JSON anyway?
4. **Scheduler.** Is a Cloud Run job plus Cloud Scheduler the right mechanism for the nightly reset? Should reset also run lazily when the demo is found stale (more resilient, but adds a request-path write)?
5. **Rate limiting.** There is no limiter in the app. Is infrastructure-level limiting (Cloud Armor / API gateway) available, or should a small in-process limiter be added to `/auth/demo`?
6. **Demo email.** `demo@gains-demo.app` is a placeholder (`users.email` is `String(50)`); confirm a domain you control or prefer another.
7. **Banner and Exit demo.** The Settings **Log out** button (requested) already lets a demo visitor leave. Do you also want the always-visible demo banner with **Exit demo** / **Create account**, or is the Settings button enough (drops `DemoBanner`, the `demo_session` cookie and the layout change)?
8. **Production Alembic revision.** What does production's `alembic_version` currently report? (Blocks release if it is `54554881c8de`.)

## 13. Implementation order (after approval)

1. Copy this spec to `docs/specs/public-demo-mode.md`.
2. Add the SQLite FK hook in `database.py`; re-run `seed.py` on a throwaway SQLite file to confirm it is FK-safe. Resolve Alembic stamp (§10.1); add model flag, migration; apply locally.
3. Move `backfill_user_achievements` into the service; point the script at it.
4. Generate and commit `demo_fixture.json`; implement `services/demo.py` and `seed_demo.py`; add pytest and tests 1–7.
5. Add the endpoint, guards, worker filter; tests 8–9.
6. Frontend: actions (demo login, logout), buttons, banner, Settings logout card, pages; lint and build; manual checklist.
7. Update AGENTS.md env list and README; deploy per §10.3.
