import pytest
from app.models import Routine, Workout
from tests.helpers import count, item_payload, routine_payload, set_payload, workout_payload


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"duration": 60, "sets": [set_payload()]},
        {"completedAt": "2026-10-20T12:00:00", "sets": [set_payload()]},
        {"completedAt": "2026-10-20T12:00:00", "duration": 60},
        workout_payload(completedAt="yesterday"),
        workout_payload(duration="an hour"),
        workout_payload(duration=-1),
        workout_payload(sets="none"),
        workout_payload(sets=[{}]),
        workout_payload(sets=[set_payload(reps=0)]),
        workout_payload(sets=[{"exerciseId": 577, "weight": 20}]),
        workout_payload(sets=[set_payload(exerciseId="squat")]),
        workout_payload(sets=[set_payload(weight=-5)]),
        workout_payload(routineId="abc"),
    ],
)
def test_invalid_workouts_are_422_and_save_nothing(client, db, auth_headers, payload):
    response = client.post("/api/workouts", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert count(db, Workout) == 0


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"name": "Push", "day": 1},
        {"day": 1, "routineItems": [item_payload()]},
        routine_payload(name=""),
        routine_payload(name="x" * 256),
        routine_payload(day=7),
        routine_payload(day="monday"),
        routine_payload(routineItems=[item_payload(targetSets=0)]),
        routine_payload(routineItems=[item_payload(targetReps=None)]),
        routine_payload(routineItems=[item_payload(), item_payload(order=2)]),
        routine_payload(startTime="25:00"),
    ],
)
def test_invalid_routines_are_422_and_save_nothing(client, db, auth_headers, payload):
    response = client.post("/api/routines", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert count(db, Routine) == 0


def test_a_request_body_that_is_not_json_is_422(client, auth_headers):
    response = client.post(
        "/api/workouts",
        content="not json",
        headers={**auth_headers, "Content-Type": "application/json"},
    )

    assert response.status_code == 422


@pytest.mark.parametrize("url", ["/api/workouts/abc", "/api/routines/abc", "/api/exercises/abc"])
def test_non_numeric_ids_are_422(client, auth_headers, url):
    assert client.get(url, headers=auth_headers).status_code == 422


def test_an_invalid_patch_leaves_the_record_unchanged(client, auth_headers):
    created = client.post("/api/workouts", json=workout_payload(), headers=auth_headers).json()
    url = f"/api/workouts/{created['id']}"

    for body in ({"duration": -1}, {"sets": [set_payload(reps=0)]}, {"completedAt": "soon"}):
        assert client.patch(url, json=body, headers=auth_headers).status_code == 422

    assert client.get(url, headers=auth_headers).json() == created


@pytest.mark.parametrize(
    "body",
    [
        {"name": ""},
        {"day": 8},
        {"routineItems": [item_payload(targetSets=0)]},
        {"routineItems": [item_payload(), item_payload(order=2)]},
    ],
)
def test_an_invalid_routine_patch_leaves_the_routine_unchanged(client, auth_headers, body):
    created = client.post("/api/routines", json=routine_payload(), headers=auth_headers).json()
    url = f"/api/routines/{created['id']}"

    assert client.patch(url, json=body, headers=auth_headers).status_code == 422
    assert client.get(url, headers=auth_headers).json() == created


@pytest.mark.parametrize(
    "path, body",
    [
        ("/api/auth/register", {}),
        ("/api/auth/register", {"username": "A", "email": "bad", "password": "Password1"}),
        ("/api/auth/register", {"username": "A", "email": "a@example.com", "password": "weak"}),
        ("/api/auth/login", {"email": "a@example.com"}),
        ("/api/auth/login", {"password": "Password1"}),
    ],
)
def test_invalid_auth_payloads_are_422(client, path, body):
    assert client.post(path, json=body).status_code == 422


def test_empty_patches_are_accepted_and_change_nothing(client, auth_headers):
    created = client.post("/api/workouts", json=workout_payload(), headers=auth_headers).json()
    url = f"/api/workouts/{created['id']}"

    assert client.patch(url, json={}, headers=auth_headers).status_code == 200
    assert client.get(url, headers=auth_headers).json() == created
