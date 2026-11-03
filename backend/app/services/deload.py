from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional, Sequence

from app.constants.personas import get_persona
from app.models import Exercise, Workout, WorkoutSet
from app.services import profile as profile_service
from app.services.analytics import estimate_one_rep_max
from sqlalchemy import select
from sqlalchemy.orm import Session

LOOKBACK_WEEKS = 8
SESSIONS_TO_JUDGE = 4
DECLINE_THRESHOLD = 0.05
STALLED_SHARE_TRIGGER = 0.4
HIGH_EFFORT_RPE = 9.0
EFFORT_WINDOW_DAYS = 14
DELOAD_VOLUME_PERCENT = 60
DELOAD_MAX_RPE = 7.0


def stall_reason(session_e1rms: Sequence[float]) -> Optional[str]:
    """Why the latest sessions count as a stall, or None if still progressing.
    `session_e1rms` is the best estimated 1RM per session, oldest first."""
    window = session_e1rms[-SESSIONS_TO_JUDGE:]
    if len(window) < SESSIONS_TO_JUDGE:
        return None

    first, latest = window[0], window[-1]
    if latest <= first * (1 - DECLINE_THRESHOLD):
        return "declined"
    if max(window[1:]) <= first:
        return "stalled"
    return None


def average_effort(efforts: Sequence[float]) -> Optional[float]:
    return sum(efforts) / len(efforts) if efforts else None


def _recent_working_sets(db: Session, user_id: int, since: datetime):
    stmt = (
        select(
            WorkoutSet.exercise_id,
            Workout.id.label("workout_id"),
            Workout.completed_at,
            WorkoutSet.reps,
            WorkoutSet.weight,
            WorkoutSet.rpe,
        )
        .join(Workout, Workout.id == WorkoutSet.workout_id)
        .where(
            Workout.user_id == user_id,
            Workout.completed_at >= since,
            WorkoutSet.set_type != "warmup",
        )
        .order_by(Workout.completed_at)
    )
    return db.execute(stmt).all()


def _session_e1rms(rows) -> dict[int, list[float]]:
    best: dict[tuple[int, int], float] = {}
    order: dict[int, list[int]] = defaultdict(list)
    for row in rows:
        if not row.reps or not row.weight or row.weight <= 0:
            continue
        key = (row.exercise_id, row.workout_id)
        if key not in best:
            order[row.exercise_id].append(row.workout_id)
        best[key] = max(best.get(key, 0), estimate_one_rep_max(row.weight, row.reps))
    return {
        exercise_id: [best[(exercise_id, workout_id)] for workout_id in workout_ids]
        for exercise_id, workout_ids in order.items()
    }


def assess_deload(db: Session, user_id: int, now: Optional[datetime] = None) -> dict:
    now = now or datetime.utcnow()
    profile = profile_service.get_or_create_profile(db, user_id)
    rows = _recent_working_sets(db, user_id, now - timedelta(weeks=LOOKBACK_WEEKS))

    history = _session_e1rms(rows)
    active = {e: h for e, h in history.items() if len(h) >= SESSIONS_TO_JUDGE}
    stalls = {e: r for e, h in active.items() if (r := stall_reason(h))}

    effort_cutoff = now - timedelta(days=EFFORT_WINDOW_DAYS)
    recent_effort = average_effort(
        [r.rpe for r in rows if r.rpe is not None and r.completed_at >= effort_cutoff]
    )

    reasons = []
    if active and len(stalls) / len(active) >= STALLED_SHARE_TRIGGER:
        reasons.append(
            f"{len(stalls)} of {len(active)} tracked lifts have stalled or declined."
        )
    if recent_effort is not None and recent_effort >= HIGH_EFFORT_RPE:
        reasons.append(f"Your average effort lately is RPE {recent_effort:.1f}.")

    if not reasons:
        return {"should_deload": False}

    names = dict(
        db.execute(select(Exercise.id, Exercise.name).where(Exercise.id.in_(stalls))).all()
    )
    return {
        "should_deload": True,
        "message": get_persona(profile.coach_persona).lines["deload"],
        "reasons": reasons,
        "stalled_exercises": [
            {"exercise_id": e, "name": names[e], "reason": r} for e, r in stalls.items()
        ],
        "suggestion": {
            "volume_percent": DELOAD_VOLUME_PERCENT,
            "max_rpe": DELOAD_MAX_RPE,
        },
    }
