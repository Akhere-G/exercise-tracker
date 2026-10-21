import json
import secrets
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any

from app.models import (
    Exercise,
    Notification,
    NotificationSubscription,
    Routine,
    RoutineItem,
    User,
    UserAchievement,
    Workout,
    WorkoutSet,
)
from app.schemas.routine import RoutineItemCreate
from app.schemas.workout import WorkoutSetCreate
from app.services import achievement as achievement_service
from app.services import user as user_service
from app.services import workout as workout_service
from pydantic import ValidationError
from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

DEFAULT_FIXTURE_PATH = Path(__file__).resolve().parents[2] / "demo_fixture.json"
SCHEMA_VERSION = 1
DEMO_MAX_WORKOUTS = 100
DEMO_MAX_ROUTINES = 20
RESET_LOCK_KEY = 724001
MIN_WORKOUT_TIME = time(11, 0)
MAX_WORKOUT_TIME = time(14, 0)

# Fields each exercise `metrics` value must (and must not) have on a set.
METRIC_FIELDS = {
    "reps+weight": {"reps", "weight"},
    "reps": {"reps"},
    "duration": {"duration_secs"},
    "duration+distance": {"duration_secs", "distance_meters"},
}
ALL_SET_FIELDS = {"reps", "weight", "duration_secs", "distance_meters"}


class DemoSeedError(Exception):
    """Raised when the demo fixture or target database is unsafe to seed."""


@dataclass
class DemoResetSummary:
    user_id: int
    created_user: bool
    routines: int
    workouts: int
    sets: int
    achievements: int


def load_fixture(path: Path | str = DEFAULT_FIXTURE_PATH) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as fixture_file:
        return json.load(fixture_file)


def get_demo_user(db: Session) -> User | None:
    stmt = select(User).where(User.is_demo.is_(True))
    return db.execute(stmt).scalars().first()


def is_quota_exceeded(db: Session, user: User) -> dict[str, bool]:
    """Whether a demo user has reached the workout / routine caps."""
    if not user.is_demo:
        return {"workouts": False, "routines": False}

    workouts = db.execute(
        select(func.count()).select_from(Workout).where(Workout.user_id == user.id)
    ).scalar_one()
    routines = db.execute(
        select(func.count()).select_from(Routine).where(Routine.user_id == user.id)
    ).scalar_one()
    return {
        "workouts": workouts >= DEMO_MAX_WORKOUTS,
        "routines": routines >= DEMO_MAX_ROUTINES,
    }


def get_catalogue(db: Session, exercise_ids: set[int]) -> dict[int, tuple[str, str]]:
    stmt = select(Exercise.id, Exercise.name, Exercise.metrics).where(
        Exercise.id.in_(exercise_ids)
    )
    return {row.id: (row.name, row.metrics) for row in db.execute(stmt)}


def resolve_completed_at(workout: dict[str, Any], today: date) -> datetime:
    monday = today - timedelta(days=today.weekday())
    day = monday + timedelta(days=7 * workout["weekOffset"] + workout["weekday"])
    return datetime.combine(day, time.fromisoformat(workout["completedTime"]))


def validate_fixture(
    fixture: dict[str, Any],
    catalogue: dict[int, tuple[str, str]],
    today: date,
    now: datetime,
) -> dict[str, datetime]:
    """Check the fixture against the catalogue. Returns {workout key: completed_at}."""
    if fixture.get("schemaVersion") != SCHEMA_VERSION:
        raise DemoSeedError(f"Unsupported fixture schemaVersion: {fixture.get('schemaVersion')}")

    user = fixture.get("user") or {}
    if not user.get("email") or not user.get("username"):
        raise DemoSeedError("Fixture user needs a username and email.")
    if len(user["email"]) > 50 or len(user["username"]) > 50:
        raise DemoSeedError("Fixture username/email exceed the 50 character column limit.")

    expected = {e["id"]: (e["name"], e["metrics"]) for e in fixture.get("exercises", [])}
    for exercise_id, (name, metrics) in expected.items():
        actual = catalogue.get(exercise_id)
        if actual is None:
            raise DemoSeedError(f"Exercise {exercise_id} does not exist in the database.")
        if actual != (name, metrics):
            raise DemoSeedError(
                f"Exercise {exercise_id} is {actual}, fixture expects {(name, metrics)}."
            )

    routine_keys: set[str] = set()
    for routine in fixture.get("routines", []):
        if routine["key"] in routine_keys:
            raise DemoSeedError(f"Duplicate routine key {routine['key']}.")
        routine_keys.add(routine["key"])
        if not 0 <= routine["day"] <= 6:
            raise DemoSeedError(f"Routine {routine['key']} has an invalid day.")
        if routine.get("startTime") is not None:
            raise DemoSeedError("Demo routines must not have a startTime (reminder pushes).")

        seen_ids: set[int] = set()
        seen_orders: set[int] = set()
        for item in routine["items"]:
            if item["exerciseId"] not in expected:
                raise DemoSeedError(f"Routine item uses unlisted exercise {item['exerciseId']}.")
            if item["exerciseId"] in seen_ids or item["order"] in seen_orders:
                raise DemoSeedError(f"Routine {routine['key']} repeats an exercise or order.")
            seen_ids.add(item["exerciseId"])
            seen_orders.add(item["order"])
            _validate_model(RoutineItemCreate, item)

    completed: dict[str, datetime] = {}
    best_weight: dict[int, float] = {}
    workouts = sorted(
        fixture.get("workouts", []),
        key=lambda w: resolve_completed_at(w, today),
    )
    for workout in workouts:
        key = workout["key"]
        if key in completed:
            raise DemoSeedError(f"Duplicate workout key {key}.")
        if workout["routineKey"] is not None and workout["routineKey"] not in routine_keys:
            raise DemoSeedError(f"Workout {key} references unknown routine.")
        if not 0 <= workout["weekday"] <= 6 or workout["weekOffset"] > -1:
            raise DemoSeedError(f"Workout {key} has an invalid weekday/weekOffset.")
        if workout["durationSecs"] <= 0:
            raise DemoSeedError(f"Workout {key} has no duration.")

        at = resolve_completed_at(workout, today)
        if not MIN_WORKOUT_TIME <= at.time() <= MAX_WORKOUT_TIME:
            raise DemoSeedError(f"Workout {key} time must be between 11:00 and 14:00.")
        if at >= now:
            raise DemoSeedError(f"Workout {key} resolves to the future ({at}).")
        completed[key] = at

        indexes: dict[int, list[int]] = {}
        session_best: dict[int, float] = {}
        for set_data in workout["sets"]:
            exercise_id = set_data["exerciseId"]
            if exercise_id not in expected:
                raise DemoSeedError(f"Workout {key} uses unlisted exercise {exercise_id}.")
            parsed = _validate_model(WorkoutSetCreate, set_data)
            _validate_metric_fields(key, expected[exercise_id][1], parsed)
            indexes.setdefault(exercise_id, []).append(set_data["setIndex"])
            if parsed.weight is not None:
                if parsed.weight != int(parsed.weight):
                    raise DemoSeedError(f"Workout {key}: weights must be whole numbers.")
                session_best[exercise_id] = max(session_best.get(exercise_id, 0), parsed.weight)

        for exercise_id, found in indexes.items():
            if found != list(range(1, len(found) + 1)):
                raise DemoSeedError(f"Workout {key}: set indexes for {exercise_id} are not 1..n.")

        for exercise_id, best in session_best.items():
            if best < best_weight.get(exercise_id, 0):
                raise DemoSeedError(f"Workout {key}: weight for {exercise_id} goes down.")
            best_weight[exercise_id] = best

    return completed


def reset_demo_user(
    db: Session,
    fixture: dict[str, Any],
    *,
    today: date | None = None,
    now: datetime | None = None,
    commit: bool = True,
) -> DemoResetSummary:
    """Delete and recreate the demo user's data from the fixture.

    Only rows owned by the (vetted) demo user are ever written or deleted.
    """
    today = today or date.today()
    now = now or datetime.now()

    _require_foreign_keys(db)

    exercise_ids = {e["id"] for e in fixture.get("exercises", [])}
    catalogue = get_catalogue(db, exercise_ids)
    completed = validate_fixture(fixture, catalogue, today, now)

    email = fixture["user"]["email"]
    existing = user_service.get_user_by_email(db, email=email)
    if existing is not None and not existing.is_demo:
        raise DemoSeedError(
            f"{email} belongs to a non-demo user; refusing to touch it."
        )

    demo_count = db.execute(
        select(func.count()).select_from(User).where(User.is_demo.is_(True))
    ).scalar_one()
    if demo_count > 1 or (demo_count == 1 and existing is None):
        raise DemoSeedError("A different demo user already exists.")

    try:
        if db.get_bind().dialect.name == "postgresql":
            db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": RESET_LOCK_KEY})

        created = existing is None
        user = existing or User(email=email, is_demo=True)
        user.username = fixture["user"]["username"]
        user.password_hash = user_service.get_password_hash(secrets.token_urlsafe(32))
        db.add(user)
        db.flush()

        if user.is_demo is not True or user.id is None:
            raise DemoSeedError("Refusing to reset a user that is not the demo user.")
        demo_id = user.id

        _delete_demo_data(db, demo_id)

        routine_ids = _insert_routines(db, demo_id, fixture)
        set_count = _insert_workouts(db, demo_id, fixture, routine_ids, completed)
        db.flush()

        achievements = achievement_service.backfill_user_achievements(db, demo_id)
        db.execute(
            update(UserAchievement)
            .where(
                UserAchievement.user_id == demo_id,
                UserAchievement.workout_id.is_not(None),
            )
            .values(
                unlocked_at=select(Workout.completed_at)
                .where(Workout.id == UserAchievement.workout_id)
                .scalar_subquery()
            )
            .execution_options(synchronize_session=False)
        )
        db.flush()

        _verify_expectations(db, demo_id, fixture, today)

        summary = DemoResetSummary(
            user_id=demo_id,
            created_user=created,
            routines=len(routine_ids),
            workouts=len(fixture["workouts"]),
            sets=set_count,
            achievements=len(achievements),
        )
        if commit:
            db.commit()
        else:
            db.rollback()
        return summary
    except Exception:
        db.rollback()
        raise


def _validate_model(model, data: dict[str, Any]):
    try:
        return model.model_validate(data)
    except ValidationError as error:
        raise DemoSeedError(f"Invalid fixture entry {data}: {error}") from error


def _validate_metric_fields(key: str, metrics: str, parsed: WorkoutSetCreate) -> None:
    required = METRIC_FIELDS.get(metrics)
    if required is None:
        raise DemoSeedError(f"Unknown exercise metrics {metrics}.")
    for field in ALL_SET_FIELDS:
        value = getattr(parsed, field)
        if field in required and not value:
            raise DemoSeedError(f"Workout {key}: {metrics} set is missing {field}.")
        if field not in required and value is not None:
            raise DemoSeedError(f"Workout {key}: {metrics} set must not have {field}.")


def _require_foreign_keys(db: Session) -> None:
    bind = db.get_bind()
    if bind.dialect.name == "sqlite":
        enabled = db.execute(text("PRAGMA foreign_keys")).scalar()
        if enabled != 1:
            raise DemoSeedError(
                "SQLite foreign keys are off; ON DELETE cascades would not run."
            )


def _delete_demo_data(db: Session, demo_id: int) -> None:
    # Foreign keys cascade workouts -> workout_sets and routines -> routine_items.
    # Notifications and subscriptions have no ondelete, so they are explicit.
    for model in (
        UserAchievement,
        Workout,
        Routine,
        Notification,
        NotificationSubscription,
    ):
        db.execute(
            model.__table__.delete()
            .where(model.__table__.c.user_id == demo_id)
            .execution_options(synchronize_session=False)
        )
    db.expire_all()


def _insert_routines(db: Session, demo_id: int, fixture: dict[str, Any]) -> dict[str, int]:
    routines: dict[str, Routine] = {}
    for data in fixture["routines"]:
        routine = Routine(
            name=data["name"],
            user_id=demo_id,
            day=data["day"],
            start_time=None,
            routine_items=[
                RoutineItem(
                    exercise_id=item["exerciseId"],
                    target_sets=item["targetSets"],
                    target_reps=item["targetReps"],
                    target_duration_secs=item["targetDurationSecs"],
                    order=item["order"],
                )
                for item in data["items"]
            ],
        )
        db.add(routine)
        routines[data["key"]] = routine
    db.flush()
    return {key: routine.id for key, routine in routines.items()}


def _insert_workouts(
    db: Session,
    demo_id: int,
    fixture: dict[str, Any],
    routine_ids: dict[str, int],
    completed: dict[str, datetime],
) -> int:
    set_count = 0
    for data in sorted(fixture["workouts"], key=lambda w: completed[w["key"]]):
        db.add(
            Workout(
                user_id=demo_id,
                routine_id=routine_ids.get(data["routineKey"]),
                completed_at=completed[data["key"]],
                duration=data["durationSecs"],
                sets=[
                    WorkoutSet(
                        exercise_id=s["exerciseId"],
                        set_index=s["setIndex"],
                        reps=s["reps"],
                        weight=s["weight"],
                        duration_secs=s["durationSecs"],
                        distance_meters=s["distanceMeters"],
                    )
                    for s in data["sets"]
                ],
            )
        )
        set_count += len(data["sets"])
    return set_count


def _verify_expectations(
    db: Session, demo_id: int, fixture: dict[str, Any], today: date
) -> None:
    expectations = fixture.get("expectations")
    if not expectations:
        return

    count = db.execute(
        select(func.count()).select_from(Workout).where(Workout.user_id == demo_id)
    ).scalar_one()
    if count != expectations["workoutCount"]:
        raise DemoSeedError(f"Expected {expectations['workoutCount']} workouts, got {count}.")

    # Streak maths reads date.today() internally, so only check against the real date.
    if today == date.today():
        stats = workout_service.get_stats(db, demo_id)
        if stats["weeklyStreak"] != expectations["weeklyStreak"]:
            raise DemoSeedError(f"Unexpected weekly streak: {stats['weeklyStreak']}.")
        streaks = workout_service.calculate_current_frequency_streaks(db, demo_id)
        for frequency, value in expectations["frequencyStreaks"].items():
            if streaks[int(frequency)] != value:
                raise DemoSeedError(f"Unexpected {frequency}x/week streak: {streaks}.")

    pr_ids = set(
        db.execute(
            select(UserAchievement.exercise_id).where(
                UserAchievement.user_id == demo_id,
                UserAchievement.exercise_id.is_not(None),
            )
        ).scalars()
    )
    missing = set(expectations["prExerciseIds"]) - pr_ids
    if missing:
        raise DemoSeedError(f"No PR achievements derived for exercises {sorted(missing)}.")
