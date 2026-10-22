from pydantic import Field, model_validator
from typing import Optional, List
from datetime import datetime
from .exercise import Exercise
from .base import BaseModel


class WorkoutSetBase(BaseModel):
    exercise_id: int
    set_index: int = 1
    reps: Optional[int] = None
    weight: Optional[float] = None
    distance_meters: Optional[float] = None
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


# Bounds apply to incoming data only. The shared base classes are also used
# for responses, and existing rows must always be readable.
MAX_SETS_PER_WORKOUT = 500
MAX_WORKOUT_SECS = 7 * 24 * 60 * 60


class WorkoutSetCreate(WorkoutSetBase):
    set_index: int = Field(default=1, ge=1, le=1000)
    reps: Optional[int] = Field(default=None, ge=0, le=10_000)
    weight: Optional[float] = Field(
        default=None, ge=0, le=10_000, allow_inf_nan=False
    )
    distance_meters: Optional[float] = Field(
        default=None, ge=0, le=1_000_000, allow_inf_nan=False
    )
    duration_secs: Optional[int] = Field(default=None, ge=0, le=24 * 60 * 60)


class WorkoutSet(WorkoutSetBase):
    id: int
    workout_id: int
    exercise: Exercise


class WorkoutSetWithDate(WorkoutSet):
    completed_at: datetime


class WorkoutBase(BaseModel):
    routine_id: Optional[int] = None
    completed_at: datetime
    duration: int


class WorkoutCreate(WorkoutBase):
    duration: int = Field(ge=0, le=MAX_WORKOUT_SECS)
    sets: List[WorkoutSetCreate] = Field(max_length=MAX_SETS_PER_WORKOUT)


class WorkoutUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    duration: Optional[int] = Field(default=None, ge=0, le=MAX_WORKOUT_SECS)
    sets: Optional[List[WorkoutSetCreate]] = Field(
        default=None, max_length=MAX_SETS_PER_WORKOUT
    )


class Workout(WorkoutBase):
    id: int
    user_id: int
    sets: List[WorkoutSet] = []
