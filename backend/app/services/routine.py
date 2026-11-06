import statistics
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from app.models import Routine, RoutineItem, Exercise, ExerciseMuscle, Workout
from app.schemas.routine import RoutineCreate, RoutineFromWorkout, RoutineUpdate


def get_routines(db: Session, user_id: int):
    stmt = (
        select(Routine)
        .options(
            selectinload(Routine.routine_items)
            .selectinload(RoutineItem.exercise)
            .selectinload(Exercise.muscles)
            .selectinload(ExerciseMuscle.muscle),
        )
        .where(Routine.user_id == user_id)
        .order_by(Routine.day)
    )
    return db.execute(stmt).scalars().all()


def get_routine(db: Session, user_id: int, routine_id: int):
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


def _add_routine(db: Session, user_id: int, routine: RoutineCreate) -> Routine:
    new_routine = Routine(
        name=routine.name,
        user_id=user_id,
        day=routine.day,
        start_time=routine.start_time,
    )
    db.add(new_routine)
    db.flush()

    for item in routine.routine_items:
        db.add(
            RoutineItem(
                routine_id=new_routine.id,
                exercise_id=item.exercise_id,
                target_sets=item.target_sets,
                target_reps=item.target_reps,
                target_duration_secs=item.target_duration_secs,
                order=item.order,
                rest_secs=item.rest_secs,
                superset_group=item.superset_group,
            )
        )
    return new_routine


def create_routines(
    db: Session, user_id: int, routines: list[RoutineCreate]
) -> list[Routine]:
    """Creates all the routines or none of them."""
    try:
        created = [_add_routine(db, user_id, routine) for routine in routines]
        db.commit()
        for routine in created:
            db.refresh(routine)
        return created
    except Exception:
        db.rollback()
        raise


def create_routine(db: Session, user_id: int, routine: RoutineCreate):
    return create_routines(db, user_id, [routine])[0]


def update_routine(
    db: Session,
    user_id: int,
    routine_id: int,
    routine_data: RoutineUpdate,
):
    try:
        old_routine = get_routine(db, user_id, routine_id)

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
                    target_duration_secs=item.target_duration_secs,
                    order=item.order,
                    rest_secs=item.rest_secs,
                    superset_group=item.superset_group,
                )
                old_routine.routine_items.append(new_item)

        db.commit()
        db.refresh(old_routine)
        return old_routine

    except Exception:
        db.rollback()
        raise


def delete_routine(
    db: Session,
    user_id: int,
    routine_id: int,
):
    try:
        routine = get_routine(db, user_id, routine_id)

        if not routine:
            return routine

        db.delete(routine)

        db.commit()

        return routine_id
    except Exception:
        db.rollback()
        raise


def _median_int(values: list[int]) -> Optional[int]:
    return round(statistics.median(values)) if values else None


def build_items_from_workout(workout: Workout) -> list[dict]:
    """Routine items for what was done in a workout, in the order it was done.

    Warm-ups are left out of the targets unless an exercise only has warm-ups.
    Superset groups are kept only where two or more exercises share one.
    """
    sets_by_exercise: dict[int, list] = {}
    for workout_set in sorted(workout.sets, key=lambda s: s.id):
        sets_by_exercise.setdefault(workout_set.exercise_id, []).append(workout_set)

    group_sizes: dict[int, int] = {}
    exercise_groups: dict[int, Optional[int]] = {}
    for exercise_id, sets in sets_by_exercise.items():
        group = next((s.superset_group for s in sets if s.superset_group), None)
        exercise_groups[exercise_id] = group
        if group:
            group_sizes[group] = group_sizes.get(group, 0) + 1

    items = []
    for order, (exercise_id, sets) in enumerate(sets_by_exercise.items()):
        working = [s for s in sets if s.set_type != "warmup"] or sets
        group = exercise_groups[exercise_id]
        items.append(
            {
                "exercise_id": exercise_id,
                "target_sets": len(working),
                "target_reps": _median_int([s.reps for s in working if s.reps]),
                "target_duration_secs": _median_int(
                    [s.duration_secs for s in working if s.duration_secs]
                ),
                "order": order,
                "superset_group": group if group and group_sizes[group] > 1 else None,
            }
        )
    return items


def _require_sets(workout: Workout) -> list[dict]:
    items = build_items_from_workout(workout)
    if not items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="This workout has no sets to build a routine from.",
        )
    return items


def create_routine_from_workout(
    db: Session, user_id: int, workout: Workout, data: RoutineFromWorkout
):
    items = _require_sets(workout)
    try:
        routine = Routine(
            name=data.name, user_id=user_id, day=data.day, start_time=data.start_time
        )
        db.add(routine)
        db.flush()
        for item in items:
            db.add(RoutineItem(routine_id=routine.id, **item))
        db.commit()
        db.refresh(routine)
        return routine
    except Exception:
        db.rollback()
        raise


def sync_routine_from_workout(db: Session, routine: Routine, workout: Workout):
    """Replace a routine's exercises with those performed in the workout.

    Rest times the user set on exercises that remain are kept.
    """
    items = _require_sets(workout)
    try:
        rest_by_exercise = {
            item.exercise_id: item.rest_secs for item in routine.routine_items
        }
        routine.routine_items.clear()
        db.flush()
        for item in items:
            routine.routine_items.append(
                RoutineItem(
                    routine_id=routine.id,
                    rest_secs=rest_by_exercise.get(item["exercise_id"]),
                    **item,
                )
            )
        db.commit()
        db.refresh(routine)
        return routine
    except Exception:
        db.rollback()
        raise
