from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.programs import PROGRAMS, Program
from app.models import Exercise
from app.schemas.program import ProgramApply
from app.schemas.routine import RoutineCreate, RoutineItemCreate
from app.services import routine as routine_service


def get_program(slug: str) -> Program:
    program = PROGRAMS.get(slug)
    if program is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Program not found."
        )
    return program


def resolve_exercise_ids(db: Session, program: Program) -> dict[str, int]:
    names = {e.name for day in program.days for e in day.exercises}
    ids = dict(
        db.execute(select(Exercise.name, Exercise.id).where(Exercise.name.in_(names)))
        .tuples()
        .all()
    )
    missing = sorted(names - ids.keys())
    if missing:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Program exercises missing from the catalogue: {missing}",
        )
    return ids


def apply_program(
    db: Session, user_id: int, program: Program, apply: ProgramApply
) -> list:
    exercise_ids = resolve_exercise_ids(db, program)
    routines = []
    for day in program.days:
        items = [
            RoutineItemCreate(
                exercise_id=exercise_ids[e.name],
                target_sets=e.sets,
                target_reps=e.reps,
                rest_secs=e.rest_secs,
                order=order,
            )
            for order, e in enumerate(day.exercises)
        ]
        routines.append(
            RoutineCreate(
                name=f"{program.name}: {day.name}",
                day=(apply.start_day + day.offset) % 7,
                start_time=apply.start_time,
                routine_items=items,
            )
        )
    return routine_service.create_routines(db, user_id, routines)
