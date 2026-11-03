"""A shareable summary of a month or year of training."""

from collections import Counter
from datetime import date, datetime, time, timedelta
from typing import Literal, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.milestones import MILESTONE_TYPES
from app.constants.personas import get_persona
from app.constants.wrapped import EQUIVALENCES, TIMES_OF_DAY
from app.models import Achievement, UserAchievement, Workout
from app.models.achievement import AchievementType
from app.schemas.wrapped import BiggestSession, Equivalence, NamedCount, Wrapped
from app.services import profile as profile_service
from app.services import workout as workout_service
from app.services.analytics.common import group_weights
from app.services.milestones import local_start

Period = Literal["month", "year"]
PR_TYPES = (
    AchievementType.PR_WEIGHT,
    AchievementType.PR_DISTANCE,
    AchievementType.PR_REPS,
    AchievementType.PR_DURATION,
)


def get_wrapped(
    db: Session,
    user_id: int,
    period: Period,
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> Wrapped:
    today = workout_service.date.today()
    start, end = _period_bounds(period, year or today.year, month or today.month)
    profile = profile_service.get_or_create_profile(db, user_id)
    workouts = workout_service.get_workouts(db, user_id, start=start, end=end)
    starts = [
        local_start(w.completed_at, w.duration, profile.timezone) for w in workouts
    ]
    sets = [s for w in workouts for s in w.sets if s.set_type != "warmup"]
    volumes = {w.id: _volume(w) for w in workouts}
    unlocked = _unlocked_types(db, user_id, start, end)

    top_exercise = Counter(s.exercise.name for s in sets).most_common(1)
    total_volume = sum(volumes.values())
    return Wrapped(
        period=period,
        start=start,
        end=end,
        workout_count=len(workouts),
        total_volume=total_volume,
        total_sets=len(sets),
        total_duration_secs=sum(w.duration for w in workouts),
        distinct_exercises=len({s.exercise_id for s in sets}),
        longest_streak_days=_longest_streak({t.date() for t in starts}),
        pr_count=sum(1 for t in unlocked if t in PR_TYPES),
        top_exercise=_named_count(top_exercise),
        top_muscle_group=_named_count(_muscle_group_sets(sets).most_common(1)),
        favourite_weekday=_most_common([t.weekday() for t in starts]),
        favourite_time_of_day=_most_common([_time_of_day(t) for t in starts]),
        biggest_session=_biggest_session(workouts, volumes),
        milestones=[t for t in unlocked if t in MILESTONE_TYPES],
        equivalence=_equivalence(total_volume),
        blurb=_blurb(profile.coach_persona, len(workouts)),
    )


def _period_bounds(period: Period, year: int, month: int) -> tuple[date, date]:
    if period == "year":
        return date(year, 1, 1), date(year, 12, 31)
    first = date(year, month, 1)
    next_month = (first + timedelta(days=32)).replace(day=1)
    return first, next_month - timedelta(days=1)


def _volume(workout: Workout) -> float:
    return sum(
        (s.weight or 0) * (s.reps or 0) for s in workout.sets if s.set_type != "warmup"
    )


def _muscle_group_sets(sets) -> Counter:
    counts: Counter = Counter()
    for workout_set in sets:
        muscles = [
            (link.muscle.name, link.contribution_type)
            for link in workout_set.exercise.muscles
        ]
        for group, weight in group_weights(muscles).items():
            counts[group] += weight
    return counts


def _unlocked_types(db: Session, user_id: int, start: date, end: date) -> list[str]:
    stmt = (
        select(Achievement.type)
        .join(UserAchievement, UserAchievement.achievement_id == Achievement.id)
        .where(
            UserAchievement.user_id == user_id,
            UserAchievement.unlocked_at >= datetime.combine(start, time.min),
            UserAchievement.unlocked_at
            < datetime.combine(end + timedelta(days=1), time.min),
        )
    )
    return list(db.execute(stmt).scalars())


def _longest_streak(days: set[date]) -> int:
    longest = run = 0
    for day in sorted(days):
        run = run + 1 if day - timedelta(days=1) in days else 1
        longest = max(longest, run)
    return longest


def _most_common(values: list):
    return Counter(values).most_common(1)[0][0] if values else None


def _named_count(top: list) -> Optional[NamedCount]:
    if not top:
        return None
    name, count = top[0]
    return NamedCount(name=name, count=round(count))


def _time_of_day(start: datetime) -> str:
    label = TIMES_OF_DAY[0][0]
    for name, first_hour in TIMES_OF_DAY:
        if start.hour >= first_hour:
            label = name
    return label


def _biggest_session(workouts, volumes: dict[int, float]) -> Optional[BiggestSession]:
    if not workouts:
        return None
    biggest = max(workouts, key=lambda w: volumes[w.id])
    return BiggestSession(
        workout_id=biggest.id,
        completed_at=biggest.completed_at.date(),
        volume=volumes[biggest.id],
    )


def _equivalence(volume: float) -> Optional[Equivalence]:
    for label, unit_kg in EQUIVALENCES:
        if volume >= unit_kg:
            return Equivalence(label=label, count=round(volume / unit_kg, 1))
    return None


def _blurb(persona_slug: str, workouts: int) -> Optional[str]:
    if not workouts:
        return None
    return get_persona(persona_slug).lines["wrapped"].format(workouts=workouts)
