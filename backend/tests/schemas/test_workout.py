from datetime import datetime

from app.schemas.workout import WorkoutBase, WorkoutCreate, WorkoutSetBase
from tests.helpers import set_payload, workout_payload


def test_workout_create_accepts_negative_weight_for_assisted_exercises():
    workout = WorkoutCreate.model_validate(
        workout_payload(sets=[set_payload(weight=-20)])
    )

    assert workout.sets[0].weight == -20


def test_stored_values_outside_the_input_bounds_can_still_be_read():
    WorkoutBase(completed_at=datetime(2026, 10, 20), duration=9_999_999)
    WorkoutSetBase(exercise_id=1, reps=50_000, weight=99_999)
