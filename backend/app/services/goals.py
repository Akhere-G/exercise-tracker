from datetime import datetime, time
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Exercise, UserProfile, Workout, WorkoutSet
from app.schemas.goals import Goals, LiftGoal, WeeklyGoal, WeightGoal
from app.services import body as body_service
from app.services import profile as profile_service
from app.services import workout as workout_service


def get_goals(db: Session, user_id: int) -> Goals:
    profile = profile_service.get_or_create_profile(db, user_id)
    return Goals(
        weekly=_weekly_goal(db, user_id, profile),
        body_weight=_weight_goal(db, user_id, profile),
        lift=_lift_goal(db, user_id, profile),
    )


def _weekly_goal(
    db: Session, user_id: int, profile: UserProfile
) -> Optional[WeeklyGoal]:
    if profile.workouts_per_week_target is None:
        return None
    week_start = datetime.combine(
        workout_service._week_start(workout_service.date.today()), time.min
    )
    stmt = select(func.count(Workout.id)).where(
        Workout.user_id == user_id, Workout.completed_at >= week_start
    )
    return WeeklyGoal(
        target=profile.workouts_per_week_target,
        completed=db.execute(stmt).scalar_one(),
    )


def _weight_goal(
    db: Session, user_id: int, profile: UserProfile
) -> Optional[WeightGoal]:
    if profile.target_body_weight_kg is None:
        return None
    latest = body_service.get_latest_body_weight(db, user_id)
    return WeightGoal(
        target_kg=profile.target_body_weight_kg,
        current_kg=latest.weight_kg if latest else None,
    )


def _lift_goal(db: Session, user_id: int, profile: UserProfile) -> Optional[LiftGoal]:
    exercise_id = profile.target_lift_exercise_id
    if exercise_id is None or profile.target_lift_kg is None:
        return None
    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        return None
    stmt = (
        select(func.max(WorkoutSet.weight))
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .where(
            Workout.user_id == user_id,
            WorkoutSet.exercise_id == exercise_id,
            WorkoutSet.set_type != "warmup",
        )
    )
    return LiftGoal(
        exercise_id=exercise_id,
        exercise_name=exercise.name,
        target_kg=profile.target_lift_kg,
        best_kg=db.execute(stmt).scalar_one(),
    )
