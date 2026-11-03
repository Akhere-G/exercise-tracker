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
