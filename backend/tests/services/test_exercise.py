import pytest
from app.models import Exercise
from app.services import exercise as exercise_service
from fastapi import HTTPException
from sqlalchemy import select
from tests.helpers import REPS_WEIGHT_EXERCISE_ID


def test_ensure_exercises_exist_lists_the_unknown_ids(db):
    exercise_service.ensure_exercises_exist(db, [REPS_WEIGHT_EXERCISE_ID])

    with pytest.raises(HTTPException) as error:
        exercise_service.ensure_exercises_exist(db, [REPS_WEIGHT_EXERCISE_ID, 999_998, 999_999])

    assert error.value.status_code == 422
    assert "[999998, 999999]" in error.value.detail


def test_search_treats_like_wildcards_literally(db, user):
    assert exercise_service.get_exercises(db, user.id, search="%") == []

    underscore = exercise_service.get_exercises(db, user.id, search="_")
    assert underscore
    assert all("_" in row.Exercise.name for row in underscore)

    name = db.execute(
        select(Exercise.name).where(Exercise.id == REPS_WEIGHT_EXERCISE_ID)
    ).scalar_one()
    found = exercise_service.get_exercises(db, user.id, search=name)
    assert REPS_WEIGHT_EXERCISE_ID in {row.Exercise.id for row in found}
