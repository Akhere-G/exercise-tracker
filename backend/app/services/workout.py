from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Workout, WorkoutSet, Routine
from typing import Optional
from app.schemas.workout import WorkoutCreate, WorkoutUpdate
from datetime import datetime, timedelta


def get_workouts(db: Session, user_id: int, routine_id: Optional[int] = None):
    stmt = select(Workout).join(Routine).where(Routine.user_id == user_id)
    if routine_id:
        stmt = stmt.where(Workout.routine_id == routine_id)

    return db.execute(stmt).scalars().all()


def get_stats(db: Session, user_id: int, routine_id: Optional[int] = None):
    workouts = get_workouts(db, user_id, routine_id)
    workout_count = len(workouts)

    if workout_count == 0:
        return {"workout_count": 0, "weekly_streak": 0}

    active_weeks = {
        w.completed_at.isocalendar()[:2] for w in workouts if w.completed_at
    }

    streak = 0
    current_date = datetime.now()

    if current_date.isocalendar()[:2] in active_weeks:
        streak += 1
        check_date = current_date - timedelta(weeks=1)
    else:
        check_date = current_date - timedelta(weeks=1)
        if check_date.isocalendar()[:2] not in active_weeks:
            return {"workout_count": workout_count, "weekly_streak": 0}

    while check_date.isocalendar()[:2] in active_weeks:
        streak += 1
        check_date -= timedelta(weeks=1)

    return {"workout_count": workout_count, "weekly_streak": streak}


def get_workout(db: Session, user_id: int, workout_id: int):
    stmt = (
        select(Workout)
        .join(Routine)
        .where(Routine.user_id == user_id)
        .where(Workout.id == workout_id)
    )

    return db.execute(stmt).scalar_one_or_none()


def create_workout(db: Session, workout_in: WorkoutCreate):
    try:
        new_workout = Workout(
            routine_id=workout_in.routine_id,
            completed_at=workout_in.completed_at,
            duration=workout_in.duration,
        )
        db.add(new_workout)
        db.flush()
        for set_data in workout_in.sets:
            set_item = WorkoutSet(
                workout_id=new_workout.id,
                exercise_id=set_data.exercise_id,
                set_index=set_data.set_index,
                reps=set_data.reps,
                weight=set_data.weight,
                duration_secs=set_data.duration_secs,
            )
            db.add(set_item)

        db.commit()
        db.refresh(new_workout)

        return new_workout
    except:
        db.rollback()
        raise


def update_workout(
    db: Session, user_id: int, workout_id: int, workout_in: WorkoutUpdate
):
    try:
        workout = get_workout(db, user_id, workout_id)

        if not workout:
            return

        data = workout_in.model_dump(exclude_unset=True, exclude={"sets"})

        for k, v in data.items():
            setattr(workout, k, v)

        if workout_in.sets is not None:
            workout.sets.clear()

            db.flush()

            for set_data in workout_in.sets:
                set_item = WorkoutSet(
                    workout_id=workout.id,
                    exercise_id=set_data.exercise_id,
                    set_index=set_data.set_index,
                    reps=set_data.reps,
                    weight=set_data.weight,
                    duration_secs=set_data.duration_secs,
                )

                workout.sets.append(set_item)

        db.commit()
        db.refresh(workout)

        return workout
    except:
        db.rollback()
        raise


def delete_workout(db: Session, user_id: int, workout_id: int):
    try:
        workout = get_workout(db, user_id, workout_id)

        if not workout:
            return

        db.delete(workout)

        db.commit()

        return workout_id
    except:
        db.rollback()
        raise
