"""Workout consistency and the training calendar."""

from collections import defaultdict
from datetime import date, datetime
from typing import Optional

from app.models import (
    Workout,
)
from app.services import workout as workout_service
from sqlalchemy import select
from sqlalchemy.orm import Session

from .common import today


def get_consistency(db: Session, user_id: int, year: int) -> dict:
    start = datetime(year, 1, 1)
    stmt = (
        select(Workout.completed_at)
        .where(
            Workout.user_id == user_id,
            Workout.completed_at >= start,
            Workout.completed_at < datetime(year + 1, 1, 1),
        )
        .order_by(Workout.completed_at)
    )
    days = [completed_at.date() for completed_at in db.execute(stmt).scalars()]

    per_day: dict[date, int] = defaultdict(int)
    per_week: dict[date, int] = defaultdict(int)
    per_month: dict[int, int] = defaultdict(int)
    weekday_counts = [0] * 7
    for day in days:
        per_day[day] += 1
        per_week[workout_service._week_start(day)] += 1
        per_month[day.month] += 1
        weekday_counts[day.weekday()] += 1

    # Averaged from the first workout of the year, so starting late does not dilute it.
    last_day = max(min(today(), date(year, 12, 31)), days[0]) if days else None
    weeks_elapsed = (
        (
            workout_service._week_start(last_day) - workout_service._week_start(days[0])
        ).days
        // 7
        + 1
        if days
        else 1
    )

    longest = streak = 0
    previous: Optional[date] = None
    for week in sorted(per_week):
        streak = (
            streak + 1
            if previous is not None and week - previous == workout_service.ONE_WEEK
            else 1
        )
        longest = max(longest, streak)
        previous = week

    best_month = max(per_month, key=lambda m: (per_month[m], -m)) if per_month else None
    current = workout_service.calculate_current_frequency_streaks(db, user_id)[1]

    return {
        "year": year,
        "total_workouts": len(days),
        "active_days": len(per_day),
        "average_per_week": round(len(days) / weeks_elapsed, 2),
        "best_week_count": max(per_week.values(), default=0),
        "longest_weekly_streak": longest,
        "current_weekly_streak": current,
        "best_month": best_month,
        "best_month_count": per_month[best_month] if best_month else 0,
        "weekday_counts": weekday_counts,
        "heatmap": [{"day": d, "count": c} for d, c in sorted(per_day.items())],
    }
