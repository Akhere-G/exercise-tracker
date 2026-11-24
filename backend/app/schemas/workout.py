from typing import Literal

from pydantic import Field, model_validator

from .base import BaseModel, UtcDatetime, not_nullable
from .exercise import Exercise

SetType = Literal["warmup", "normal", "drop", "failure"]


class WorkoutSetBase(BaseModel):
    exercise_id: int
    set_index: int = 1
    reps: int | None = None
    weight: float | None = None
    distance_meters: float | None = None
    duration_secs: int | None = None
    set_type: SetType = "normal"
    rpe: float | None = None
    rir: int | None = None
    superset_group: int | None = None

    @model_validator(mode="after")
    def validate_set_data(self) -> "WorkoutSetBase":
        has_reps = self.reps is not None and self.reps > 0
        has_duration = self.duration_secs is not None and self.duration_secs > 0

        if not (has_reps or has_duration):
            raise ValueError(
                "You must provide either 'reps' or 'duration' for this set."
            )
        return self


MAX_SETS_PER_WORKOUT = 500
MAX_WORKOUT_SECS = 7 * 24 * 60 * 60
MAX_NEW_WORKOUT_SECS = 3 * 60 * 60
MAX_INT32 = 2_147_483_647


class WorkoutSetCreate(WorkoutSetBase):
    set_index: int = Field(default=1, ge=1, le=1000)
    reps: int | None = Field(default=None, ge=0, le=10_000)
    weight: float | None = Field(
        default=None, ge=-10_000, le=10_000, allow_inf_nan=False
    )
    distance_meters: float | None = Field(
        default=None, ge=0, le=1_000_000, allow_inf_nan=False
    )
    duration_secs: int | None = Field(default=None, ge=0, le=24 * 60 * 60)
    rpe: float | None = Field(default=None, ge=1, le=10, multiple_of=0.5)
    rir: int | None = Field(default=None, ge=0, le=10)
    superset_group: int | None = Field(default=None, ge=0, le=1000)


class WorkoutSet(WorkoutSetBase):
    id: int
    workout_id: int
    exercise: Exercise


class WorkoutSetWithDate(WorkoutSet):
    completed_at: UtcDatetime


class PreviousSet(BaseModel):
    exercise_id: int
    set_index: int
    reps: int | None = None
    weight: float | None = None
    distance_meters: float | None = None
    duration_secs: int | None = None
    set_type: SetType = "normal"
    rpe: float | None = None
    rir: int | None = None


class WorkoutBase(BaseModel):
    routine_id: int | None = None
    completed_at: UtcDatetime
    duration: int


class WorkoutCreate(WorkoutBase):
    # Over-long durations are clamped to MAX_NEW_WORKOUT_SECS by the service,
    # not rejected.
    duration: int = Field(ge=0, le=MAX_INT32)
    sets: list[WorkoutSetCreate] = Field(max_length=MAX_SETS_PER_WORKOUT)


class WorkoutUpdate(BaseModel):
    completed_at: UtcDatetime | None = None
    duration: int | None = Field(default=None, ge=0, le=MAX_WORKOUT_SECS)
    sets: list[WorkoutSetCreate] | None = Field(
        default=None, max_length=MAX_SETS_PER_WORKOUT
    )

    _no_nulls = not_nullable("completed_at", "duration")


class Workout(WorkoutBase):
    id: int
    user_id: int
    duration_capped: bool = False
    sets: list[WorkoutSet] = []
