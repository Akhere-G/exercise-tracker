"""Weekly muscle volume and recovery."""

import math
from datetime import datetime, time, timedelta
from typing import Optional

from app.constants.muscle_groups import (
    GROUPS,
    RECOVERY_HALF_LIFE_HOURS,
)
from app.services import workout as workout_service
from sqlalchemy.orm import Session

from .common import today, working_sets_with_groups

RECOVERY_WINDOW_DAYS = 7
# Weighted hard sets at which a muscle counts as fully fatigued.
FATIGUE_SCALE = 6.0
FRESH_BELOW = 0.25
FATIGUED_FROM = 0.6


def get_muscle_volume(db: Session, user_id: int, weeks: int = 8) -> dict:
    """Weighted hard sets and volume per muscle group for each of the last weeks."""
    this_week = workout_service._week_start(today())
    first_week = this_week - timedelta(weeks=weeks - 1)
    week_starts = [first_week + timedelta(weeks=i) for i in range(weeks)]
    index = {week: i for i, week in enumerate(week_starts)}

    sets = {g: [0.0] * weeks for g in GROUPS}
    volume = {g: [0.0] * weeks for g in GROUPS}

    since = datetime.combine(first_week, time.min)
    for completed_at, reps, weight, weights in working_sets_with_groups(
        db, user_id, since
    ):
        i = index.get(workout_service._week_start(completed_at.date()))
        if i is None:
            continue
        load = (reps or 0) * (weight or 0)
        for group, share in weights.items():
            sets[group][i] += share
            volume[group][i] += load * share

    return {
        "weeks": week_starts,
        "groups": [
            {
                "group": g,
                "sets": sets[g],
                "volume": volume[g],
                "this_week_sets": sets[g][-1],
            }
            for g in GROUPS
        ],
    }


def _recovery_status(fatigue: float) -> str:
    if fatigue < FRESH_BELOW:
        return "fresh"
    if fatigue < FATIGUED_FROM:
        return "recovering"
    return "fatigued"


def get_recovery(
    db: Session, user_id: int, now: Optional[datetime] = None
) -> list[dict]:
    """Fatigue per muscle group from recent sets, decaying with a half-life."""
    now = now or datetime.utcnow()
    since = now - timedelta(days=RECOVERY_WINDOW_DAYS)

    load = {g: 0.0 for g in GROUPS}
    last_trained: dict[str, datetime] = {}
    for completed_at, _reps, _weight, weights in working_sets_with_groups(
        db, user_id, since
    ):
        hours = max((now - completed_at).total_seconds() / 3600, 0.0)
        for group, share in weights.items():
            half_life = RECOVERY_HALF_LIFE_HOURS[group]
            load[group] += share * math.exp(-math.log(2) * hours / half_life)
            if group not in last_trained or completed_at > last_trained[group]:
                last_trained[group] = completed_at

    result = []
    for group in GROUPS:
        fatigue = 1 - math.exp(-load[group] / FATIGUE_SCALE)
        trained = last_trained.get(group)
        result.append(
            {
                "group": group,
                "fatigue": round(fatigue, 3),
                "status": _recovery_status(fatigue),
                "hours_since_trained": (
                    round((now - trained).total_seconds() / 3600, 1)
                    if trained
                    else None
                ),
            }
        )
    return result
