from datetime import datetime

from app.schemas.workout import WorkoutCreate, WorkoutSetCreate, WorkoutUpdate
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


def _weight_record_value(db, user):
    records = achievement_service.get_achievements_for_exercise(
        db, user.id, REPS_WEIGHT_EXERCISE_ID
    )
    return next(
        (r.value for r in records if r.achievement.type == "pr_weight"),
        None,
    )


def _edit_weight(db, user, workout_id, weight):
    update = WorkoutUpdate(
        sets=[
            WorkoutSetCreate(
                exercise_id=REPS_WEIGHT_EXERCISE_ID, set_index=1, reps=5, weight=weight
            )
        ]
    )
    return workout_service.update_workout(db, user.id, workout_id, update)


def test_a_record_drops_back_when_its_workout_is_edited_down(db, user):
    _log_weight(db, user, 80, day=18)
    typo = _log_weight(db, user, 100, day=19)
    assert _weight_record_value(db, user) == 100

    _edit_weight(db, user, typo.id, 10)

    assert _weight_record_value(db, user) == 80


def test_a_record_drops_back_when_its_workout_is_deleted(db, user):
    _log_weight(db, user, 80, day=18)
    best = _log_weight(db, user, 100, day=19)

    workout_service.delete_workout(db, user.id, best.id)

    assert _weight_record_value(db, user) == 80


def test_deleting_the_only_workout_removes_its_record(db, user):
    only = _log_weight(db, user, 100, day=19)

    workout_service.delete_workout(db, user.id, only.id)

    assert _weight_record_value(db, user) is None


def test_editing_a_workout_up_still_raises_the_record(db, user):
    _log_weight(db, user, 80, day=18)
    later = _log_weight(db, user, 70, day=19)

    _edit_weight(db, user, later.id, 90)

    assert _weight_record_value(db, user) == 90


def test_a_record_survives_when_a_different_workout_is_deleted(db, user):
    best = _log_weight(db, user, 100, day=18)
    lighter = _log_weight(db, user, 60, day=19)

    workout_service.delete_workout(db, user.id, lighter.id)

    assert _weight_record_value(db, user) == 100
    assert best.id is not None
