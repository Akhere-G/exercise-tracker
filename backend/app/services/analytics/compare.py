"""Comparisons between periods and between exercises."""

from datetime import date, timedelta
from typing import Optional

from app.models import (
    Exercise,
    Workout,
    WorkoutSet,
)
from app.services import stats as stats_service
from pydantic.alias_generators import to_camel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .common import estimate_one_rep_max

MAX_COMPARED_EXERCISES = 3

COMPARED_FIELDS = (
    "workout_count",
    "total_sets",
    "total_volume",
    "total_duration_secs",
    "average_duration_secs",
    "active_days",
)


def compare_periods(db: Session, user_id: int, start: date, end: date) -> dict:
    """The overview for a range next to the range of equal length just before it."""
    length = (end - start).days + 1
    previous_end = start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=length - 1)

    def overview(range_start: date, range_end: date) -> dict:
        workouts = stats_service._get_workout_totals(
            db, user_id, range_start, range_end
        )
        return stats_service._build_overview(db, user_id, workouts)

    current = overview(start, end)
    previous = overview(previous_start, previous_end)

    deltas = {}
    for field in COMPARED_FIELDS:
        change = current[field] - previous[field]
        deltas[to_camel(field)] = {
            "change": change,
            "percent": (
                round(change / previous[field] * 100, 1) if previous[field] else None
            ),
        }
    return {"current": current, "previous": previous, "deltas": deltas}


def compare_exercises(
    db: Session,
    user_id: int,
    exercise_ids: list[int],
    start: Optional[date] = None,
    end: Optional[date] = None,
) -> list[dict]:
    """Per-session strength and volume for each exercise, oldest first."""
    exercise_ids = list(dict.fromkeys(exercise_ids))[:MAX_COMPARED_EXERCISES]
    names = {
        exercise_id: name
        for exercise_id, name in db.execute(
            select(Exercise.id, Exercise.name).where(Exercise.id.in_(exercise_ids))
        ).all()
    }

    stmt = (
        select(
            WorkoutSet.exercise_id,
            Workout.id,
            Workout.completed_at,
            WorkoutSet.weight,
            WorkoutSet.reps,
        )
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .where(
            Workout.user_id == user_id,
            WorkoutSet.exercise_id.in_(list(names)),
            WorkoutSet.set_type != "warmup",
        )
        .order_by(Workout.completed_at, Workout.id)
    )
    stmt = stats_service._filter_range(stmt, start, end)

    sessions: dict[int, dict[int, dict]] = {i: {} for i in names}
    for exercise_id, workout_id, completed_at, weight, reps in db.execute(stmt):
        session = sessions[exercise_id].setdefault(
            workout_id,
            {
                "day": completed_at.date(),
                "estimated_one_rep_max": None,
                "top_weight": None,
                "volume": 0.0,
            },
        )
        if weight and reps:
            one_rm = estimate_one_rep_max(weight, reps)
            session["volume"] += weight * reps
            session["estimated_one_rep_max"] = max(
                session["estimated_one_rep_max"] or 0.0, round(one_rm, 1)
            )
        if weight:
            session["top_weight"] = max(session["top_weight"] or 0.0, weight)

    return [
        {
            "exercise_id": exercise_id,
            "name": names[exercise_id],
            "sessions": list(sessions[exercise_id].values()),
        }
        for exercise_id in exercise_ids
        if exercise_id in names
    ]
