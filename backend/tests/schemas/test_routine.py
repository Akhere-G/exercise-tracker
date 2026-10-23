import pytest
from app.schemas.routine import RoutineCreate, RoutineItemBase, RoutineUpdate
from pydantic import ValidationError
from tests.helpers import item_payload, routine_payload


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": ""},
        {"name": "x" * 256},
        {"day": 7},
        {"day": -1},
        {"routineItems": [item_payload(targetSets=0)]},
        {"routineItems": [item_payload(order=1), item_payload(order=2)]},
    ],
)
def test_routine_create_rejects_invalid_values(overrides):
    with pytest.raises(ValidationError):
        RoutineCreate.model_validate(routine_payload(**overrides))


@pytest.mark.parametrize(
    "payload",
    [
        {"day": 9},
        {"routineItems": [item_payload(order=1), item_payload(order=2)]},
    ],
)
def test_routine_update_rejects_invalid_values(payload):
    with pytest.raises(ValidationError):
        RoutineUpdate.model_validate(payload)


def test_stored_items_outside_the_input_bounds_can_still_be_read():
    RoutineItemBase(exercise_id=1, target_sets=0, target_reps=1, order=0)


@pytest.mark.parametrize("field", ["name", "day"])
def test_routine_update_rejects_explicit_null_for_required_fields(field):
    with pytest.raises(ValidationError):
        RoutineUpdate.model_validate({field: None})


def test_routine_update_still_allows_clearing_the_start_time():
    assert RoutineUpdate.model_validate({"startTime": None}).start_time is None


def test_duplicate_exercises_are_rejected_with_a_clear_message():
    payload = routine_payload(routineItems=[item_payload(order=1), item_payload(order=2)])

    with pytest.raises(ValidationError, match="same exercise twice"):
        RoutineCreate.model_validate(payload)


def test_distinct_exercises_are_accepted():
    items = [item_payload(exerciseId=1, order=1), item_payload(exerciseId=2, order=2)]

    assert len(RoutineCreate.model_validate(routine_payload(routineItems=items)).routine_items) == 2


@pytest.mark.parametrize(
    "overrides",
    [
        {"targetReps": None, "targetDurationSecs": None},
        {"targetReps": 0},
        {"targetReps": 0, "targetDurationSecs": 0},
        {"targetSets": 101},
        {"targetReps": 10_001},
        {"targetDurationSecs": 86_401, "targetReps": None},
        {"order": -1},
        {"order": 1001},
    ],
)
def test_routine_item_rejects_invalid_values(overrides):
    with pytest.raises(ValidationError):
        RoutineCreate.model_validate(
            routine_payload(routineItems=[item_payload(**overrides)])
        )


def test_a_duration_only_item_is_valid():
    item = item_payload(targetReps=None, targetDurationSecs=60)

    assert RoutineCreate.model_validate(routine_payload(routineItems=[item]))


def test_routine_update_rejects_duplicate_exercises():
    with pytest.raises(ValidationError):
        RoutineUpdate.model_validate(
            {"routineItems": [item_payload(order=1), item_payload(order=2)]}
        )


def test_routine_update_accepts_a_partial_payload():
    update = RoutineUpdate.model_validate({"name": "Pull"})

    assert update.model_fields_set == {"name"}
