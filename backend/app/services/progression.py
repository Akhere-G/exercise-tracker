from dataclasses import dataclass
from typing import Iterable, Optional

from app.constants.muscle_groups import group_for_muscle
from app.constants.personas import get_persona
from app.models import Exercise, ExerciseMuscle, WorkoutSet
from app.services import profile as profile_service
from app.services import workout as workout_service
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

KG_PER_LB = 0.45359237

# Load added once every set was completed comfortably, in the user's own unit.
INCREMENTS: dict[str, dict[str, float]] = {
    "kg": {"upper": 2.5, "lower": 5.0, "small": 1.25},
    "lb": {"upper": 5.0, "lower": 10.0, "small": 2.5},
}
LOWER_BODY = {"quads", "hamstrings", "glutes"}
SMALL_MUSCLES = {"biceps", "triceps", "forearms", "calves"}
SMALL_EQUIPMENT = {"dumbbell", "kettlebell"}
MAX_MANAGEABLE_RPE = 8.5
MIN_MANAGEABLE_RIR = 1


@dataclass(frozen=True)
class SetResult:
    reps: Optional[int]
    weight: Optional[float]
    rpe: Optional[float] = None
    rir: Optional[int] = None


@dataclass(frozen=True)
class Suggestion:
    action: str
    weight: Optional[float]
    reps: Optional[int]


def load_category(exercise: Exercise) -> str:
    """Whether progress comes in upper-body, lower-body or small jumps."""
    if exercise.equipment.lower() in SMALL_EQUIPMENT:
        return "small"

    primary = {
        group_for_muscle(m.muscle.name)
        for m in exercise.muscles
        if m.contribution_type == "primary"
    } - {None}
    if primary and primary <= SMALL_MUSCLES:
        return "small"
    if primary and primary <= LOWER_BODY:
        return "lower"
    return "upper"


def _manageable(result: SetResult) -> bool:
    if result.rpe is not None and result.rpe > MAX_MANAGEABLE_RPE:
        return False
    return result.rir is None or result.rir >= MIN_MANAGEABLE_RIR


def suggest_next(
    last_session: Iterable[SetResult],
    increment_kg: float,
    target_reps: Optional[int] = None,
) -> Optional[Suggestion]:
    """Double progression: add load once every set hits the target comfortably,
    otherwise work towards the target reps at the same load."""
    sets = [s for s in last_session if s.reps]
    if not sets:
        return None

    weights = [s.weight for s in sets if s.weight and s.weight > 0]
    if not weights:
        return Suggestion("reps_up", None, max(s.reps for s in sets) + 1)

    top_weight = max(weights)
    target = target_reps or max(s.reps for s in sets)
    if any(s.reps < target for s in sets):
        return Suggestion("add_rep", top_weight, min(s.reps for s in sets) + 1)
    if all(_manageable(s) for s in sets):
        return Suggestion("increase", top_weight + increment_kg, target)
    return Suggestion("repeat", top_weight, target)


def describe(persona_slug: str, suggestion: Suggestion, unit: str) -> str:
    weight = suggestion.weight
    if weight is not None and unit == "lb":
        weight = weight / KG_PER_LB
    shown = "" if weight is None else f"{weight:g} {unit}"
    line = get_persona(persona_slug).lines[suggestion.action]
    return line.format(weight=shown, reps=suggestion.reps)


def _working_results(sets: Iterable[WorkoutSet]) -> list[SetResult]:
    return [
        SetResult(s.reps, s.weight, s.rpe, s.rir)
        for s in sets
        if s.set_type != "warmup"
    ]


def get_suggestions(
    db: Session, user_id: int, exercise_ids: list[int]
) -> list[dict]:
    profile = profile_service.get_or_create_profile(db, user_id)
    previous = workout_service.get_previous_sets_for_exercises(
        db, user_id, exercise_ids
    )
    exercises = db.execute(
        select(Exercise)
        .where(Exercise.id.in_(previous))
        .options(selectinload(Exercise.muscles).selectinload(ExerciseMuscle.muscle))
    ).scalars()

    results = []
    for exercise in exercises:
        increment = INCREMENTS[profile.weight_unit][load_category(exercise)]
        if profile.weight_unit == "lb":
            increment *= KG_PER_LB
        suggestion = suggest_next(_working_results(previous[exercise.id]), increment)
        if suggestion is None:
            continue
        results.append(
            {
                "exercise_id": exercise.id,
                "action": suggestion.action,
                "weight": suggestion.weight,
                "reps": suggestion.reps,
                "reason": describe(profile.coach_persona, suggestion, profile.weight_unit),
            }
        )
    return results
