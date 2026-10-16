from datetime import date, timedelta
from typing import Optional

from app.models import Exercise, ExerciseMuscle, Workout, WorkoutSet
from app.schemas.workout import WorkoutCreate, WorkoutUpdate
from app.services import achievement as achievement_service
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

ONE_WEEK = timedelta(weeks=1)


def get_workouts(
    db: Session,
    user_id: int,
    routine_id: Optional[int] = None,
):
    stmt = _filter_workouts(_workout_query(), user_id, routine_id)
    return db.execute(stmt).scalars().all()


def get_workout(db: Session, user_id: int, workout_id: int):
    stmt = _workout_query().where(
        Workout.user_id == user_id,
        Workout.id == workout_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def get_previous_workouts(db: Session, user_id: int, exercise_id: int):
    latest_workout_id = (
        select(Workout.id)
        .join(WorkoutSet)
        .where(
            Workout.user_id == user_id,
            WorkoutSet.exercise_id == exercise_id,
        )
        .order_by(Workout.completed_at.desc())
        .limit(1)
        .scalar_subquery()
    )

    stmt = (
        select(WorkoutSet)
        .where(
            WorkoutSet.workout_id == latest_workout_id,
            WorkoutSet.exercise_id == exercise_id,
        )
        .order_by(WorkoutSet.set_index)
    )

    return db.execute(stmt).scalars().all()


def get_stats(db: Session, user_id: int, routine_id: int | None = None):
    count_stmt = _filter_workouts(
        select(func.count()).select_from(Workout), user_id, routine_id
    )
    workout_count = db.execute(count_stmt).scalar_one()

    week_counts = _recent_week_counts(db, user_id, routine_id)
    this_week = _week_start(date.today())
    weekly_streak = _current_streak(week_counts, 1, this_week)

    return {"workoutCount": workout_count, "weeklyStreak": weekly_streak}


def calculate_current_frequency_streaks(
    db: Session,
    user_id: int,
    routine_id: int | None = None,
    this_week: date | None = None,
) -> dict[int, int]:
    week_counts = _recent_week_counts(db, user_id, routine_id)
    if not this_week:
        this_week = _week_start(date.today())

    streaks = {}
    for frequency in achievement_service.FREQUENCIES:
        streaks[frequency] = _current_streak(week_counts, frequency, this_week)
    return streaks


def create_workout(db: Session, user_id: int, workout_in: WorkoutCreate):
    try:
        workout = Workout(
            user_id=user_id,
            routine_id=workout_in.routine_id,
            completed_at=workout_in.completed_at,
            duration=workout_in.duration,
            sets=[_build_set(set_data) for set_data in workout_in.sets],
        )
        db.add(workout)
        db.commit()
        db.refresh(workout)

        _award_achievements(db, user_id, workout)
        return workout
    except Exception:
        db.rollback()
        raise


def update_workout(
    db: Session, user_id: int, workout_id: int, workout_in: WorkoutUpdate
):
    try:
        workout = get_workout(db, user_id, workout_id)
        if not workout:
            return None

        for field, value in workout_in.model_dump(
            exclude_unset=True, exclude={"sets"}
        ).items():
            setattr(workout, field, value)

        if workout_in.sets is not None:
            workout.sets.clear()
            db.flush()
            workout.sets.extend(_build_set(s) for s in workout_in.sets)

        db.commit()
        db.refresh(workout)

        _award_achievements(db, user_id, workout)
        return workout
    except Exception:
        db.rollback()
        raise


def delete_workout(db: Session, user_id: int, workout_id: int):
    try:
        workout = get_workout(db, user_id, workout_id)
        if not workout:
            return None

        db.delete(workout)
        db.commit()
        return workout_id
    except Exception:
        db.rollback()
        raise


def _workout_query():
    return select(Workout).options(
        selectinload(Workout.sets)
        .selectinload(WorkoutSet.exercise)
        .selectinload(Exercise.muscles)
        .selectinload(ExerciseMuscle.muscle)
    )


def _filter_workouts(stmt, user_id: int, routine_id: int | None):
    stmt = stmt.where(Workout.user_id == user_id)
    if routine_id is not None:
        stmt = stmt.where(Workout.routine_id == routine_id)
    return stmt


def _build_set(set_data) -> WorkoutSet:
    return WorkoutSet(
        exercise_id=set_data.exercise_id,
        set_index=set_data.set_index,
        reps=set_data.reps,
        weight=set_data.weight,
        duration_secs=set_data.duration_secs,
        distance_meters=set_data.distance_meters,
    )


def _award_achievements(db: Session, user_id: int, workout: Workout) -> None:
    achievement_service.check_and_award_prs(db, user_id, workout.id, workout)
    achievement_service.check_and_award_frequency_streaks(db, user_id, workout.id)


def _week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def _recent_week_counts(
    db: Session, user_id: int, routine_id: Optional[int]
) -> dict[date, int]:
    """Workouts per week for the latest unbroken run of active weeks.

    Reads only completed_at, newest first, and stops at the first week with no
    workouts, since older history can never join the current streak.
    """
    stmt = _filter_workouts(select(Workout.completed_at), user_id, routine_id)
    stmt = stmt.where(Workout.completed_at.is_not(None))
    stmt = stmt.order_by(Workout.completed_at.desc())

    oldest_useful_week = _week_start(date.today()) - ONE_WEEK
    week_counts = {}
    previous_week = None

    result = db.execute(stmt.execution_options(yield_per=100)).scalars()
    try:
        for completed_at in result:
            week = _week_start(completed_at.date())

            if previous_week is None and week < oldest_useful_week:
                break
            if previous_week is not None and previous_week - week > ONE_WEEK:
                break

            week_counts[week] = week_counts.get(week, 0) + 1
            previous_week = week
    finally:
        result.close()

    return week_counts


def _current_streak(
    week_counts: dict[date, int], frequency: int, this_week: date
) -> int:
    week = this_week
    if week_counts.get(week, 0) < frequency:
        week -= ONE_WEEK

    streak = 0
    while week_counts.get(week, 0) >= frequency:
        streak += 1
        week -= ONE_WEEK

    return streak
