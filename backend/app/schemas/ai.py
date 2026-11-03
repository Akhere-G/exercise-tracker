from typing import Literal, Optional

from pydantic import Field

from .base import BaseModel
from .profile import Goal

Equipment = Literal[
    "bodyweight", "dumbbells", "barbell", "cables", "machines", "kettlebell", "bands"
]


class BuildRoutineRequest(BaseModel):
    goal: Goal
    equipment: list[Equipment] = Field(min_length=1)
    minutes: int = Field(ge=15, le=180)
    days_per_week: int = Field(ge=1, le=7)
    focus: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=500)


class PlannedItem(BaseModel):
    exercise_id: int
    sets: int
    reps: int
    rest_secs: int
    superset_group: Optional[int] = None


class PlannedRoutine(BaseModel):
    name: str
    items: list[PlannedItem]


class RoutinePlan(BaseModel):
    """What the model is asked to return."""

    routines: list[PlannedRoutine]
    rationale: str = ""


class PreviewItem(PlannedItem):
    name: str


class PreviewRoutine(BaseModel):
    name: str
    day: int
    items: list[PreviewItem]


class RoutinePreview(BaseModel):
    routines: list[PreviewRoutine]
    rationale: str
