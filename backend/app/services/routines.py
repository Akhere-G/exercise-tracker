from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Routine, RoutineItem
from app.schemas.routine import RoutineCreate


def get_routines(user_id: int, db: Session):
    stmt = select(Routine).where(Routine.user_id == user_id).order_by(Routine.day)
    return db.execute(stmt).scalars().all()


def get_routine(id: int, db: Session, routine_id: int):
    stmt = select(Routine).where(Routine.user_id == id).where(Routine.id == routine_id)
    return db.execute(stmt).scalars().one_or_none()


def create_routine(user_id: int, db: Session, routine: RoutineCreate):
    try:
        new_routine = Routine(
            name=routine.name,
            user_id=user_id,
            day=routine.day,
            start_time=routine.start_time,
        )
        db.add(new_routine)
        db.flush()

        for item in routine.routine_items:
            routine_item = RoutineItem(
                routine_id=new_routine.id,
                exercise_id=item.exercise_id,
                target_sets=item.target_sets,
                target_reps=item.target_reps,
                order=item.order,
            )
            db.add(routine_item)

        db.commit()
        db.refresh(new_routine)
        return new_routine

    except Exception:
        db.rollback()
        raise
