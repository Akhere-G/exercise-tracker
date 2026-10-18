from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, case
from app.models import Exercise, Muscle, ExerciseMuscle, Workout, Routine, WorkoutSet
from typing import Optional


def get_exercises(
    db: Session,
    user_id: int,
    search: Optional[str] = None,
    equipment: Optional[str] = None,
    muscle: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):

    usage = (
        select(
            WorkoutSet.exercise_id.label("exercise_id"),
            func.count(WorkoutSet.id).label("set_count"),
            func.count(func.distinct(Workout.id)).label("workout_count"),
            func.max(Workout.completed_at).label("last_used"),
        )
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .where(Workout.user_id == user_id)
        .group_by(WorkoutSet.exercise_id)
        .subquery()
    )

    stmt = (
        select(
            Exercise,
            func.coalesce(usage.c.set_count, 0).label("set_count"),
            func.coalesce(usage.c.workout_count, 0).label("workout_count"),
            usage.c.last_used.label("last_used"),
        )
        .options(selectinload(Exercise.muscles).selectinload(ExerciseMuscle.muscle))
        .outerjoin(
            usage,
            usage.c.exercise_id == Exercise.id,
        )
    )

    if equipment and equipment != "all":
        stmt = stmt.where(Exercise.equipment.ilike(f"%{equipment.strip()}%"))

    if muscle and muscle != "all":
        stmt = (
            stmt.join(ExerciseMuscle)
            .join(Muscle)
            .where(Muscle.name.ilike(f"%{muscle}%"))
        )

        stmt = stmt.distinct()

    if search:
        stmt = stmt.where(Exercise.name.ilike(f"%{search.strip()}%"))

        stmt = stmt.order_by(
            case(
                (Exercise.name.ilike(search), 0),
                (Exercise.name.ilike(f"%{search}%"), 1),
                else_=2,
            ),
            func.coalesce(usage.c.workout_count, 0).desc(),
            func.coalesce(usage.c.set_count, 0).desc(),
            usage.c.last_used.desc().nulls_last(),
            Exercise.priority.asc(),
        )
    else:
        stmt = stmt.order_by(
            func.coalesce(usage.c.workout_count, 0).desc(),
            func.coalesce(usage.c.set_count, 0).desc(),
            usage.c.last_used.desc().nulls_last(),
            Exercise.priority.asc(),
        )
    offset = limit * (page - 1)
    stmt = stmt.limit(limit).offset(offset)

    exercises = db.execute(stmt).all()
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
