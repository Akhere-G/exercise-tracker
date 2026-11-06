"""One-off achievements that are awarded once and never improved on."""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants.milestones import (
    MILESTONE_TYPES,
    VARIETY_THRESHOLDS,
    WORKOUT_COUNT_THRESHOLDS,
)
from app.models import Achievement, UserAchievement, UserProfile, Workout, WorkoutSet
from app.schemas.achievement import UserAchievementResponse
from app.services import achievement as achievement_service

EARLY_RISER_BEFORE_HOUR = 6
EARLY_BIRD_BEFORE_HOUR = 7
LUNCH_HOURS = range(12, 14)
NIGHT_OWL_FROM_HOUR = 21
MIDNIGHT_OIL_FROM_HOUR = 23
SPEED_DEMON_SECS = 20 * 60
SPEED_DEMON_MIN_SETS = 5
MARATHON_SECS = 90 * 60
HEAVY_HITTER_KG = 5_000
TON_UP_KG = 10_000
VOLUME_MONSTER_KG = 20_000
CENTURY = 100
SATURDAY = 5
THREE_PEAT_DAYS = 3
FIVE_DAY_FIRE_DAYS = 5
WEEKLY_WARRIOR_WORKOUTS = 5
MONTHLY_REGULAR_WORKOUTS = 15
FOUR_WEEK_FOCUS = 4
TWO_MONTH_CLUB = 8
TRIPLE_THREAT_PRS = 3
RECORD_BREAKER_PRS = 10
ANNIVERSARY_DAYS = 365
# Wide enough for a five-day run in either direction, padded for timezone shifts.
NEARBY_DAYS = timedelta(days=5)
STREAK_LOOKBACK_WEEKS = TWO_MONTH_CLUB


@dataclass(frozen=True)
class WorkoutContext:
    local_start: datetime
    duration_secs: int
    volume: float
    working_sets: int
    total_workouts: int
    distinct_exercises: int
    other_days: set[date]
    workouts_this_week: int
    workouts_this_month: int
    weeks_in_a_row: int
    pr_count_in_workout: int
    pr_count_total: int
    days_since_first: int

    @property
    def day(self) -> date:
        return self.local_start.date()

    def trained_on(self, offset_days: int) -> bool:
        return self.day + timedelta(days=offset_days) in self.other_days

    @property
    def consecutive_days(self) -> int:
        """Length of the run of training days that includes this workout."""
        run = 1
        for step in (-1, 1):
            offset = step
            while self.trained_on(offset):
                run += 1
                offset += step
        return run


def _is_weekend_warrior(ctx: WorkoutContext) -> bool:
    if ctx.local_start.weekday() < SATURDAY:
        return False
    return ctx.trained_on(1 if ctx.local_start.weekday() == SATURDAY else -1)


def _is_speed_demon(ctx: WorkoutContext) -> bool:
    return (
        ctx.duration_secs < SPEED_DEMON_SECS
        and ctx.working_sets >= SPEED_DEMON_MIN_SETS
    )


CHECKS: dict[str, Callable[[WorkoutContext], bool]] = {
    "first_workout": lambda ctx: ctx.total_workouts >= 1,
    "back_to_back": lambda ctx: ctx.consecutive_days >= 2,
    "three_peat": lambda ctx: ctx.consecutive_days >= THREE_PEAT_DAYS,
    "five_day_fire": lambda ctx: ctx.consecutive_days >= FIVE_DAY_FIRE_DAYS,
    "weekly_warrior": lambda ctx: ctx.workouts_this_week >= WEEKLY_WARRIOR_WORKOUTS,
    "monthly_regular": lambda ctx: ctx.workouts_this_month >= MONTHLY_REGULAR_WORKOUTS,
    "four_week_focus": lambda ctx: ctx.weeks_in_a_row >= FOUR_WEEK_FOCUS,
    "two_month_club": lambda ctx: ctx.weeks_in_a_row >= TWO_MONTH_CLUB,
    "early_riser": lambda ctx: ctx.local_start.hour < EARLY_RISER_BEFORE_HOUR,
    "early_bird": lambda ctx: ctx.local_start.hour < EARLY_BIRD_BEFORE_HOUR,
    "lunch_break_lifter": lambda ctx: ctx.local_start.hour in LUNCH_HOURS,
    "night_owl": lambda ctx: ctx.local_start.hour >= NIGHT_OWL_FROM_HOUR,
    "midnight_oil": lambda ctx: ctx.local_start.hour >= MIDNIGHT_OIL_FROM_HOUR,
    "speed_demon": _is_speed_demon,
    "weekend_warrior": _is_weekend_warrior,
    "century": lambda ctx: ctx.total_workouts >= CENTURY,
    "marathon_session": lambda ctx: ctx.duration_secs >= MARATHON_SECS,
    "heavy_hitter": lambda ctx: ctx.volume >= HEAVY_HITTER_KG,
    "ton_up": lambda ctx: ctx.volume >= TON_UP_KG,
    "volume_monster": lambda ctx: ctx.volume >= VOLUME_MONSTER_KG,
    "triple_threat": lambda ctx: ctx.pr_count_in_workout >= TRIPLE_THREAT_PRS,
    "record_breaker": lambda ctx: ctx.pr_count_total >= RECORD_BREAKER_PRS,
    "new_year_new_gains": lambda ctx: (ctx.day.month, ctx.day.day) == (1, 1),
    "first_anniversary": lambda ctx: ctx.days_since_first >= ANNIVERSARY_DAYS,
    **{
        f"workouts_{count}": lambda ctx, count=count: ctx.total_workouts >= count
        for count in WORKOUT_COUNT_THRESHOLDS
    },
    **{
        f"variety_{count}": lambda ctx, count=count: ctx.distinct_exercises >= count
        for count in VARIETY_THRESHOLDS
    },
}


def local_start(completed_at: datetime, duration_secs: int, timezone_name: str | None):
    """When the workout began on the user's wall clock (stored times are UTC)."""
    zone = ZoneInfo(timezone_name) if timezone_name else UTC
    started = completed_at.replace(tzinfo=UTC) - timedelta(
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
    now = datetime.now(UTC)
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
    start = local_start(workout.completed_at, workout.duration, zone_name)
    working_sets = [s for s in workout.sets if s.set_type != "warmup"]
    recent_days = _recent_days(db, user_id, workout, start.date(), zone_name)
    pr_in_workout, pr_total = _pr_counts(db, user_id, workout.id)
    return WorkoutContext(
        local_start=start,
        duration_secs=workout.duration,
        volume=sum((s.weight or 0) * (s.reps or 0) for s in working_sets),
        working_sets=len(working_sets),
        total_workouts=_count_until(db, user_id, workout.completed_at),
        distinct_exercises=_distinct_exercises_until(db, user_id, workout.completed_at),
        other_days=_nearby_days(db, user_id, workout, zone_name),
        workouts_this_week=sum(
            _week_start(d) == _week_start(start.date()) for d in recent_days
        ),
        workouts_this_month=sum(
            (d.year, d.month) == (start.year, start.month) for d in recent_days
        ),
        weeks_in_a_row=_weeks_in_a_row(recent_days, start.date()),
        pr_count_in_workout=pr_in_workout,
        pr_count_total=pr_total,
        days_since_first=(start.date() - _first_day(db, user_id, zone_name)).days,
    )


def _week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def _weeks_in_a_row(days: list[date], today: date) -> int:
    weeks = {_week_start(d) for d in days}
    run, week = 0, _week_start(today)
    while week in weeks:
        run += 1
        week -= timedelta(weeks=1)
    return run


def _recent_days(
    db: Session, user_id: int, workout: Workout, day: date, zone_name: str | None
) -> list[date]:
    """Local days of the user's workouts up to this one, back far enough for streaks."""
    since = datetime.combine(
        _week_start(day) - timedelta(weeks=STREAK_LOOKBACK_WEEKS, days=1), time.min
    )
    stmt = select(Workout.completed_at, Workout.duration).where(
        Workout.user_id == user_id,
        Workout.completed_at >= since,
        Workout.completed_at <= workout.completed_at,
    )
    return [
        local_start(completed_at, duration, zone_name).date()
        for completed_at, duration in db.execute(stmt)
    ]


def _first_day(db: Session, user_id: int, zone_name: str | None) -> date:
    stmt = (
        select(Workout.completed_at, Workout.duration)
        .where(Workout.user_id == user_id)
        .order_by(Workout.completed_at)
        .limit(1)
    )
    completed_at, duration = db.execute(stmt).one()
    return local_start(completed_at, duration, zone_name).date()


def _pr_counts(db: Session, user_id: int, workout_id: int) -> tuple[int, int]:
    """Records that beat an earlier one, in this workout and overall.

    The first row for an exercise is a first attempt rather than a beaten record.
    """
    stmt = (
        select(
            UserAchievement.achievement_id,
            UserAchievement.exercise_id,
            UserAchievement.workout_id,
        )
        .join(Achievement, UserAchievement.achievement_id == Achievement.id)
        .where(
            UserAchievement.user_id == user_id,
            Achievement.type.in_(achievement_service.PR_TYPES),
        )
        .order_by(UserAchievement.id)
    )
    seen: set[tuple[int, int | None]] = set()
    in_workout = total = 0
    for achievement_id, exercise_id, row_workout_id in db.execute(stmt):
        key = (achievement_id, exercise_id)
        if key in seen:
            total += 1
            in_workout += row_workout_id == workout_id
        seen.add(key)
    return in_workout, total


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
