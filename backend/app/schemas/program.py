from datetime import time
from typing import Optional

from pydantic import Field, field_validator

from .base import BaseModel
from .routine import _require_utc


class ProgramExerciseOut(BaseModel):
    name: str
    sets: int
    reps: int


class ProgramDayOut(BaseModel):
    name: str
    offset: int
    exercises: list[ProgramExerciseOut]


class ProgramOut(BaseModel):
    slug: str
    name: str
    description: str
    level: str
    days: list[ProgramDayOut]


class ProgramApply(BaseModel):
    start_day: int = Field(ge=0, le=6)
    start_time: Optional[time] = None

    _validate_start_time = field_validator("start_time")(_require_utc)
