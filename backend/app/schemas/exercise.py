from datetime import datetime

from pydantic import field_validator, model_validator
from sqlalchemy import Row

from .base import BaseModel


class Muscle(BaseModel):
    contribution_type: str
    name: str


class ExerciseBase(BaseModel):
    name: str
    instructions: str
    image_url: str
    video_url: str
    equipment: str
    metrics: str
    muscles: list[Muscle]
    priority: int

    @field_validator("muscles", mode="before")
    @classmethod
    def flatten_muscles(cls, v):
        return (
            [
                {"name": m.muscle.name, "contribution_type": m.contribution_type}
                for m in v
            ]
            if v
            else None
        )


class Exercise(ExerciseBase):
    id: int


class RankedExercise(ExerciseBase):
    id: int
    set_count: int
    workout_count: int
    last_used: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def flatten_exercise(cls, data):
        if isinstance(data, Row):
            exercise, set_count, workout_count, last_used = data

            return {
                "id": exercise.id,
                "name": exercise.name,
                "instructions": exercise.instructions,
                "image_url": exercise.image_url,
                "video_url": exercise.video_url,
                "equipment": exercise.equipment,
                "metrics": exercise.metrics,
                "priority": exercise.priority,
                "muscles": exercise.muscles,
                "set_count": set_count,
                "workout_count": workout_count,
                "last_used": last_used,
            }

        return data


class ExerciseResponseSimple(BaseModel):
    name: str
    instructions: str
    image_url: str
    video_url: str
    equipment: str
    metrics: str
    priority: int
