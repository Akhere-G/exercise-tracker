from datetime import datetime
from typing import Literal, Optional
from zoneinfo import available_timezones

from pydantic import Field, field_validator

from .base import BaseModel

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
    sex: Optional[Sex] = None
    experience: Optional[Experience] = None
    goal: Optional[Goal] = None
    workouts_per_week_target: Optional[int] = None
    target_body_weight_kg: Optional[float] = None
    target_lift_exercise_id: Optional[int] = None
    target_lift_kg: Optional[float] = None
    coach_persona: CoachPersona = "hype"
    wrapped_theme: Optional[WrappedTheme] = None
    timezone: Optional[str] = None
    onboarded_at: Optional[datetime] = None


class ProfileUpdate(BaseModel):
    weight_unit: Optional[WeightUnit] = None
    effort_metric: Optional[EffortMetric] = None
    sex: Optional[Sex] = None
    experience: Optional[Experience] = None
    goal: Optional[Goal] = None
    workouts_per_week_target: Optional[int] = Field(default=None, ge=1, le=14)
    target_body_weight_kg: Optional[float] = Field(
        default=None, gt=0, le=500, allow_inf_nan=False
    )
    target_lift_exercise_id: Optional[int] = None
    target_lift_kg: Optional[float] = Field(
        default=None, gt=0, le=2000, allow_inf_nan=False
    )
    coach_persona: Optional[CoachPersona] = None
    wrapped_theme: Optional[WrappedTheme] = None
    timezone: Optional[str] = Field(default=None, max_length=64)
    onboarded_at: Optional[datetime] = None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in available_timezones():
            raise ValueError("Unknown timezone.")
        return value


class ExerciseSetting(BaseModel):
    exercise_id: int
    rest_secs: Optional[int] = None


class ExerciseSettingUpdate(BaseModel):
    rest_secs: Optional[int] = Field(default=None, ge=0, le=60 * 60)
