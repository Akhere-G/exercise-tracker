from datetime import datetime

from app.schemas.workout import WorkoutCreate, WorkoutSetCreate
from app.services import achievement as achievement_service
from app.services import workout as workout_service
from tests.helpers import REPS_WEIGHT_EXERCISE_ID


def _log_weight(db, user, weight, day):
    workout = WorkoutCreate(
        completed_at=datetime(2026, 10, day, 12, 0),
        duration=3600,
        sets=[
            WorkoutSetCreate(
                exercise_id=REPS_WEIGHT_EXERCISE_ID, set_index=1, reps=5, weight=weight
            )
        ],
    )
    return workout_service.create_workout(db, user.id, workout)


def _weight_record(db, user):
    records = achievement_service.get_achievements_for_exercise(
        db, user.id, REPS_WEIGHT_EXERCISE_ID
    )
    return next(r for r in records if r.achievement.type == "pr_weight")


def test_fractional_weights_keep_their_precision_and_beat_each_other(db, user):
    _log_weight(db, user, 62.5, day=19)
    assert _weight_record(db, user).value == 62.5

    _log_weight(db, user, 62.6, day=20)
    assert _weight_record(db, user).value == 62.6
