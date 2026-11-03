from datetime import date, timedelta

from pydantic import Field, field_validator

from .base import BaseModel


class BodyWeight(BaseModel):
    id: int
    measured_on: date
    weight_kg: float


class BodyWeightUpsert(BaseModel):
    measured_on: date
    weight_kg: float = Field(gt=0, le=700, allow_inf_nan=False)

    @field_validator("measured_on")
    @classmethod
    def not_in_the_future(cls, value: date) -> date:
        # A day of slack covers timezones ahead of the server.
        if value > date.today() + timedelta(days=1):
            raise ValueError("measured_on cannot be in the future.")
        return value
