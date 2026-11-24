from datetime import datetime

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.models import Exercise
from app.schemas.workout import WorkoutCreate, WorkoutSetCreate, WorkoutUpdate
from app.services import exercise as exercise_service
from app.services import workout as workout_service
from tests.helpers import REPS_WEIGHT_EXERCISE_ID


def test_ensure_exercises_exist_lists_the_unknown_ids(db):
    exercise_service.ensure_exercises_exist(db, [REPS_WEIGHT_EXERCISE_ID])

    with pytest.raises(HTTPException) as error:
        exercise_service.ensure_exercises_exist(
            db, [REPS_WEIGHT_EXERCISE_ID, 999_998, 999_999]
        )

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


def _muscle_names(exercise):
    return [link.muscle.name.lower() for link in exercise.muscles]


def test_a_muscle_filter_lists_each_exercise_once_with_a_search_term(db, user):
    # "r" matches several muscle names, so an exercise can match through more
    # than one of them. It must still appear once, and the ranking by search
    # term must work together with the muscle filter.
    rows = exercise_service.get_exercises(
        db, user.id, search="press", muscle="r", limit=100
    )

    ids = [row.Exercise.id for row in rows]
    assert ids
    assert len(ids) == len(set(ids))
    assert all("press" in row.Exercise.name.lower() for row in rows)
    assert all(any("r" in name for name in _muscle_names(row.Exercise)) for row in rows)


def test_a_muscle_filter_pages_without_repeating_exercises(db, user):
    first_page = exercise_service.get_exercises(db, user.id, muscle="r", limit=20)
    second_page = exercise_service.get_exercises(
        db, user.id, muscle="r", limit=20, page=2
    )

    first_ids = {row.Exercise.id for row in first_page}
    second_ids = {row.Exercise.id for row in second_page}
    assert len(first_page) == 20
    assert first_ids.isdisjoint(second_ids)


def _log_on_day(db, user, day, weight=50):
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


def _history_days(db, user):
    sets = exercise_service.get_workouts(db, user.id, REPS_WEIGHT_EXERCISE_ID)
    return [workout_set.completed_at.day for workout_set in sets]


def test_history_is_oldest_first_however_the_workouts_were_logged(db, user):
    _log_on_day(db, user, 20)
    _log_on_day(db, user, 18)
    _log_on_day(db, user, 19)

    assert _history_days(db, user) == [18, 19, 20]


def test_history_keeps_its_order_after_a_workout_is_edited(db, user):
    _log_on_day(db, user, 18)
    middle = _log_on_day(db, user, 19)
    _log_on_day(db, user, 20)

    # Editing replaces the workout's sets, so they get new row ids.
    workout_service.update_workout(
        db,
        user.id,
        middle.id,
        WorkoutUpdate(
            sets=[
                WorkoutSetCreate(
                    exercise_id=REPS_WEIGHT_EXERCISE_ID,
                    set_index=1,
                    reps=5,
                    weight=60,
                )
            ]
        ),
    )

    assert _history_days(db, user) == [18, 19, 20]


def test_history_is_capped_to_the_most_recent_sets(db, user, monkeypatch):
    monkeypatch.setattr(exercise_service, "MAX_HISTORY_SETS", 2)
    for day in (17, 18, 19, 20):
        _log_on_day(db, user, day)

    assert _history_days(db, user) == [19, 20]
