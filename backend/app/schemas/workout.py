from pydantic import model_validator
from typing import Optional, List
from datetime import datetime
from .exercise import Exercise
from .base import BaseModel


class WorkoutSetBase(BaseModel):
    exercise_id: int
    set_index: int = 1
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_secs: Optional[int] = None

    @model_validator(mode="after")
    def validate_set_data(self) -> "WorkoutSetBase":
        has_reps = self.reps is not None and self.reps > 0
        has_duration = self.duration_secs is not None and self.duration_secs > 0

        if not (has_reps or has_duration):
            raise ValueError(
                "You must provide either 'reps' or 'duration' for this set."
            )
        return self


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
