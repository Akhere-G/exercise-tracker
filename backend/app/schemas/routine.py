from datetime import time
from typing import List, Optional
from pydantic import model_validator
from .exercise import Exercise
from .base import BaseModel


class RoutineItemCreate(BaseModel):
    exercise_id: int
    target_sets: int
    target_reps: Optional[int] = None
    target_duration_secs: Optional[int] = None
    order: int

    @model_validator(mode="after")
    def validate_reps_duration(self) -> "RoutineItemCreate":
        no_reps = not self.target_reps or self.target_reps < 1
        no_duration = not self.target_duration_secs or self.target_duration_secs < 1
        if no_reps and no_duration:
            raise ValueError("Must have either target reps or target duration.")

        return self


class RoutineItem(RoutineItemCreate):
    routine_id: int
    exercise: Exercise


class RoutineBase(BaseModel):
    name: str
    day: int
    start_time: Optional[time] = None


class RoutineCreate(RoutineBase):
    routine_items: List[RoutineItemCreate]


class Routine(RoutineBase):
    id: int
    user_id: int
    routine_items: List[RoutineItem] = []


class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    day: Optional[int] = None
    start_time: Optional[time] = None
    routine_items: Optional[List[RoutineItemCreate]] = None
