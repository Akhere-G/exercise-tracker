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


class MuscleGroupVolume(BaseModel):
    group: str
    sets: list[float]
    volume: list[float]
    this_week_sets: float


class MuscleVolume(BaseModel):
    weeks: list[date]
    groups: list[MuscleGroupVolume]


class MuscleRecovery(BaseModel):
    group: str
    fatigue: float
    status: str
    hours_since_trained: float | None = None


class StrengthStandard(BaseModel):
    key: str
    name: str
    exercise_id: int | None = None
    estimated_one_rep_max: float | None = None
    ratio: float | None = None
    level: str | None = None
    next_level: str | None = None
    progress: float | None = None
    kg_to_next: float | None = None


class StrengthStandards(BaseModel):
    body_weight_kg: float | None = None
    lifts: list[StrengthStandard]


class HeatmapDay(BaseModel):
    day: date
    count: int


class Consistency(BaseModel):
    year: int
    total_workouts: int
    active_days: int
    average_per_week: float
    best_week_count: int
    longest_weekly_streak: int
    current_weekly_streak: int
    best_month: int | None = None
    best_month_count: int
    weekday_counts: list[int]
    heatmap: list[HeatmapDay]


class DeltaValue(BaseModel):
    change: float
    percent: float | None = None


class PeriodComparison(BaseModel):
    current: StatsOverview
    previous: StatsOverview
    deltas: dict[str, DeltaValue]


class ExerciseSession(BaseModel):
    day: date
    estimated_one_rep_max: float | None = None
    top_weight: float | None = None
    volume: float


class ExerciseSeries(BaseModel):
    exercise_id: int
    name: str
    sessions: list[ExerciseSession]
