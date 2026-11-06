"""Deload recommendations.

Two independent signals can trigger a recommendation:

* strength progression: lifts whose estimated 1RM has stalled or declined
* training fatigue: sustained high effort (RPE) across recent workouts

Each signal is assessed on its own and returns ``None`` when there is not enough
data to judge, so thin history never produces a recommendation. After a
recommendation is issued, none is repeated until the cooldown has passed.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.personas import get_persona
from app.models import Exercise, UserProfile, Workout, WorkoutSet
from app.services import profile as profile_service
from app.services.analytics import estimate_one_rep_max

LOOKBACK_WEEKS = 8
COOLDOWN_DAYS = 14
RECENT_ACTIVITY_DAYS = 14

# Strength progression
SESSIONS_TO_JUDGE_A_LIFT = 4
MIN_DAYS_SPANNED_BY_SESSIONS = 14
MIN_TRACKED_LIFTS = 2
DECLINE_THRESHOLD = 0.05
STALLED_SHARE_TRIGGER = 0.4

# Training fatigue
EFFORT_WINDOW_DAYS = 14
MIN_WORKOUTS_WITH_EFFORT = 3
HIGH_EFFORT_RPE = 9.0

# What the user is advised to do
DELOAD_VOLUME_PERCENT = 60
DELOAD_MAX_RPE = 7.0

STALLED = "stalled"
DECLINED = "declined"


@dataclass(frozen=True)
class LiftSession:
    """The best estimated 1RM a lift reached in one workout."""

    completed_at: datetime
    estimated_one_rep_max: float


@dataclass(frozen=True)
class StalledLift:
    exercise_id: int
    reason: str
    sessions_judged: int
    first_one_rep_max: float
    latest_one_rep_max: float

    @property
    def change_percent(self) -> float:
        change = self.latest_one_rep_max / self.first_one_rep_max - 1
        return round(change * 100, 1)


@dataclass(frozen=True)
class StrengthAssessment:
    tracked_lift_count: int
    stalled_lifts: list[StalledLift]

    @property
    def stalled_share(self) -> float:
        return len(self.stalled_lifts) / self.tracked_lift_count


@dataclass(frozen=True)
class FatigueAssessment:
    average_rpe: float
    workouts_counted: int


def utc_now() -> datetime:
    """Naive UTC, matching how workout timestamps are stored."""
    return datetime.now(UTC).replace(tzinfo=None)


def find_stall_reason(session_one_rep_maxes: Sequence[float]) -> str | None:
    """Why the latest sessions count as a stall, or None if still progressing.

    ``session_one_rep_maxes`` is the best estimated 1RM per session, oldest first.
    """
    window = session_one_rep_maxes[-SESSIONS_TO_JUDGE_A_LIFT:]
    if len(window) < SESSIONS_TO_JUDGE_A_LIFT:
        return None

    first = window[0]
    latest = window[-1]
    if latest <= first * (1 - DECLINE_THRESHOLD):
        return DECLINED

    best_after_first = max(window[1:])
    if best_after_first <= first:
        return STALLED
    return None


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


def group_lift_sessions(working_sets) -> dict[int, list[LiftSession]]:
    """Each exercise's sessions, oldest first, keeping the best 1RM per workout."""
    best_one_rep_max: dict[tuple[int, int], float] = {}
    completed_at: dict[tuple[int, int], datetime] = {}
    session_keys_by_exercise: dict[int, list[tuple[int, int]]] = {}

    for working_set in working_sets:
        has_load = working_set.reps and working_set.weight and working_set.weight > 0
        if not has_load:
            continue

        key = (working_set.exercise_id, working_set.workout_id)
        one_rep_max = estimate_one_rep_max(working_set.weight, working_set.reps)

        if key not in best_one_rep_max:
            completed_at[key] = working_set.completed_at
            session_keys_by_exercise.setdefault(working_set.exercise_id, []).append(key)
            best_one_rep_max[key] = one_rep_max
        else:
            best_one_rep_max[key] = max(best_one_rep_max[key], one_rep_max)

    sessions_by_exercise: dict[int, list[LiftSession]] = {}
    for exercise_id, keys in session_keys_by_exercise.items():
        sessions_by_exercise[exercise_id] = [
            LiftSession(completed_at[key], best_one_rep_max[key]) for key in keys
        ]
    return sessions_by_exercise


def assess_strength_progression(working_sets) -> StrengthAssessment | None:
    """Which tracked lifts have stalled. None if too little data to judge."""
    sessions_by_exercise = group_lift_sessions(working_sets)

    tracked_lift_count = 0
    stalled_lifts: list[StalledLift] = []

    for exercise_id, sessions in sessions_by_exercise.items():
        recent_sessions = sessions[-SESSIONS_TO_JUDGE_A_LIFT:]
        if len(recent_sessions) < SESSIONS_TO_JUDGE_A_LIFT:
            continue

        days_spanned = (
            recent_sessions[-1].completed_at - recent_sessions[0].completed_at
        ).days
        if days_spanned < MIN_DAYS_SPANNED_BY_SESSIONS:
            continue

        tracked_lift_count += 1
        one_rep_maxes = [session.estimated_one_rep_max for session in recent_sessions]
        reason = find_stall_reason(one_rep_maxes)
        if reason is not None:
            stalled_lifts.append(
                StalledLift(
                    exercise_id=exercise_id,
                    reason=reason,
                    sessions_judged=len(recent_sessions),
                    first_one_rep_max=one_rep_maxes[0],
                    latest_one_rep_max=one_rep_maxes[-1],
                ),
            )

    if tracked_lift_count < MIN_TRACKED_LIFTS:
        return None
    return StrengthAssessment(tracked_lift_count, stalled_lifts)


def assess_training_fatigue(working_sets, now: datetime) -> FatigueAssessment | None:
    """Average effort across recent workouts. None if too few workouts logged RPE."""
    window_start = now - timedelta(days=EFFORT_WINDOW_DAYS)

    rpes_by_workout: dict[int, list[float]] = {}
    for working_set in working_sets:
        if working_set.rpe is None or working_set.completed_at < window_start:
            continue
        rpes_by_workout.setdefault(working_set.workout_id, []).append(working_set.rpe)

    if len(rpes_by_workout) < MIN_WORKOUTS_WITH_EFFORT:
        return None

    # Average per workout first so one long session can't dominate the result.
    workout_averages = [sum(rpes) / len(rpes) for rpes in rpes_by_workout.values()]

    average_rpe = sum(workout_averages) / len(workout_averages)
    return FatigueAssessment(average_rpe, len(workout_averages))


def is_in_cooldown(profile: UserProfile, now: datetime) -> bool:
    last_recommended_at = profile.last_deload_recommended_at
    if last_recommended_at is None:
        return False
    return now < last_recommended_at + timedelta(days=COOLDOWN_DAYS)


def has_trained_recently(working_sets, now: datetime) -> bool:
    """A lifter who has already stopped training doesn't need a deload."""
    if not working_sets:
        return False
    last_workout_at = working_sets[-1].completed_at
    return last_workout_at >= now - timedelta(days=RECENT_ACTIVITY_DAYS)


def explain_strength_trigger(
    strength: StrengthAssessment,
    exercise_names: dict[int, str],
) -> list[str]:
    reasons = [
        f"{len(strength.stalled_lifts)} of {strength.tracked_lift_count} tracked "
        f"lifts have stalled or declined.",
    ]
    for lift in strength.stalled_lifts:
        name = exercise_names[lift.exercise_id]
        verb = "fell" if lift.reason == DECLINED else "made no progress"
        reasons.append(
            f"{name}: estimated 1RM {verb} over your last {lift.sessions_judged} "
            f"sessions ({lift.first_one_rep_max:.0f} to "
            f"{lift.latest_one_rep_max:.0f}, {lift.change_percent:+.1f}%).",
        )
    return reasons


def explain_fatigue_trigger(fatigue: FatigueAssessment) -> str:
    return (
        f"Your average effort is RPE {fatigue.average_rpe:.1f} across your last "
        f"{fatigue.workouts_counted} workouts "
        f"(a deload is suggested from RPE {HIGH_EFFORT_RPE:.1f})."
    )


def load_exercise_names(db: Session, exercise_ids: list[int]) -> dict[int, str]:
    if not exercise_ids:
        return {}
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
    now = now or utc_now()
    profile = profile_service.get_or_create_profile(db, user_id)
    if is_in_cooldown(profile, now):
        return {"should_deload": False}

    lookback_start = now - timedelta(weeks=LOOKBACK_WEEKS)
    working_sets = fetch_working_sets(db, user_id, lookback_start)
    if not has_trained_recently(working_sets, now):
        return {"should_deload": False}

    strength = assess_strength_progression(working_sets)
    fatigue = assess_training_fatigue(working_sets, now)

    strength_triggered = (
        strength is not None and strength.stalled_share >= STALLED_SHARE_TRIGGER
    )
    fatigue_triggered = fatigue is not None and fatigue.average_rpe >= HIGH_EFFORT_RPE
    if not strength_triggered and not fatigue_triggered:
        return {"should_deload": False}

    stalled_lifts = strength.stalled_lifts if strength_triggered else []
    exercise_names = load_exercise_names(
        db,
        [lift.exercise_id for lift in stalled_lifts],
    )

    reasons: list[str] = []
    if strength_triggered:
        reasons.extend(explain_strength_trigger(strength, exercise_names))
    if fatigue_triggered:
        reasons.append(explain_fatigue_trigger(fatigue))

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
            for lift in stalled_lifts
        ],
        "suggestion": {
            "volume_percent": DELOAD_VOLUME_PERCENT,
            "max_rpe": DELOAD_MAX_RPE,
        },
    }
