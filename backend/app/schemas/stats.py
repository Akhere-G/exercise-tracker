from datetime import date, datetime

from .base import BaseModel


class StatsOverview(BaseModel):
    workout_count: int
    total_sets: int
    total_volume: float
    total_distance_meters: float
    total_duration_secs: int
    average_duration_secs: int
    active_days: int
    weekly_streak: int


class WeeklyTrend(BaseModel):
    week_start: date
    workout_count: int
    total_volume: float
    total_duration_secs: int


class MuscleStat(BaseModel):
    name: str
    primary_sets: int
    secondary_sets: int


class TopExercise(BaseModel):
    id: int
    name: str
    set_count: int
    workout_count: int
    last_used: datetime | None = None


class PersonalRecord(BaseModel):
    id: int
    type: str
    value: float
    exercise_id: int
    exercise_name: str
    unlocked_at: datetime


class Stats(BaseModel):
    overview: StatsOverview
    trends: list[WeeklyTrend]
    muscles: list[MuscleStat]
    top_exercises: list[TopExercise]
    personal_records: list[PersonalRecord]
