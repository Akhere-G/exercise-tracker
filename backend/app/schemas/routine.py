from datetime import time, timedelta

from pydantic import Field, field_validator, model_validator

from .base import BaseModel, not_nullable
from .exercise import Exercise

MAX_ROUTINE_ITEMS = 100


class RoutineItemBase(BaseModel):
    exercise_id: int
    target_sets: int
    target_reps: int | None = None
    target_weight: float | None = None
    target_duration_secs: int | None = None
    target_distance_meters: float | None = None
    order: int
    rest_secs: int | None = None
    superset_group: int | None = None

    @model_validator(mode="after")
    def validate_reps_duration(self) -> "RoutineItemBase":
        no_reps = not self.target_reps or self.target_reps < 1
        no_duration = not self.target_duration_secs or self.target_duration_secs < 1
        if no_reps and no_duration:
            raise ValueError("Must have either target reps or target duration.")

        return self


class RoutineItemCreate(RoutineItemBase):
    target_sets: int = Field(ge=1, le=100)
    target_reps: int | None = Field(default=None, ge=0, le=10_000)
    target_weight: float | None = Field(
        default=None, ge=0, le=10_000, allow_inf_nan=False
    )
    target_duration_secs: int | None = Field(default=None, ge=0, le=24 * 60 * 60)
    target_distance_meters: float | None = Field(
        default=None, ge=0, le=1_000_000, allow_inf_nan=False
    )
    order: int = Field(ge=0, le=1000)
    rest_secs: int | None = Field(default=None, ge=0, le=60 * 60)
    superset_group: int | None = Field(default=None, ge=0, le=1000)


def _require_utc(value: time | None) -> time | None:
    if value is not None and (
        value.tzinfo is None or value.utcoffset() != timedelta(0)
    ):
        raise ValueError("start_time must be in UTC, for example 06:00:00Z.")
    return value


def _reject_duplicate_exercises(items):
    if items is None:
        return items
    ids = [item.exercise_id for item in items]
    if len(ids) != len(set(ids)):
        raise ValueError("A routine cannot contain the same exercise twice.")
    return items


class RoutineItem(RoutineItemBase):
    routine_id: int
    exercise: Exercise


class RoutineBase(BaseModel):
    name: str
    day: int
    start_time: time | None = None


class RoutineCreate(RoutineBase):
    name: str = Field(min_length=1, max_length=255)
    day: int = Field(ge=0, le=6)
    routine_items: list[RoutineItemCreate] = Field(max_length=MAX_ROUTINE_ITEMS)

    _validate_start_time = field_validator("start_time")(_require_utc)

    @model_validator(mode="after")
    def validate_unique_exercises(self) -> "RoutineCreate":
        _reject_duplicate_exercises(self.routine_items)
        return self


class RoutineFromWorkout(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    day: int = Field(ge=0, le=6)
    start_time: time | None = None

    _validate_start_time = field_validator("start_time")(_require_utc)


class Routine(RoutineBase):
    id: int
    user_id: int
    routine_items: list[RoutineItem] = []


class RoutineUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    day: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    routine_items: list[RoutineItemCreate] | None = Field(
        default=None, max_length=MAX_ROUTINE_ITEMS
    )

    _validate_start_time = field_validator("start_time")(_require_utc)
    _no_nulls = not_nullable("name", "day")

    @model_validator(mode="after")
    def validate_unique_exercises(self) -> "RoutineUpdate":
        _reject_duplicate_exercises(self.routine_items)
        return self
