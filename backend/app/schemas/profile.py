from typing import Literal
from zoneinfo import available_timezones

from pydantic import Field, field_validator

from .base import BaseModel, UtcDatetime, not_nullable

WeightUnit = Literal["kg", "lb"]
EffortMetric = Literal["off", "rpe", "rir"]
Sex = Literal["male", "female", "unspecified"]
Experience = Literal["beginner", "intermediate", "advanced"]
Goal = Literal["strength", "hypertrophy", "fat_loss", "general", "endurance"]
CoachPersona = Literal["hype", "drill", "physio", "nerd", "oldschool"]
WrappedTheme = Literal["football", "f1", "boxing", "basketball", "athletics"]


class Profile(BaseModel):
    weight_unit: WeightUnit = "kg"
    effort_metric: EffortMetric = "off"
    sex: Sex | None = None
    experience: Experience | None = None
    goal: Goal | None = None
    workouts_per_week_target: int | None = None
    target_body_weight_kg: float | None = None
    target_lift_exercise_id: int | None = None
    target_lift_kg: float | None = None
    coach_persona: CoachPersona = "hype"
    wrapped_theme: WrappedTheme | None = None
    timezone: str | None = None
    onboarded_at: UtcDatetime | None = None


class ProfileUpdate(BaseModel):
    weight_unit: WeightUnit | None = None
    effort_metric: EffortMetric | None = None
    sex: Sex | None = None
    experience: Experience | None = None
    goal: Goal | None = None
    workouts_per_week_target: int | None = Field(default=None, ge=1, le=14)
    target_body_weight_kg: float | None = Field(
        default=None, gt=0, le=500, allow_inf_nan=False
    )
    target_lift_exercise_id: int | None = None
    target_lift_kg: float | None = Field(
        default=None, gt=0, le=2000, allow_inf_nan=False
    )
    coach_persona: CoachPersona | None = None
    wrapped_theme: WrappedTheme | None = None
    timezone: str | None = Field(default=None, max_length=64)
    onboarded_at: UtcDatetime | None = None

    _no_nulls = not_nullable("weight_unit", "effort_metric", "coach_persona")

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is not None and value not in available_timezones():
            raise ValueError("Unknown timezone.")
        return value


class ExerciseSetting(BaseModel):
    exercise_id: int
    rest_secs: int | None = None


class ExerciseSettingUpdate(BaseModel):
    rest_secs: int | None = Field(default=None, ge=0, le=60 * 60)
