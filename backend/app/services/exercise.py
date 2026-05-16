from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from app.models import Exercise, Muscle, ExerciseMuscle
from typing import Optional


def get_exercises(
    db: Session,
    search: Optional[str] = None,
    equipment: Optional[str] = None,
    muscle_group: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    stmt = select(Exercise).options(selectinload(Exercise.muscles))

    if search:
        stmt = stmt.where(Exercise.name.ilike(f"%{search.strip()}%"))

    if equipment:
        stmt = stmt.where(Exercise.equipment.ilike(f"%{equipment.strip()}%"))

    if muscle_group:
        stmt = (
            stmt.join(ExerciseMuscle)
            .join(Muscle)
            .where(Muscle.name.ilike(f"%{muscle_group}%"))
        )

        stmt = stmt.distinct()

    offset = limit * (page - 1)
    stmt = stmt.limit(limit).offset(offset)

    exercises = db.execute(stmt).scalars().all()
    return exercises
