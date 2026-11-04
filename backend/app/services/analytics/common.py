"""Helpers shared by the analytics calculations."""

from collections import defaultdict
from datetime import date, datetime
from typing import Optional

from app.constants.muscle_groups import (
    group_for_muscle,
)
from app.models import (
    ExerciseMuscle,
    Muscle,
    Workout,
    WorkoutSet,
)
from app.services import workout as workout_service
from sqlalchemy import select
from sqlalchemy.orm import Session

PRIMARY_WEIGHT = 1.0
SECONDARY_WEIGHT = 0.5


def today() -> date:
    return workout_service.date.today()


def estimate_one_rep_max(weight: float, reps: int) -> float:
    """Epley formula."""
    return weight * (1 + reps / 30)


def group_weights(muscles: list[tuple[str, str]]) -> dict[str, float]:
    """A set's weight per group, counting a group once at its strongest role."""
    weights: dict[str, float] = {}
    for name, contribution in muscles:
        group = group_for_muscle(name)
        if group is None:
            continue
        weight = PRIMARY_WEIGHT if contribution == "primary" else SECONDARY_WEIGHT
        weights[group] = max(weights.get(group, 0.0), weight)
    return weights


def working_sets_with_groups(
    db: Session, user_id: int, since: datetime
) -> list[tuple[datetime, Optional[int], Optional[float], dict[str, float]]]:
    """Each working set's time, reps, weight and muscle group weights."""
    sets_stmt = (
        select(
            WorkoutSet.id,
            WorkoutSet.exercise_id,
            Workout.completed_at,
            WorkoutSet.reps,
            WorkoutSet.weight,
        )
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .where(
            Workout.user_id == user_id,
            Workout.completed_at >= since,
            WorkoutSet.set_type != "warmup",
        )
    )
    rows = db.execute(sets_stmt).all()
    if not rows:
        return []

    exercise_ids = list({row.exercise_id for row in rows})
    muscle_stmt = (
        select(
            ExerciseMuscle.exercise_id,
            Muscle.name,
            ExerciseMuscle.contribution_type,
        )
        .join(Muscle, Muscle.id == ExerciseMuscle.muscle_id)
        .where(ExerciseMuscle.exercise_id.in_(exercise_ids))
    )
    by_exercise: dict[int, list[tuple[str, str]]] = defaultdict(list)
    for exercise_id, name, contribution in db.execute(muscle_stmt):
        by_exercise[exercise_id].append((name, contribution))

    weights_by_exercise = {
        exercise_id: group_weights(muscles)
        for exercise_id, muscles in by_exercise.items()
    }
    return [
        (
            row.completed_at,
            row.reps,
            row.weight,
            weights_by_exercise.get(row.exercise_id, {}),
        )
        for row in rows
    ]
