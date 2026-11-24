from datetime import timedelta

import pytest
from pydantic import ValidationError

from app.schemas.routine import RoutineCreate, RoutineItemBase, RoutineUpdate
from tests.helpers import item_payload, routine_payload

SAME_EXERCISE_TWICE = [item_payload(order=1), item_payload(order=2)]


def test_a_routine_cannot_repeat_an_exercise():
    with pytest.raises(ValidationError):
        RoutineCreate.model_validate(routine_payload(routineItems=SAME_EXERCISE_TWICE))
    with pytest.raises(ValidationError):
        RoutineUpdate.model_validate({"routineItems": SAME_EXERCISE_TWICE})


def test_stored_items_outside_the_input_bounds_can_still_be_read():
    RoutineItemBase(exercise_id=1, target_sets=0, target_reps=1, order=0)


def test_start_time_must_be_utc():
    with pytest.raises(ValidationError):
        RoutineCreate.model_validate(routine_payload(startTime="06:00:00+02:00"))
    with pytest.raises(ValidationError):
        RoutineUpdate.model_validate({"startTime": "06:00"})


def test_utc_start_time_is_accepted():
    routine = RoutineCreate.model_validate(routine_payload(startTime="06:00:00Z"))

    assert routine.start_time.utcoffset() == timedelta(0)
    assert RoutineUpdate.model_validate({"startTime": "06:00:00+00:00"}).start_time
