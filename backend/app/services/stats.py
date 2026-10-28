from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import Optional

from app.models import (
    Achievement,
    Exercise,
    ExerciseMuscle,
    Muscle,
    UserAchievement,
    Workout,
    WorkoutSet,
)
from app.models.achievement import AchievementType
from app.services import workout as workout_service
from sqlalchemy import func, select
from sqlalchemy.orm import Session

PR_TYPES = (
    AchievementType.PR_WEIGHT,
    AchievementType.PR_DISTANCE,
    AchievementType.PR_REPS,
    AchievementType.PR_DURATION,
)
TOP_EXERCISE_LIMIT = 5
PERSONAL_RECORD_LIMIT = 10


def get_stats(
    db: Session,
    user_id: int,
    start: Optional[date] = None,
    end: Optional[date] = None,
) -> dict:
    workouts = _get_workout_totals(db, user_id, start, end)

    return {
        "overview": _build_overview(db, user_id, workouts),
        "trends": _build_trends(workouts, start, end),
        "muscles": get_muscle_breakdown(db, user_id, start, end),
        "top_exercises": get_top_exercises(db, user_id, start, end),
        "personal_records": get_personal_records(db, user_id),
    }


def get_muscle_breakdown(
    db: Session,
    user_id: int,
    start: Optional[date] = None,
    end: Optional[date] = None,
) -> list[dict]:
    stmt = (
        select(
            Muscle.name,
            ExerciseMuscle.contribution_type,
            func.count(WorkoutSet.id),
        )
        .select_from(WorkoutSet)
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .join(ExerciseMuscle, ExerciseMuscle.exercise_id == WorkoutSet.exercise_id)
        .join(Muscle, Muscle.id == ExerciseMuscle.muscle_id)
        .where(Workout.user_id == user_id)
        .group_by(Muscle.name, ExerciseMuscle.contribution_type)
    )
    stmt = _filter_range(stmt, start, end)

    muscles: dict[str, dict] = defaultdict(
        lambda: {"primary_sets": 0, "secondary_sets": 0}
    )
    for name, contribution_type, set_count in db.execute(stmt):
        field = (
            "primary_sets" if contribution_type == "primary" else "secondary_sets"
        )
        muscles[name][field] += set_count

    breakdown = [{"name": name, **counts} for name, counts in muscles.items()]
    breakdown.sort(
        key=lambda m: (-(m["primary_sets"] + m["secondary_sets"]), m["name"])
    )
    return breakdown


def get_top_exercises(
    db: Session,
    user_id: int,
    start: Optional[date] = None,
    end: Optional[date] = None,
    limit: int = TOP_EXERCISE_LIMIT,
) -> list[dict]:
    set_count = func.count(WorkoutSet.id).label("set_count")
    stmt = (
        select(
            Exercise.id,
            Exercise.name,
            set_count,
            func.count(func.distinct(Workout.id)).label("workout_count"),
            func.max(Workout.completed_at).label("last_used"),
        )
        .select_from(WorkoutSet)
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .join(Exercise, Exercise.id == WorkoutSet.exercise_id)
        .where(Workout.user_id == user_id)
        .group_by(Exercise.id, Exercise.name)
        .order_by(set_count.desc(), Exercise.name)
        .limit(limit)
    )
    stmt = _filter_range(stmt, start, end)

    return [row._asdict() for row in db.execute(stmt)]


def get_personal_records(
    db: Session, user_id: int, limit: int = PERSONAL_RECORD_LIMIT
) -> list[dict]:
    """Most recent PRs. PRs are all-time bests, so they ignore the date range."""
    stmt = (
        select(
            UserAchievement.id,
            Achievement.type,
            UserAchievement.value,
            UserAchievement.exercise_id,
            Exercise.name.label("exercise_name"),
            UserAchievement.unlocked_at,
        )
        .join(Achievement, Achievement.id == UserAchievement.achievement_id)
        .join(Exercise, Exercise.id == UserAchievement.exercise_id)
        .where(
            UserAchievement.user_id == user_id,
            Achievement.type.in_(PR_TYPES),
            UserAchievement.value.is_not(None),
        )
        .order_by(UserAchievement.unlocked_at.desc(), UserAchievement.id.desc())
        .limit(limit)
    )

    return [row._asdict() for row in db.execute(stmt)]


def _get_workout_totals(
    db: Session, user_id: int, start: Optional[date], end: Optional[date]
):
    """One row per workout with its set count, volume and distance."""
    stmt = (
        select(
            Workout.completed_at,
            Workout.duration,
            func.count(WorkoutSet.id).label("set_count"),
            func.coalesce(func.sum(WorkoutSet.reps * WorkoutSet.weight), 0.0).label(
                "volume"
            ),
            func.coalesce(func.sum(WorkoutSet.distance_meters), 0.0).label(
                "distance_meters"
            ),
        )
        .select_from(Workout)
        .outerjoin(WorkoutSet, WorkoutSet.workout_id == Workout.id)
        .where(Workout.user_id == user_id)
        .group_by(Workout.id, Workout.completed_at, Workout.duration)
        .order_by(Workout.completed_at)
    )
    stmt = _filter_range(stmt, start, end)

    return db.execute(stmt).all()


def _build_overview(db: Session, user_id: int, workouts) -> dict:
    workout_count = len(workouts)
    total_duration = sum(w.duration for w in workouts)
    weekly_streak = workout_service.calculate_current_frequency_streaks(db, user_id)[1]

    return {
        "workout_count": workout_count,
        "total_sets": sum(w.set_count for w in workouts),
        "total_volume": sum(w.volume for w in workouts),
        "total_distance_meters": sum(w.distance_meters for w in workouts),
        "total_duration_secs": total_duration,
        "average_duration_secs": (
            round(total_duration / workout_count) if workout_count else 0
        ),
        "active_days": len({w.completed_at.date() for w in workouts}),
        "weekly_streak": weekly_streak,
    }


def _build_trends(
    workouts, start: Optional[date], end: Optional[date]
) -> list[dict]:
    """Workouts, volume and time per week, with empty weeks filled in."""
    weeks: dict[date, dict] = {}

    first_week = (
        workout_service._week_start(start)
        if start is not None
        else workout_service._week_start(workouts[0].completed_at.date())
        if workouts
        else None
    )
    if first_week is None:
        return []

    last_week = workout_service._week_start(end if end is not None else date.today())
    week = first_week
    while week <= last_week:
        weeks[week] = {
            "week_start": week,
            "workout_count": 0,
            "total_volume": 0.0,
            "total_duration_secs": 0,
        }
        week += workout_service.ONE_WEEK

    for workout in workouts:
        bucket = weeks.get(workout_service._week_start(workout.completed_at.date()))
        if bucket is None:
            continue
        bucket["workout_count"] += 1
        bucket["total_volume"] += workout.volume
        bucket["total_duration_secs"] += workout.duration

    return list(weeks.values())


def _filter_range(stmt, start: Optional[date], end: Optional[date]):
    if start is not None:
        stmt = stmt.where(Workout.completed_at >= datetime.combine(start, time.min))
    if end is not None:
        stmt = stmt.where(
            Workout.completed_at < datetime.combine(end + timedelta(days=1), time.min)
        )
    return stmt
