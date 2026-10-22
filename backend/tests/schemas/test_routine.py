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
