from datetime import datetime

import pytest
from app.schemas.workout import (
    MAX_SETS_PER_WORKOUT,
    WorkoutBase,
    WorkoutCreate,
    WorkoutSetBase,
    WorkoutSetCreate,
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


@pytest.mark.parametrize("field", ["completed_at", "duration"])
def test_workout_update_rejects_explicit_null_for_required_fields(field):
    with pytest.raises(ValidationError):
        WorkoutUpdate.model_validate({field: None})


@pytest.mark.parametrize(
    "values",
    [
        {},
        {"reps": 0},
        {"duration_secs": 0},
        {"reps": 0, "duration_secs": 0},
        {"weight": 20},
        {"distance_meters": 100},
    ],
)
def test_a_set_needs_reps_or_duration(values):
    with pytest.raises(ValidationError):
        WorkoutSetCreate(exercise_id=1, **values)


@pytest.mark.parametrize(
    "values",
    [
        {"reps": 1},
        {"duration_secs": 1},
        {"reps": 10, "weight": 0},
        {"duration_secs": 60, "distance_meters": 400.5},
    ],
)
def test_a_set_with_reps_or_duration_is_valid(values):
    assert WorkoutSetCreate(exercise_id=1, **values)


@pytest.mark.parametrize(
    "overrides",
    [
        {"reps": 10_001},
        {"reps": -1},
        {"weight": float("nan")},
        {"weight": float("inf")},
        {"distance_meters": 1_000_001},
        {"distance_meters": -0.1},
        {"setIndex": 1001},
    ],
)
def test_set_bounds_are_enforced(overrides):
    with pytest.raises(ValidationError):
        WorkoutCreate.model_validate(workout_payload(sets=[set_payload(**overrides)]))


def test_set_bounds_accept_the_limits():
    payload = workout_payload(
        duration=7 * 24 * 60 * 60,
        sets=[set_payload(reps=10_000, weight=10_000, setIndex=1000)],
    )

    assert WorkoutCreate.model_validate(payload)


def test_a_workout_needs_a_completion_time_and_duration():
    with pytest.raises(ValidationError):
        WorkoutCreate.model_validate({"sets": [set_payload()]})


def test_camel_case_input_maps_to_snake_case_fields():
    workout = WorkoutCreate.model_validate(workout_payload(routineId=4))

    assert workout.routine_id == 4
    assert workout.sets[0].exercise_id == set_payload()["exerciseId"]


def test_workout_update_with_no_fields_changes_nothing():
    assert WorkoutUpdate.model_validate({}).model_fields_set == set()
