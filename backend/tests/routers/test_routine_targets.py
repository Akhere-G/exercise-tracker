import pytest
from sqlalchemy import func, select

from app.models import Routine, RoutineItem
from tests.helpers import (
    DURATION_DISTANCE_EXERCISE_ID,
    DURATION_EXERCISE_ID,
    REPS_EXERCISE_ID,
    REPS_WEIGHT_EXERCISE_ID,
    item_payload,
    routine_payload,
    set_payload,
    workout_payload,
)

VALID_ITEMS = {
    "reps": (REPS_EXERCISE_ID, {"targetReps": 10}),
    "reps+weight": (REPS_WEIGHT_EXERCISE_ID, {"targetReps": 8, "targetWeight": 42.5}),
    "reps+weight without a weight": (REPS_WEIGHT_EXERCISE_ID, {"targetReps": 8}),
    "duration": (DURATION_EXERCISE_ID, {"targetReps": None, "targetDurationSecs": 45}),
    "duration+distance": (
        DURATION_DISTANCE_EXERCISE_ID,
        {"targetReps": None, "targetDurationSecs": 720, "targetDistanceMeters": 2000},
    ),
    "duration+distance without a distance": (
        DURATION_DISTANCE_EXERCISE_ID,
        {"targetReps": None, "targetDurationSecs": 720},
    ),
}

INVALID_ITEMS = {
    "reps with a weight": (REPS_EXERCISE_ID, {"targetWeight": 20}),
    "reps with a duration": (REPS_EXERCISE_ID, {"targetDurationSecs": 30}),
    "reps with a distance": (REPS_EXERCISE_ID, {"targetDistanceMeters": 100}),
    "reps+weight with a duration": (
        REPS_WEIGHT_EXERCISE_ID,
        {"targetDurationSecs": 30},
    ),
    "reps+weight with a distance": (
        REPS_WEIGHT_EXERCISE_ID,
        {"targetDistanceMeters": 100},
    ),
    "reps+weight without reps": (
        REPS_WEIGHT_EXERCISE_ID,
        {"targetReps": None, "targetDurationSecs": 30},
    ),
    "duration with reps": (DURATION_EXERCISE_ID, {"targetDurationSecs": 45}),
    "duration with a weight": (
        DURATION_EXERCISE_ID,
        {"targetReps": None, "targetDurationSecs": 45, "targetWeight": 10},
    ),
    "duration with a distance": (
        DURATION_EXERCISE_ID,
        {"targetReps": None, "targetDurationSecs": 45, "targetDistanceMeters": 10},
    ),
    "duration without a duration": (DURATION_EXERCISE_ID, {"targetReps": None}),
    "duration+distance with reps": (
        DURATION_DISTANCE_EXERCISE_ID,
        {"targetDurationSecs": 720},
    ),
    "duration+distance with a weight": (
        DURATION_DISTANCE_EXERCISE_ID,
        {"targetReps": None, "targetDurationSecs": 720, "targetWeight": 5},
    ),
    "duration+distance without a duration": (
        DURATION_DISTANCE_EXERCISE_ID,
        {"targetReps": None, "targetDistanceMeters": 2000},
    ),
}


def _item(exercise_id, overrides):
    return item_payload(exerciseId=exercise_id, **overrides)


def _routine_count(db):
    return db.execute(select(func.count()).select_from(Routine)).scalar_one()


@pytest.mark.parametrize("name", VALID_ITEMS)
def test_each_exercise_type_accepts_its_targets(client, auth_headers, name):
    exercise_id, overrides = VALID_ITEMS[name]

    response = client.post(
        "/api/routines",
        json=routine_payload(routineItems=[_item(exercise_id, overrides)]),
        headers=auth_headers,
    )

    assert response.status_code == 201
    stored = response.json()["routineItems"][0]
    for key, value in overrides.items():
        assert stored[key] == value


@pytest.mark.parametrize("name", INVALID_ITEMS)
def test_targets_that_do_not_fit_the_exercise_type_are_a_422(
    client, db, auth_headers, name
):
    exercise_id, overrides = INVALID_ITEMS[name]

    response = client.post(
        "/api/routines",
        json=routine_payload(routineItems=[_item(exercise_id, overrides)]),
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert _routine_count(db) == 0


def test_a_mismatch_names_the_exercise_and_the_target(client, auth_headers):
    item = _item(REPS_EXERCISE_ID, {"targetWeight": 20})

    response = client.post(
        "/api/routines",
        json=routine_payload(routineItems=[item]),
        headers=auth_headers,
    )

    detail = response.json()["detail"]
    assert f"Exercise {REPS_EXERCISE_ID}" in detail
    assert "cannot have a target weight" in detail


@pytest.mark.parametrize("name", INVALID_ITEMS)
def test_updating_with_mismatched_targets_is_a_422_and_keeps_the_routine(
    client, auth_headers, name
):
    exercise_id, overrides = INVALID_ITEMS[name]
    created = client.post("/api/routines", json=routine_payload(), headers=auth_headers)
    url = f"/api/routines/{created.json()['id']}"

    response = client.patch(
        url,
        json={"routineItems": [_item(exercise_id, overrides)]},
        headers=auth_headers,
    )

    assert response.status_code == 422
    kept = client.get(url, headers=auth_headers).json()["routineItems"]
    assert [i["exerciseId"] for i in kept] == [REPS_WEIGHT_EXERCISE_ID]


def test_a_routine_can_mix_all_four_types_and_update_between_them(client, auth_headers):
    items = [
        _item(*VALID_ITEMS[name]) | {"order": order}
        for order, name in enumerate(
            ["reps", "reps+weight", "duration", "duration+distance"]
        )
    ]
    created = client.post(
        "/api/routines",
        json=routine_payload(routineItems=items),
        headers=auth_headers,
    )
    assert created.status_code == 201

    url = f"/api/routines/{created.json()['id']}"
    items[1]["targetWeight"] = 60
    items[3]["targetDistanceMeters"] = 5000
    updated = client.patch(url, json={"routineItems": items}, headers=auth_headers)

    assert updated.status_code == 200
    stored = {i["exerciseId"]: i for i in updated.json()["routineItems"]}
    assert stored[REPS_WEIGHT_EXERCISE_ID]["targetWeight"] == 60
    assert stored[DURATION_DISTANCE_EXERCISE_ID]["targetDistanceMeters"] == 5000
    assert stored[REPS_EXERCISE_ID]["targetWeight"] is None
    assert stored[DURATION_EXERCISE_ID]["targetDistanceMeters"] is None


def test_zero_targets_are_stored_as_missing(client, db, auth_headers):
    item = _item(REPS_WEIGHT_EXERCISE_ID, {"targetWeight": 0, "targetDurationSecs": 0})

    response = client.post(
        "/api/routines",
        json=routine_payload(routineItems=[item]),
        headers=auth_headers,
    )

    assert response.status_code == 201
    stored = db.execute(select(RoutineItem)).scalar_one()
    assert stored.target_weight is None
    assert stored.target_duration_secs is None


@pytest.mark.parametrize(
    "overrides",
    [
        {"targetWeight": -1},
        {"targetWeight": 10_001},
        {"targetDistanceMeters": -1},
        {"targetDistanceMeters": 1_000_001},
    ],
)
def test_out_of_range_targets_are_rejected(client, auth_headers, overrides):
    response = client.post(
        "/api/routines",
        json=routine_payload(routineItems=[item_payload(**overrides)]),
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_a_routine_built_from_a_workout_keeps_only_the_targets_of_each_type(
    client, auth_headers
):
    sets = [
        set_payload(exerciseId=REPS_EXERCISE_ID, reps=12, weight=None),
        set_payload(exerciseId=REPS_EXERCISE_ID, setIndex=2, reps=10, weight=None),
        set_payload(exerciseId=REPS_WEIGHT_EXERCISE_ID, reps=8, weight=40),
        set_payload(exerciseId=REPS_WEIGHT_EXERCISE_ID, setIndex=2, reps=6, weight=50),
        set_payload(
            exerciseId=DURATION_EXERCISE_ID, reps=None, weight=None, durationSecs=45
        ),
        set_payload(
            exerciseId=DURATION_DISTANCE_EXERCISE_ID,
            reps=None,
            weight=None,
            durationSecs=720,
            distanceMeters=2000,
        ),
    ]
    workout = client.post(
        "/api/workouts", json=workout_payload(sets=sets), headers=auth_headers
    )
    assert workout.status_code == 201

    response = client.post(
        f"/api/routines/from-workout/{workout.json()['id']}",
        json={"name": "Saved", "day": 2},
        headers=auth_headers,
    )

    assert response.status_code == 201
    items = {i["exerciseId"]: i for i in response.json()["routineItems"]}
    assert items[REPS_EXERCISE_ID]["targetReps"] == 11
    assert items[REPS_EXERCISE_ID]["targetWeight"] is None
    assert items[REPS_WEIGHT_EXERCISE_ID]["targetReps"] == 7
    assert items[REPS_WEIGHT_EXERCISE_ID]["targetWeight"] == 45
    assert items[DURATION_EXERCISE_ID]["targetDurationSecs"] == 45
    assert items[DURATION_EXERCISE_ID]["targetReps"] is None
    cardio = items[DURATION_DISTANCE_EXERCISE_ID]
    assert cardio["targetDurationSecs"] == 720
    assert cardio["targetDistanceMeters"] == 2000
    assert cardio["targetWeight"] is None
