from datetime import timedelta
from logging import getLogger

from app.database import SessionLocal
from app.models import (
    Achievement,
    Exercise,
    ExerciseMuscle,
    Muscle,
    Notification,
    NotificationSubscription,
    Routine,
    RoutineItem,
    User,
    UserAchievement,
    Workout,
    WorkoutSet,
)
from app.schemas.achievement import UserAchievementResponse
from app.services.achievement import (
    check_and_award_frequency_streaks,
    check_and_award_prs,
)
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

logger = getLogger(__name__)


def backfill_user_achievements(
    db: Session,
    user_id: int,
) -> list[UserAchievementResponse]:
    """Rebuild a user's achievement records from their workout history."""

    # Remove existing records so the backfill can rebuild them cleanly.
    db.execute(delete(UserAchievement).where(UserAchievement.user_id == user_id))
    db.flush()

    workouts = (
        db.execute(
            select(Workout)
            .options(selectinload(Workout.sets))
            .where(Workout.user_id == user_id)
            .order_by(Workout.completed_at.asc(), Workout.id.asc())
        )
        .scalars()
        .all()
    )

    created = []

    # Process PRs chronologically so each improvement is recorded.
    for workout in workouts:
        created.extend(
            check_and_award_prs(
                db,
                user_id=user_id,
                workout_id=workout.id,
                workout=workout,
                commit=False,
            )
        )
        day = workout.completed_at.date()
        created.extend(
            check_and_award_frequency_streaks(
                db,
                user_id=user_id,
                workout_id=workout.id,
                this_week=day - timedelta(days=day.weekday()),
                commit=False,
            )
        )
        db.flush()

    return created


def backfill_all_user_achievements():
    with SessionLocal() as db:
        try:
            stmt = select(User.id)
            user_ids = db.execute(stmt).scalars().all()

            for user_id in user_ids:
                with db.begin_nested():
                    created = backfill_user_achievements(db, user_id)
                    db.commit()
                    logger.info(
                        f"Created {len(created)} achievements for user {user_id}"
                    )
        except Exception:
            db.rollback()
            logger.exception("Could not backfill user achievements.")
            raise


if __name__ == "__main__":
    backfill_all_user_achievements()
