"""One-off achievements that are awarded once and never improved on."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Callable
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants.milestones import MILESTONE_TYPES, VARIETY_THRESHOLDS
from app.models import Achievement, UserAchievement, UserProfile, Workout, WorkoutSet
from app.schemas.achievement import UserAchievementResponse
from app.services import achievement as achievement_service

EARLY_BIRD_BEFORE_HOUR = 7
NIGHT_OWL_FROM_HOUR = 21
MARATHON_SECS = 90 * 60
TON_UP_KG = 10_000
CENTURY = 100
SATURDAY = 5
NEARBY_DAYS = timedelta(days=3)


@dataclass(frozen=True)
class WorkoutContext:
    local_start: datetime
    duration_secs: int
    volume: float
    total_workouts: int
    distinct_exercises: int
    other_days: set[date]

    @property
    def day(self) -> date:
        return self.local_start.date()

    def trained_on(self, offset_days: int) -> bool:
        return self.day + timedelta(days=offset_days) in self.other_days


def _is_weekend_warrior(ctx: WorkoutContext) -> bool:
    if ctx.local_start.weekday() < SATURDAY:
        return False
    return ctx.trained_on(1 if ctx.local_start.weekday() == SATURDAY else -1)


CHECKS: dict[str, Callable[[WorkoutContext], bool]] = {
    "first_workout": lambda ctx: ctx.total_workouts >= 1,
    "back_to_back": lambda ctx: ctx.trained_on(-1) or ctx.trained_on(1),
    "early_bird": lambda ctx: ctx.local_start.hour < EARLY_BIRD_BEFORE_HOUR,
    "night_owl": lambda ctx: ctx.local_start.hour >= NIGHT_OWL_FROM_HOUR,
    "weekend_warrior": _is_weekend_warrior,
    "century": lambda ctx: ctx.total_workouts >= CENTURY,
    "marathon_session": lambda ctx: ctx.duration_secs >= MARATHON_SECS,
    "ton_up": lambda ctx: ctx.volume >= TON_UP_KG,
    **{
        f"variety_{count}": lambda ctx, count=count: ctx.distinct_exercises >= count
        for count in VARIETY_THRESHOLDS
    },
}


def local_start(completed_at: datetime, duration_secs: int, timezone_name: str | None):
    """When the workout began on the user's wall clock (stored times are UTC)."""
    zone = ZoneInfo(timezone_name) if timezone_name else timezone.utc
    started = completed_at.replace(tzinfo=timezone.utc) - timedelta(
        seconds=duration_secs
    )
    return started.astimezone(zone)


def check_and_award_milestones(
    db: Session, user_id: int, workout: Workout, commit: bool = True
) -> list[UserAchievementResponse]:
    """Award each milestone this workout satisfies that the user does not hold yet."""
    held = _held_types(db, user_id)
    ctx = _build_context(db, user_id, workout)
    earned = [t for t in MILESTONE_TYPES if t not in held and CHECKS[t](ctx)]
    if not earned:
        return []

    achievements = achievement_service._get_achievements_by_type(db, earned)
    now = datetime.now(timezone.utc)
    rows = [
        UserAchievement(
            user_id=user_id,
            achievement_id=achievements[type_].id,
            workout_id=workout.id,
            unlocked_at=now,
        )
        for type_ in earned
        if type_ in achievements
    ]
    db.add_all(rows)
    if commit:
        return achievement_service._commit_and_serialize(db, rows)
    db.flush()
    return achievement_service._serialize(rows)


def _held_types(db: Session, user_id: int) -> set[str]:
    stmt = (
        select(Achievement.type)
        .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
        .where(
            UserAchievement.user_id == user_id, Achievement.type.in_(MILESTONE_TYPES)
        )
    )
    return set(db.execute(stmt).scalars())


def _build_context(db: Session, user_id: int, workout: Workout) -> WorkoutContext:
    profile = db.get(UserProfile, user_id)
    zone_name = profile.timezone if profile else None
    return WorkoutContext(
        local_start=local_start(workout.completed_at, workout.duration, zone_name),
        duration_secs=workout.duration,
        volume=sum(
            (s.weight or 0) * (s.reps or 0)
            for s in workout.sets
            if s.set_type != "warmup"
        ),
        total_workouts=_count_until(db, user_id, workout.completed_at),
        distinct_exercises=_distinct_exercises_until(db, user_id, workout.completed_at),
        other_days=_nearby_days(db, user_id, workout, zone_name),
    )


def _count_until(db: Session, user_id: int, until: datetime) -> int:
    stmt = select(func.count(Workout.id)).where(
        Workout.user_id == user_id, Workout.completed_at <= until
    )
    return db.execute(stmt).scalar_one()


def _distinct_exercises_until(db: Session, user_id: int, until: datetime) -> int:
    stmt = (
        select(func.count(func.distinct(WorkoutSet.exercise_id)))
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .where(Workout.user_id == user_id, Workout.completed_at <= until)
    )
    return db.execute(stmt).scalar_one()


def _nearby_days(
    db: Session, user_id: int, workout: Workout, zone_name: str | None
) -> set[date]:
    stmt = select(Workout.completed_at, Workout.duration).where(
        Workout.user_id == user_id,
        Workout.id != workout.id,
        Workout.completed_at.between(
            workout.completed_at - NEARBY_DAYS, workout.completed_at + NEARBY_DAYS
        ),
    )
    return {
        local_start(completed_at, duration, zone_name).date()
        for completed_at, duration in db.execute(stmt)
    }
