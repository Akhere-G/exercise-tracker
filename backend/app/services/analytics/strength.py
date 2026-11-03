"""Strength levels relative to body weight."""

from datetime import datetime, time, timedelta
from typing import Optional

from app.constants.strength_standards import LEVELS, STANDARD_LIFTS, sex_factor
from app.models import (
    Exercise,
    Workout,
    WorkoutSet,
)
from app.services import body as body_service
from app.services import profile as profile_service
from sqlalchemy import select
from sqlalchemy.orm import Session

from .common import estimate_one_rep_max, today

STRENGTH_WINDOW_DAYS = 180


def _level_for(
    ratio: float, multiples: list[float]
) -> tuple[Optional[str], Optional[str], float]:
    """The level reached, the next one, and progress towards it from 0 to 1."""
    reached = -1
    for i, threshold in enumerate(multiples):
        if ratio >= threshold:
            reached = i
    level = LEVELS[reached] if reached >= 0 else None

    if reached == len(LEVELS) - 1:
        return level, None, 1.0

    next_threshold = multiples[reached + 1]
    floor = multiples[reached] if reached >= 0 else 0.0
    progress = (ratio - floor) / (next_threshold - floor)
    return level, LEVELS[reached + 1], max(0.0, min(progress, 1.0))


def get_strength_standards(db: Session, user_id: int) -> dict:
    profile = profile_service.get_or_create_profile(db, user_id)
    latest = body_service.get_latest_body_weight(db, user_id)
    body_weight = latest.weight_kg if latest else None
    factor = sex_factor(profile.sex)

    since = datetime.combine(today() - timedelta(days=STRENGTH_WINDOW_DAYS), time.min)
    names = [lift["name"] for lift in STANDARD_LIFTS.values()]
    exercise_ids = {
        name: exercise_id
        for name, exercise_id in db.execute(
            select(Exercise.name, Exercise.id).where(Exercise.name.in_(names))
        ).all()
    }
    best: dict[int, float] = {}
    if exercise_ids:
        stmt = (
            select(WorkoutSet.exercise_id, WorkoutSet.weight, WorkoutSet.reps)
            .join(Workout, Workout.id == WorkoutSet.workout_id)
            .where(
                Workout.user_id == user_id,
                Workout.completed_at >= since,
                WorkoutSet.exercise_id.in_(list(exercise_ids.values())),
                WorkoutSet.set_type != "warmup",
                WorkoutSet.weight > 0,
                WorkoutSet.reps > 0,
            )
        )
        for exercise_id, weight, reps in db.execute(stmt):
            one_rm = estimate_one_rep_max(weight, reps)
            best[exercise_id] = max(best.get(exercise_id, 0.0), one_rm)

    lifts = []
    for key, lift in STANDARD_LIFTS.items():
        exercise_id = exercise_ids.get(lift["name"])
        one_rm = best.get(exercise_id) if exercise_id else None
        entry = {
            "key": key,
            "name": lift["name"],
            "exercise_id": exercise_id,
            "estimated_one_rep_max": round(one_rm, 1) if one_rm else None,
            "ratio": None,
            "level": None,
            "next_level": None,
            "progress": None,
            "kg_to_next": None,
        }
        if one_rm and body_weight:
            multiples = [m * factor for m in lift["multiples"]]
            ratio = one_rm / body_weight
            level, next_level, progress = _level_for(ratio, multiples)
            entry.update(
                ratio=round(ratio, 2),
                level=level,
                next_level=next_level,
                progress=round(progress, 3),
                kg_to_next=(
                    round(multiples[LEVELS.index(next_level)] * body_weight - one_rm, 1)
                    if next_level
                    else None
                ),
            )
        lifts.append(entry)

    return {"body_weight_kg": body_weight, "lifts": lifts}
