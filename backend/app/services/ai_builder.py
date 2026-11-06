from typing import Optional, Sequence

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.constants.equipment import EQUIPMENT
from app.constants.personas import get_persona
from app.exceptions import AIUnavailable
from app.models import Exercise, ExerciseMuscle
from app.schemas.ai import BuildRoutineRequest, RoutinePlan, RoutinePreview
from app.services import ai as ai_service
from app.services import profile as profile_service
from app.services.ai.providers import TextProvider

MAX_CANDIDATES = 150
SETS_RANGE = (1, 10)
REPS_RANGE = (1, 30)
REST_RANGE = (0, 600)

OUTPUT_FORMAT = """Reply with JSON only, in this shape:
{"routines": [{"name": str, "items": [{"exerciseId": int, "sets": int, "reps": int, "restSecs": int, "supersetGroup": int or null}]}], "rationale": str}
Return exactly one routine per training day, in the order they should be trained.
Use only exercise ids from the list. Items sharing a supersetGroup are performed back to back.
The rationale is two or three sentences explaining the plan."""


def _clamp(value: int, bounds: tuple[int, int]) -> int:
    return max(bounds[0], min(bounds[1], value))


def _spread_days(count: int) -> list[int]:
    """Weekdays (0 = Monday) spread as evenly as possible across the week."""
    return [round(i * 7 / count) % 7 for i in range(count)]


def find_candidates(db: Session, equipment: Sequence[str]) -> list[Exercise]:
    allowed = [value for choice in equipment for value in EQUIPMENT[choice]]
    stmt = (
        select(Exercise)
        .where(Exercise.equipment.in_(allowed))
        .where(Exercise.metrics.in_(("reps", "reps+weight")))
        .options(selectinload(Exercise.muscles).selectinload(ExerciseMuscle.muscle))
        .order_by(Exercise.priority.asc(), Exercise.id)
        .limit(MAX_CANDIDATES)
    )
    return list(db.execute(stmt).scalars())


def _describe(exercise: Exercise) -> str:
    primary = ", ".join(
        m.muscle.name for m in exercise.muscles if m.contribution_type == "primary"
    )
    return f"{exercise.id}: {exercise.name} ({primary})"


def build_prompt(request: BuildRoutineRequest, candidates: Sequence[Exercise]) -> str:
    lines = [
        f"Design a {request.days_per_week}-day weekly training plan.",
        f"Goal: {request.goal}. Session length: {request.minutes} minutes.",
    ]
    if request.focus:
        lines.append(f"Focus: {request.focus}")
    if request.notes:
        lines.append(f"Notes from the user: {request.notes}")
    lines += [
        "",
        "Available exercises (id: name (primary muscles)):",
        *map(_describe, candidates),
        "",
        OUTPUT_FORMAT,
    ]
    return "\n".join(lines)


def _to_preview(plan: RoutinePlan, catalogue: dict[int, Exercise]) -> RoutinePreview:
    routines = []
    for routine in plan.routines:
        items = [
            {
                **item.model_dump(),
                "sets": _clamp(item.sets, SETS_RANGE),
                "reps": _clamp(item.reps, REPS_RANGE),
                "rest_secs": _clamp(item.rest_secs, REST_RANGE),
                "name": catalogue[item.exercise_id].name,
            }
            for item in routine.items
            if item.exercise_id in catalogue
        ]
        if items:
            routines.append({"name": routine.name, "items": items})

    if not routines:
        raise AIUnavailable("The plan used no known exercises.")
    for routine, day in zip(routines, _spread_days(len(routines))):
        routine["day"] = day
    return RoutinePreview.model_validate(
        {"routines": routines, "rationale": plan.rationale}
    )


def build_routines(
    db: Session,
    user_id: int,
    request: BuildRoutineRequest,
    providers: Optional[Sequence[TextProvider]] = None,
) -> RoutinePreview:
    profile = profile_service.get_or_create_profile(db, user_id)
    candidates = find_candidates(db, request.equipment)

    raw = ai_service.generate_text(
        build_prompt(request, candidates),
        get_persona(profile.coach_persona).system_prompt,
        providers,
    )
    print("AI text= ", end="")
    print(raw)
    try:
        plan = RoutinePlan.model_validate(ai_service.extract_json(raw))
    except (ValueError, ValidationError) as exc:
        raise AIUnavailable("The plan could not be read.") from exc

    return _to_preview(plan, {e.id: e for e in candidates})
