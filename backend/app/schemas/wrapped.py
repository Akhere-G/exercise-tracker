from datetime import date
from typing import Optional

from .base import BaseModel


class NamedCount(BaseModel):
    name: str
    count: int


class Equivalence(BaseModel):
    label: str
    count: float


class BiggestSession(BaseModel):
    workout_id: int
    completed_at: date
    volume: float


class Wrapped(BaseModel):
    period: str
    start: date
    end: date
    workout_count: int
    total_volume: float
    total_sets: int
    total_duration_secs: int
    distinct_exercises: int
    longest_streak_days: int
    pr_count: int
    top_exercise: Optional[NamedCount] = None
    top_muscle_group: Optional[NamedCount] = None
    favourite_weekday: Optional[int] = None
    favourite_time_of_day: Optional[str] = None
    biggest_session: Optional[BiggestSession] = None
    milestones: list[str]
    equivalence: Optional[Equivalence] = None
    blurb: Optional[str] = None
