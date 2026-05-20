from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .exercise import Exercise


class WorkoutSetBase(BaseModel):
    exercise_id: int
    set_index: int = 1
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_secs: Optional[int] = None


class WorkoutSetCreate(WorkoutSetBase):
    pass


class WorkoutSet(WorkoutSetBase):
    id: int
    workout_id: int
    exercise: Exercise


class WorkoutBase(BaseModel):
    routine_id: int
    completed_at: datetime
    duration: int


class WorkoutCreate(WorkoutBase):
    sets: List[WorkoutSetCreate]


class WorkoutUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    sets: Optional[List[WorkoutSetCreate]] = None


class Workout(WorkoutBase):
    id: int
    sets: List[WorkoutSet] = []
