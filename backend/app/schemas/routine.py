from datetime import time
from typing import List, Optional
from pydantic import Field, model_validator
from .exercise import Exercise
from .base import BaseModel


MAX_ROUTINE_ITEMS = 100


class RoutineItemBase(BaseModel):
    exercise_id: int
    target_sets: int
    target_reps: Optional[int] = None
    target_duration_secs: Optional[int] = None
    order: int

    @model_validator(mode="after")
    def validate_reps_duration(self) -> "RoutineItemBase":
        no_reps = not self.target_reps or self.target_reps < 1
        no_duration = not self.target_duration_secs or self.target_duration_secs < 1
        if no_reps and no_duration:
            raise ValueError("Must have either target reps or target duration.")

        return self


class RoutineItemCreate(RoutineItemBase):
    target_sets: int = Field(ge=1, le=100)
    target_reps: Optional[int] = Field(default=None, ge=0, le=10_000)
    target_duration_secs: Optional[int] = Field(default=None, ge=0, le=24 * 60 * 60)
    order: int = Field(ge=0, le=1000)


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
    start_time: Optional[time] = None


class RoutineCreate(RoutineBase):
    name: str = Field(min_length=1, max_length=255)
    day: int = Field(ge=0, le=6)
    routine_items: List[RoutineItemCreate] = Field(max_length=MAX_ROUTINE_ITEMS)

    @model_validator(mode="after")
    def validate_unique_exercises(self) -> "RoutineCreate":
        _reject_duplicate_exercises(self.routine_items)
        return self


class Routine(RoutineBase):
    id: int
    user_id: int
    routine_items: List[RoutineItem] = []


class RoutineUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    day: Optional[int] = Field(default=None, ge=0, le=6)
    start_time: Optional[time] = None
    routine_items: Optional[List[RoutineItemCreate]] = Field(
        default=None, max_length=MAX_ROUTINE_ITEMS
    )

    @model_validator(mode="after")
    def validate_unique_exercises(self) -> "RoutineUpdate":
        _reject_duplicate_exercises(self.routine_items)
        return self
