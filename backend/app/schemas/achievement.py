from pydantic import BaseModel

from app.schemas.exercise import ExerciseResponseSimple

from .base import UtcDatetime


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
    created_at: UtcDatetime
    updated_at: UtcDatetime

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    id: int
    user_id: int
    achievement_id: int
    value: float | None = None
    exercise_id: int | None = None
    workout_id: int | None = None
    unlocked_at: UtcDatetime
    achievement: AchievementResponse
    exercise: ExerciseResponseSimple | None = None

    class Config:
        from_attributes = True


class WorkoutAchievementsResponse(BaseModel):
    workout_id: int
    achievements: list[UserAchievementResponse]
