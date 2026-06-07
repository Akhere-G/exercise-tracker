from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from app.models import Exercise, Muscle, ExerciseMuscle, Workout, Routine, WorkoutSet
from typing import Optional


def get_exercises(
    db: Session,
    search: Optional[str] = None,
    equipment: Optional[str] = None,
    muscle: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    stmt = select(Exercise).options(
        selectinload(Exercise.muscles).selectinload(ExerciseMuscle.muscle)
    )

    if search:
        stmt = stmt.where(Exercise.name.ilike(f"%{search.strip()}%"))

    if equipment and not equipment == "all":
        stmt = stmt.where(Exercise.equipment.ilike(f"%{equipment.strip()}%"))

    if muscle and not muscle == "all":
        stmt = (
            stmt.join(ExerciseMuscle)
            .join(Muscle)
            .where(Muscle.name.ilike(f"%{muscle}%"))
        )

        stmt = stmt.distinct()

    offset = limit * (page - 1)
    stmt = stmt.limit(limit).offset(offset)

    exercises = db.execute(stmt).scalars().all()
    return exercises


def get_exercise(db: Session, exercise_id: int):
    stmt = (
        select(Exercise)
        .options(selectinload(Exercise.muscles).selectinload(ExerciseMuscle.muscle))
        .where(Exercise.id == exercise_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_workouts(db: Session, user_id: int, exercise_id: int):
    stmt = (
        select(WorkoutSet, Workout.completed_at)
        .options(
            selectinload(WorkoutSet.exercise)
            .selectinload(Exercise.muscles)
            .selectinload(ExerciseMuscle.muscle)
        )
        .join(Workout)
        .where(Workout.user_id == user_id)
        .where(WorkoutSet.exercise_id == exercise_id)
    )
    rows = db.execute(stmt).all()

    workouts = []
    for workout_set, completed_at in rows:
        workout_set.completed_at = completed_at
        workouts.append(workout_set)

    return workouts
