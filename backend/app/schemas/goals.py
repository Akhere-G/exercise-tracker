from .base import BaseModel


class WeeklyGoal(BaseModel):
    target: int
    completed: int


class WeightGoal(BaseModel):
    target_kg: float
    current_kg: float | None = None


class LiftGoal(BaseModel):
    exercise_id: int
    exercise_name: str
    target_kg: float
    best_kg: float | None = None


class Goals(BaseModel):
    weekly: WeeklyGoal | None = None
    body_weight: WeightGoal | None = None
    lift: LiftGoal | None = None
