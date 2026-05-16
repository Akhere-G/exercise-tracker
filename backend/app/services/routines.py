from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from app.models import Routine, RoutineItem, Exercise
from app.schemas.routine import RoutineCreate, RoutineUpdate


def get_routines(user_id: int, db: Session):
    stmt = (
        select(Routine)
        .options(
            selectinload(Routine.routine_items)
            .selectinload(RoutineItem.exercise)
            .selectinload(Exercise.muscles),
        )
        .where(Routine.user_id == user_id)
        .order_by(Routine.day)
    )
    return db.execute(stmt).scalars().all()


def get_routine(user_id: int, db: Session, routine_id: int):
    stmt = (
        select(Routine)
        .options(
            selectinload(Routine.routine_items)
            .selectinload(RoutineItem.exercise)
            .selectinload(Exercise.muscles),
        )
        .where(Routine.user_id == user_id)
        .where(Routine.id == routine_id)
    )
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


def update_routine(
    user_id: int,
    routine_id: int,
    db: Session,
    routine_data: RoutineUpdate,
):
    try:
        old_routine = get_routine(user_id, db, routine_id)

        if not old_routine:
            return old_routine

        data = routine_data.model_dump(exclude_unset=True, exclude={"routine_items"})
        for k, v in data.items():
            setattr(old_routine, k, v)

        if routine_data.routine_items is not None:
            old_routine.routine_items.clear()

            for item in routine_data.routine_items:
                new_item = RoutineItem(
                    routine_id=old_routine.id,
                    exercise_id=item.exercise_id,
                    target_sets=item.target_sets,
                    target_reps=item.target_reps,
                    order=item.order,
                )
                old_routine.routine_items.append(new_item)

        db.commit()
        db.refresh(old_routine)
        return old_routine

    except:
        db.rollback()
        raise


def delete_routine(
    user_id: int,
    routine_id: int,
    db: Session,
):
    routine = get_routine(user_id, db, routine_id)

    if not routine:
        return routine

    db.delete(routine)

    db.commit()

    return routine_id
