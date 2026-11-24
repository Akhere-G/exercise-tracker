from .base import BaseModel


class ProgressionSuggestion(BaseModel):
    exercise_id: int
    action: str
    weight: float | None = None
    reps: int | None = None
    reason: str


class PersonaOut(BaseModel):
    slug: str
    name: str
    tagline: str


class StalledExercise(BaseModel):
    exercise_id: int
    name: str
    reason: str
    change_percent: float


class DeloadSuggestion(BaseModel):
    volume_percent: int
    max_rpe: float


class DeloadAssessment(BaseModel):
    should_deload: bool
    message: str | None = None
    reasons: list[str] = []
    stalled_exercises: list[StalledExercise] = []
    suggestion: DeloadSuggestion | None = None
