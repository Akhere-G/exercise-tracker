from pydantic import BaseModel, field_validator
from typing import List


class ExerciseBase(BaseModel):
    name: str
    instructions: str
    image_url: str
    video_url: str
    equipment: str
    metrics: str
    muscles: List[str]

    @field_validator("muscles", mode="before")
    @classmethod
    def flatten_muscles(cls, v):
        return [m.name for m in v] if v else []


class Exercise(ExerciseBase):
    id: int
