from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Achievement, User
from app.schemas.achievement import (
    AchievementResponse,
    UserAchievementResponse,
)
from app.services import achievement as achievement_service
from app.services import user as user_service

router = APIRouter(prefix="/api/achievements", tags=["Achievements"])


@router.get("", response_model=list[AchievementResponse])
def get_all_achievements(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    stmt = select(Achievement)
    return db.execute(stmt).scalars().all()


@router.get("/user", response_model=list[UserAchievementResponse])
def get_user_achievements(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return achievement_service.get_user_achievements(db, user.id)


@router.get("/exercise/{exercise_id}", response_model=list[UserAchievementResponse])
def get_exercise_achievements(
    exercise_id: int,
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return achievement_service.get_achievements_for_exercise(db, user.id, exercise_id)


@router.get("/workout/{workout_id}", response_model=list[UserAchievementResponse])
def get_workout_achievements(
    workout_id: int,
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return achievement_service.get_achievements_for_workout(db, user.id, workout_id)
