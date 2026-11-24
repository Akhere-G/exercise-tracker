import statistics
from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.constants.metrics import TARGET_FIELDS
from app.models import Exercise, ExerciseMuscle, Routine, RoutineItem, Workout
from app.schemas.routine import (
    RoutineCreate,
    RoutineFromWorkout,
    RoutineItemCreate,
    RoutineUpdate,
)
from app.services import exercise as exercise_service
from app.services import targets as targets_service


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


def _item_targets(item: RoutineItemCreate) -> dict[str, float | None]:
    return {field: getattr(item, field) for field in TARGET_FIELDS}


def _keep_set_targets(targets: dict[str, float | None]) -> dict[str, float | None]:
    """A target of zero means no target, so it is stored as missing."""
    return {
        field: (value if value is not None and value > 0 else None)
        for field, value in targets.items()
    }


def _check_targets_fit_exercises(
    db: Session, items: Sequence[RoutineItemCreate]
) -> dict[int, str]:
    """Reject targets the exercise type does not track, and missing required ones.

    Returns each exercise's metrics, so callers can drop targets that do not apply.
    """
    exercise_ids = {item.exercise_id for item in items}
    exercise_service.ensure_exercises_exist(db, exercise_ids)
    statement = select(Exercise).where(Exercise.id.in_(exercise_ids))
    exercises = {e.id: e for e in db.execute(statement).scalars()}

    complaints = []
    for item in items:
        exercise = exercises[item.exercise_id]
        problems = targets_service.find_target_problems(
            exercise.metrics, _item_targets(item)
        )
        if problems:
            complaints.append(
                f"Exercise {exercise.id} ({exercise.name}) {'; '.join(problems)}."
            )
    if complaints:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=" ".join(complaints),
        )
    return {exercise_id: e.metrics for exercise_id, e in exercises.items()}


def _item_columns(item: RoutineItemCreate, metrics: str) -> dict:
    targets = targets_service.applicable_targets(metrics, _item_targets(item))
    return {
        "exercise_id": item.exercise_id,
        "target_sets": item.target_sets,
        **_keep_set_targets(targets),
        "order": item.order,
        "rest_secs": item.rest_secs,
        "superset_group": item.superset_group,
    }


def _add_routine(
    db: Session, user_id: int, routine: RoutineCreate, metrics: dict[int, str]
) -> Routine:
    new_routine = Routine(
        name=routine.name,
        user_id=user_id,
        day=routine.day,
        start_time=routine.start_time,
    )
    db.add(new_routine)
    db.flush()

    for item in routine.routine_items:
        columns = _item_columns(item, metrics[item.exercise_id])
        db.add(RoutineItem(routine_id=new_routine.id, **columns))
    return new_routine


def create_routines(
    db: Session, user_id: int, routines: list[RoutineCreate]
) -> list[Routine]:
    """Creates all the routines or none of them."""
    try:
        all_items = [item for routine in routines for item in routine.routine_items]
        metrics = _check_targets_fit_exercises(db, all_items)
        created = [_add_routine(db, user_id, routine, metrics) for routine in routines]
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
            metrics = _check_targets_fit_exercises(db, routine_data.routine_items)
            old_routine.routine_items.clear()

            for item in routine_data.routine_items:
                columns = _item_columns(item, metrics[item.exercise_id])
                old_routine.routine_items.append(
                    RoutineItem(routine_id=old_routine.id, **columns)
                )

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


def _median_int(values: list[int]) -> int | None:
    return round(statistics.median(values)) if values else None


def _median_float(values: list[float]) -> float | None:
    return round(statistics.median(values), 2) if values else None


def build_items_from_workout(workout: Workout) -> list[dict]:
    """Routine items for what was done in a workout, in the order it was done.

    Warm-ups are left out of the targets unless an exercise only has warm-ups.
    Superset groups are kept only where two or more exercises share one.
    """
    sets_by_exercise: dict[int, list] = {}
    for workout_set in sorted(workout.sets, key=lambda s: s.id):
        sets_by_exercise.setdefault(workout_set.exercise_id, []).append(workout_set)

    group_sizes: dict[int, int] = {}
    exercise_groups: dict[int, int | None] = {}
    for exercise_id, sets in sets_by_exercise.items():
        group = next((s.superset_group for s in sets if s.superset_group), None)
        exercise_groups[exercise_id] = group
        if group:
            group_sizes[group] = group_sizes.get(group, 0) + 1

    items = []
    for order, (exercise_id, sets) in enumerate(sets_by_exercise.items()):
        working = [s for s in sets if s.set_type != "warmup"] or sets
        group = exercise_groups[exercise_id]
        done = {
            "target_reps": _median_int([s.reps for s in working if s.reps]),
            "target_weight": _median_float([s.weight for s in working if s.weight]),
            "target_duration_secs": _median_int(
                [s.duration_secs for s in working if s.duration_secs]
            ),
            "target_distance_meters": _median_float(
                [s.distance_meters for s in working if s.distance_meters]
            ),
        }
        items.append(
            {
                "exercise_id": exercise_id,
                "target_sets": len(working),
                **targets_service.applicable_targets(working[0].exercise.metrics, done),
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
