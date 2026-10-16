from datetime import datetime, timezone

from app.models import Achievement, Exercise, UserAchievement, Workout
from app.schemas.achievement import UserAchievementResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

FREQUENCIES = range(1, 6)

PR_TYPES = ["pr_weight", "pr_distance", "pr_reps", "pr_duration"]

PR_RULES = {
    "reps+weight": [("pr_weight", "weight")],
    "duration+distance": [
        ("pr_distance", "distance_meters"),
        ("pr_duration", "duration_secs"),
    ],
    "reps": [("pr_reps", "reps")],
    "duration": [("pr_duration", "duration_secs")],
}

PR_DEFINITIONS = [
    (
        "Max Weight",
        "Lift the most weight for an exercise",
        "pr_weight",
        "trophy",
        "Highest weight lifted in a single set",
    ),
    (
        "Max Distance",
        "Go the furthest distance for an exercise",
        "pr_distance",
        "route",
        "Longest distance covered in a single set",
    ),
    (
        "Max Reps",
        "Do the most reps for an exercise",
        "pr_reps",
        "tally-5",
        "Highest rep count in a single set",
    ),
    (
        "Max Duration",
        "Exercise for the longest duration",
        "pr_duration",
        "timer",
        "Longest duration in a single set",
    ),
]

FREQUENCY_ICONS = {1: "flame", 2: "calendar", 3: "award", 4: "medal", 5: "crown"}


def seed_achievements(db: Session) -> None:
    """Insert any achievement definitions that are missing."""
    definitions = []

    for name, description, type_, icon, criteria in PR_DEFINITIONS:
        definitions.append(
            Achievement(
                name=name,
                description=description,
                type=type_,
                icon=icon,
                criteria=criteria,
            )
        )

    for frequency in FREQUENCIES:
        plural = "s" if frequency > 1 else ""
        description = (
            f"Max consecutive weeks with at least {frequency} workout{plural} per week"
        )
        definitions.append(
            Achievement(
                name=f"{frequency}x/week Streak",
                description=description,
                type=_streak_type(frequency),
                icon=FREQUENCY_ICONS[frequency],
                criteria=description,
            )
        )

    existing_types = set(db.execute(select(Achievement.type)).scalars().all())
    for definition in definitions:
        if definition.type not in existing_types:
            db.add(definition)

    db.commit()


def check_and_award_prs(
    db: Session, user_id: int, workout_id: int, workout: Workout
) -> list[UserAchievementResponse]:
    """Award or update personal-record achievements for the sets in a workout."""
    sets_by_exercise = {}
    for workout_set in workout.sets:
        sets_by_exercise.setdefault(workout_set.exercise_id, []).append(workout_set)

    if not sets_by_exercise:
        return []

    exercise_ids = list(sets_by_exercise.keys())
    exercises = _get_exercises(db, exercise_ids)
    achievements = _get_achievements_by_type(db, PR_TYPES)

    existing_prs = {}
    stmt = (
        select(UserAchievement)
        .join(Achievement, UserAchievement.achievement_id == Achievement.id)
        .where(
            UserAchievement.user_id == user_id,
            UserAchievement.exercise_id.in_(exercise_ids),
            Achievement.type.in_(PR_TYPES),
        )
    )
    for user_achievement in db.execute(stmt).scalars():
        key = (user_achievement.achievement_id, user_achievement.exercise_id)
        existing_prs[key] = user_achievement

    now = datetime.now(timezone.utc)
    changed = []

    for exercise_id, sets in sets_by_exercise.items():
        exercise = exercises.get(exercise_id)
        if exercise is None:
            continue

        for pr_type, field in PR_RULES.get(exercise.metrics, []):
            achievement = achievements.get(pr_type)
            best = _best_value(sets, field)
            if achievement is None or best is None:
                continue

            row = _record_if_better(
                existing_prs.get((achievement.id, exercise_id)),
                value=best,
                now=now,
                user_id=user_id,
                achievement_id=achievement.id,
                workout_id=workout_id,
                exercise_id=exercise_id,
            )
            if row is not None:
                db.add(row)
                changed.append(row)

    return _commit_and_serialize(db, changed)


def check_and_award_frequency_streaks(
    db: Session, user_id: int, workout_id: int
) -> list[UserAchievementResponse]:
    """Award or update weekly-frequency streak achievements."""
    from app.services.workout import calculate_current_frequency_streaks

    streaks = calculate_current_frequency_streaks(db, user_id)

    streak_types = []
    for frequency in FREQUENCIES:
        if streaks.get(frequency, 0) > 0:
            streak_types.append(_streak_type(frequency))

    if not streak_types:
        return []

    achievements = _get_achievements_by_type(db, streak_types)

    existing_streaks = {}
    stmt = (
        select(UserAchievement)
        .join(Achievement, UserAchievement.achievement_id == Achievement.id)
        .where(
            UserAchievement.user_id == user_id,
            Achievement.type.in_(streak_types),
        )
    )
    for user_achievement in db.execute(stmt).scalars():
        existing_streaks[user_achievement.achievement_id] = user_achievement

    now = datetime.now(timezone.utc)
    changed = []

    for frequency in FREQUENCIES:
        streak = streaks.get(frequency, 0)
        achievement = achievements.get(_streak_type(frequency))
        if streak <= 0 or achievement is None:
            continue

        row = _record_if_better(
            existing_streaks.get(achievement.id),
            value=streak,
            now=now,
            user_id=user_id,
            achievement_id=achievement.id,
            workout_id=workout_id,
        )
        if row is not None:
            db.add(row)
            changed.append(row)

    return _commit_and_serialize(db, changed)


def get_user_achievements(db: Session, user_id: int) -> list[UserAchievementResponse]:
    stmt = (
        select(UserAchievement)
        .options(selectinload(UserAchievement.achievement))
        .where(UserAchievement.user_id == user_id)
        .order_by(UserAchievement.unlocked_at.desc())
    )
    return _serialize(db.execute(stmt).scalars().all())


def get_achievements_for_exercise(
    db: Session, user_id: int, exercise_id: int
) -> list[UserAchievementResponse]:
    stmt = (
        select(UserAchievement)
        .options(selectinload(UserAchievement.achievement))
        .where(
            UserAchievement.user_id == user_id,
            UserAchievement.exercise_id == exercise_id,
        )
    )
    return _serialize(db.execute(stmt).scalars().all())


def get_achievements_for_workout(
    db: Session, user_id: int, workout_id: int
) -> list[UserAchievementResponse]:
    stmt = (
        select(UserAchievement)
        .options(selectinload(UserAchievement.achievement))
        .where(
            UserAchievement.user_id == user_id,
            UserAchievement.workout_id == workout_id,
        )
    )
    return _serialize(db.execute(stmt).scalars().all())


def _streak_type(frequency: int) -> str:
    return f"freq_streak_{frequency}"


def _get_exercises(db: Session, exercise_ids: list[int]) -> dict[int, Exercise]:
    exercises = {}
    stmt = select(Exercise).where(Exercise.id.in_(exercise_ids))
    for exercise in db.execute(stmt).scalars():
        exercises[exercise.id] = exercise
    return exercises


def _get_achievements_by_type(db: Session, types: list[str]) -> dict[str, Achievement]:
    achievements = {}
    stmt = select(Achievement).where(Achievement.type.in_(types))
    for achievement in db.execute(stmt).scalars():
        achievements[achievement.type] = achievement
    return achievements


def _best_value(sets, field: str):
    best = None
    for workout_set in sets:
        value = getattr(workout_set, field)
        if value and (best is None or value > best):
            best = value
    return best


def _record_if_better(
    existing: UserAchievement | None,
    *,
    value: float,
    now: datetime,
    user_id: int,
    achievement_id: int,
    workout_id: int,
    exercise_id: int | None = None,
) -> UserAchievement | None:
    """Return a new or updated row on a first award or a new record, else None."""
    if existing is None:
        return UserAchievement(
            user_id=user_id,
            achievement_id=achievement_id,
            exercise_id=exercise_id,
            value=value,
            workout_id=workout_id,
            unlocked_at=now,
        )

    if value > existing.value:
        existing.value = value
        existing.workout_id = workout_id
        existing.unlocked_at = now
        return existing

    return None


def _commit_and_serialize(
    db: Session, rows: list[UserAchievement]
) -> list[UserAchievementResponse]:
    if not rows:
        return []

    db.commit()
    for row in rows:
        db.refresh(row)
    return _serialize(rows)


def _serialize(rows) -> list[UserAchievementResponse]:
    responses = []
    for row in rows:
        responses.append(UserAchievementResponse.model_validate(row))
    return responses
