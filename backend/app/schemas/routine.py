from datetime import time
from typing import List, Optional
from pydantic import BaseModel


class RoutineItemCreate(BaseModel):
    exercise_id: int
    target_sets: int
    target_reps: int
    order: int


class RoutineItem(RoutineItemCreate):
    routine_id: int


class RoutineBase(BaseModel):
    name: str
    day: int
    start_time: Optional[time] = None


class RoutineCreate(RoutineBase):
    routine_items: List[RoutineItemCreate]


class Routine(RoutineBase):
    id: int
    user_id: int
    routine_items: List[RoutineItem]
