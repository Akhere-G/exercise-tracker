from datetime import datetime

import pytest
from app.schemas.workout import (
    MAX_SETS_PER_WORKOUT,
    WorkoutBase,
    WorkoutCreate,
    WorkoutSetBase,
    WorkoutUpdate,
)
from pydantic import ValidationError
from tests.helpers import set_payload, workout_payload


@pytest.mark.parametrize(
    "overrides",
    [
        {"sets": [set_payload(weight=-1)]},
        {"sets": [set_payload(weight=10_001)]},
        {"sets": [set_payload(reps=2_147_483_648)]},
        {"sets": [set_payload(setIndex=0)]},
        {"sets": [set_payload(durationSecs=100_000)]},
        {"duration": -1},
        {"duration": 8 * 24 * 60 * 60},
        {"sets": [set_payload(setIndex=i + 1) for i in range(MAX_SETS_PER_WORKOUT + 1)]},
    ],
)
def test_workout_create_rejects_out_of_range_values(overrides):
    with pytest.raises(ValidationError):
        WorkoutCreate.model_validate(workout_payload(**overrides))


def test_workout_update_rejects_negative_duration():
    with pytest.raises(ValidationError):
        WorkoutUpdate.model_validate({"duration": -5})


def test_stored_values_outside_the_input_bounds_can_still_be_read():
    WorkoutBase(completed_at=datetime(2026, 10, 20), duration=9_999_999)
    WorkoutSetBase(exercise_id=1, reps=50_000, weight=99_999)
