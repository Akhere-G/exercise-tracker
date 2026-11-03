import csv
import io
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BodyWeight, Exercise, Routine, Workout, WorkoutSet

WORKOUT_COLUMNS = [
    "Date",
    "Workout Name",
    "Duration (min)",
    "Exercise Name",
    "Set Order",
    "Set Type",
    "Weight (kg)",
    "Reps",
    "RPE",
    "RIR",
    "Distance (m)",
    "Seconds",
]
BODY_WEIGHT_COLUMNS = ["Date", "Weight (kg)"]

_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _safe(value: Any) -> Any:
    """Stops spreadsheet apps running user text as a formula."""
    if isinstance(value, str) and value.startswith(_FORMULA_PREFIXES):
        return "'" + value
    return "" if value is None else value


def _to_csv(columns: list[str], rows: Iterable[list[Any]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(columns)
    for row in rows:
        writer.writerow([_safe(cell) for cell in row])
    return buffer.getvalue()


def workouts_csv(db: Session, user_id: int) -> str:
    stmt = (
        select(Workout, WorkoutSet, Exercise.name, Routine.name)
        .join(WorkoutSet, WorkoutSet.workout_id == Workout.id)
        .join(Exercise, Exercise.id == WorkoutSet.exercise_id)
        .outerjoin(Routine, Routine.id == Workout.routine_id)
        .where(Workout.user_id == user_id)
        .order_by(Workout.completed_at, Workout.id, WorkoutSet.id)
    )

    rows = [
        [
            workout.completed_at.isoformat(sep=" ", timespec="seconds"),
            routine_name or "Workout",
            round(workout.duration / 60, 1),
            exercise_name,
            workout_set.set_index,
            workout_set.set_type,
            workout_set.weight,
            workout_set.reps,
            workout_set.rpe,
            workout_set.rir,
            workout_set.distance_meters,
            workout_set.duration_secs,
        ]
        for workout, workout_set, exercise_name, routine_name in db.execute(stmt)
    ]
    return _to_csv(WORKOUT_COLUMNS, rows)


def body_weights_csv(db: Session, user_id: int) -> str:
    stmt = (
        select(BodyWeight)
        .where(BodyWeight.user_id == user_id)
        .order_by(BodyWeight.measured_on)
    )
    rows = [
        [entry.measured_on.isoformat(), entry.weight_kg]
        for entry in db.execute(stmt).scalars()
    ]
    return _to_csv(BODY_WEIGHT_COLUMNS, rows)
