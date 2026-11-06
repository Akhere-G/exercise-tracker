from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Final

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.personas import get_persona
from app.models import Exercise, UserProfile, Workout, WorkoutSet
from app.services import profile as profile_service
from app.services.analytics import estimate_one_rep_max

LOOKBACK_WEEKS = 8
RECENT_WINDOW_DAYS = 14
COOLDOWN_DAYS = 14

SESSIONS_TO_JUDGE_A_LIFT = 4
MIN_TRACKED_LIFTS = 2
DECLINE_THRESHOLD = 0.05
STALLED_SHARE_TRIGGER = 0.4

MIN_WORKOUTS_WITH_EFFORT = 3
HIGH_EFFORT_RPE = 9.0

DELOAD_VOLUME_PERCENT = 60
DELOAD_MAX_RPE = 7.0

STALLED = "stalled"
DECLINED = "declined"

NO_DELOAD: Final = {"should_deload": False}


@dataclass(frozen=True)
class StalledLift:
    exercise_id: int
    reason: str
    first_one_rep_max: float
    latest_one_rep_max: float

    @property
    def change_percent(self) -> float:
        return round((self.latest_one_rep_max / self.first_one_rep_max - 1) * 100, 1)


def naive_utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def fetch_working_sets(db: Session, user_id: int, since: datetime):
    statement = (
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
    return db.execute(statement).all()


def collect_session_one_rep_maxes(working_sets) -> dict[int, list[float]]:
    best_by_workout_by_exercise: dict[int, dict[int, float]] = defaultdict(dict)

    for working_set in working_sets:
        if not working_set.reps or not working_set.weight or working_set.weight <= 0:
            continue
        one_rep_max = estimate_one_rep_max(working_set.weight, working_set.reps)
        best_by_workout = best_by_workout_by_exercise[working_set.exercise_id]
        previous_best = best_by_workout.get(working_set.workout_id, 0)
        best_by_workout[working_set.workout_id] = max(previous_best, one_rep_max)

    return {
        exercise_id: list(best_by_workout.values())
        for exercise_id, best_by_workout in best_by_workout_by_exercise.items()
    }


def find_stall_reason(session_one_rep_maxes: Sequence[float]) -> str | None:
    latest_sessions = session_one_rep_maxes[-SESSIONS_TO_JUDGE_A_LIFT:]
    if len(latest_sessions) < SESSIONS_TO_JUDGE_A_LIFT:
        return None

    first = latest_sessions[0]
    sessions_after_first = latest_sessions[1:]

    if sessions_after_first[-1] <= first * (1 - DECLINE_THRESHOLD):
        return DECLINED
    if max(sessions_after_first) <= first:
        return STALLED
    return None


def find_plateaued_lifts(working_sets) -> list[StalledLift]:
    one_rep_maxes_by_exercise = collect_session_one_rep_maxes(working_sets)
    tracked_lifts = {
        exercise_id: one_rep_maxes[-SESSIONS_TO_JUDGE_A_LIFT:]
        for exercise_id, one_rep_maxes in one_rep_maxes_by_exercise.items()
        if len(one_rep_maxes) >= SESSIONS_TO_JUDGE_A_LIFT
    }
    if len(tracked_lifts) < MIN_TRACKED_LIFTS:
        return []

    stalled_lifts = []
    for exercise_id, one_rep_maxes in tracked_lifts.items():
        stall_reason = find_stall_reason(one_rep_maxes)
        if stall_reason is not None:
            stalled_lift = StalledLift(
                exercise_id=exercise_id,
                reason=stall_reason,
                first_one_rep_max=one_rep_maxes[0],
                latest_one_rep_max=one_rep_maxes[-1],
            )
            stalled_lifts.append(stalled_lift)

    stalled_share = len(stalled_lifts) / len(tracked_lifts)
    if stalled_share < STALLED_SHARE_TRIGGER:
        return []
    return stalled_lifts


def find_high_average_rpe(working_sets, now: datetime) -> float | None:
    window_start = now - timedelta(days=RECENT_WINDOW_DAYS)
    recent_sets_with_rpe = [
        working_set
        for working_set in working_sets
        if working_set.rpe is not None and working_set.completed_at >= window_start
    ]

    workout_ids = {working_set.workout_id for working_set in recent_sets_with_rpe}
    if len(workout_ids) < MIN_WORKOUTS_WITH_EFFORT:
        return None

    total_rpe = sum(working_set.rpe for working_set in recent_sets_with_rpe)
    average_rpe = total_rpe / len(recent_sets_with_rpe)
    if average_rpe < HIGH_EFFORT_RPE:
        return None
    return average_rpe


def has_trained_recently(working_sets, now: datetime) -> bool:
    if not working_sets:
        return False
    last_workout_at = working_sets[-1].completed_at
    return last_workout_at >= now - timedelta(days=RECENT_WINDOW_DAYS)


def is_in_cooldown(profile: UserProfile, now: datetime) -> bool:
    if profile.last_deload_recommended_at is None:
        return False
    cooldown_ends_at = profile.last_deload_recommended_at + timedelta(
        days=COOLDOWN_DAYS,
    )
    return now < cooldown_ends_at


def explain_plateau(lift: StalledLift, exercise_name: str) -> str:
    outcome = "fell" if lift.reason == DECLINED else "made no progress"
    return (
        f"{exercise_name}: estimated 1RM {outcome} over your last "
        f"{SESSIONS_TO_JUDGE_A_LIFT} sessions "
        f"({lift.first_one_rep_max:.0f} to {lift.latest_one_rep_max:.0f}, "
        f"{lift.change_percent:+.1f}%)."
    )


def explain_high_effort(average_rpe: float) -> str:
    return (
        f"Your average effort over the last {RECENT_WINDOW_DAYS} days is "
        f"RPE {average_rpe:.1f} (a deload is suggested from RPE {HIGH_EFFORT_RPE})."
    )


def load_exercise_names(db: Session, exercise_ids: list[int]) -> dict[int, str]:
    statement = select(Exercise.id, Exercise.name).where(Exercise.id.in_(exercise_ids))
    return dict(db.execute(statement).all())


def record_recommendation(db: Session, profile: UserProfile, now: datetime) -> None:
    try:
        profile.last_deload_recommended_at = now
        db.commit()
    except Exception:
        db.rollback()
        raise


def assess_deload(db: Session, user_id: int, now: datetime | None = None) -> dict:
    now = now or naive_utc_now()
    profile = profile_service.get_or_create_profile(db, user_id)
    if is_in_cooldown(profile, now):
        return NO_DELOAD

    working_sets = fetch_working_sets(
        db,
        user_id,
        since=now - timedelta(weeks=LOOKBACK_WEEKS),
    )
    if not has_trained_recently(working_sets, now):
        return NO_DELOAD

    plateaued_lifts = find_plateaued_lifts(working_sets)
    high_average_rpe = find_high_average_rpe(working_sets, now)
    if not plateaued_lifts and high_average_rpe is None:
        return NO_DELOAD

    exercise_names = load_exercise_names(
        db,
        [lift.exercise_id for lift in plateaued_lifts],
    )
    reasons = [
        explain_plateau(lift, exercise_names[lift.exercise_id])
        for lift in plateaued_lifts
    ]
    if high_average_rpe is not None:
        reasons.append(explain_high_effort(high_average_rpe))

    record_recommendation(db, profile, now)
    return {
        "should_deload": True,
        "message": get_persona(profile.coach_persona).lines["deload"],
        "reasons": reasons,
        "stalled_exercises": [
            {
                "exercise_id": lift.exercise_id,
                "name": exercise_names[lift.exercise_id],
                "reason": lift.reason,
                "change_percent": lift.change_percent,
            }
            for lift in plateaued_lifts
        ],
        "suggestion": {
            "volume_percent": DELOAD_VOLUME_PERCENT,
            "max_rpe": DELOAD_MAX_RPE,
        },
    }
