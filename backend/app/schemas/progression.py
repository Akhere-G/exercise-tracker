from typing import Optional

from .base import BaseModel


class ProgressionSuggestion(BaseModel):
    exercise_id: int
    action: str
    weight: Optional[float] = None
    reps: Optional[int] = None
    reason: str


class PersonaOut(BaseModel):
    slug: str
    name: str
    tagline: str


class StalledExercise(BaseModel):
    exercise_id: int
    name: str
    reason: str


class DeloadSuggestion(BaseModel):
    volume_percent: int
    max_rpe: float


class DeloadAssessment(BaseModel):
    should_deload: bool
    message: Optional[str] = None
    reasons: list[str] = []
    stalled_exercises: list[StalledExercise] = []
    suggestion: Optional[DeloadSuggestion] = None
