from pydantic import field_validator
from typing import List
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
    muscles: List[Muscle]
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
