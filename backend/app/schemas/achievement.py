from datetime import datetime

from app.schemas.exercise import ExerciseResponseSimple
from pydantic import BaseModel


class AchievementBase(BaseModel):
    name: str
    description: str
    type: str
    icon: str
    criteria: str | None = None


class AchievementCreate(AchievementBase):
    pass


class AchievementResponse(AchievementBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    id: int
    user_id: int
    achievement_id: int
    value: float | None = None
    exercise_id: int | None = None
    workout_id: int | None = None
    unlocked_at: datetime
    achievement: AchievementResponse
    exercise: ExerciseResponseSimple | None = None

    class Config:
        from_attributes = True


class WorkoutAchievementsResponse(BaseModel):
    workout_id: int
    achievements: list[UserAchievementResponse]
