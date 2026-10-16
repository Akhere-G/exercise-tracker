from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AchievementBase(BaseModel):
    name: str
    description: str
    type: str
    icon: str
    criteria: Optional[str] = None


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
    value: Optional[float] = None
    exercise_id: Optional[int] = None
    workout_id: Optional[int] = None
    unlocked_at: datetime
    achievement: AchievementResponse

    class Config:
        from_attributes = True


class WorkoutAchievementsResponse(BaseModel):
    workout_id: int
    achievements: List[UserAchievementResponse]
