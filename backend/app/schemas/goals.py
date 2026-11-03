from typing import Optional

from .base import BaseModel


class WeeklyGoal(BaseModel):
    target: int
    completed: int


class WeightGoal(BaseModel):
    target_kg: float
    current_kg: Optional[float] = None


class LiftGoal(BaseModel):
    exercise_id: int
    exercise_name: str
    target_kg: float
    best_kg: Optional[float] = None


class Goals(BaseModel):
    weekly: Optional[WeeklyGoal] = None
    body_weight: Optional[WeightGoal] = None
    lift: Optional[LiftGoal] = None
