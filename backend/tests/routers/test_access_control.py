import pytest
from app.models import Routine, Workout
from tests.helpers import (
    count,
    item_payload,
    register,
    routine_payload,
    set_payload,
    workout_payload,
)


@pytest.fixture
def other_headers(client):
    return register(client)


@pytest.fixture
def workout_id(client, auth_headers):
    return client.post("/api/workouts", json=workout_payload(), headers=auth_headers).json()["id"]


@pytest.fixture
def routine_id(client, auth_headers):
    return client.post("/api/routines", json=routine_payload(), headers=auth_headers).json()["id"]


def test_another_user_cannot_read_a_workout(client, workout_id, other_headers):
    assert client.get(f"/api/workouts/{workout_id}", headers=other_headers).status_code == 404


def test_another_user_cannot_see_a_workout_in_lists(client, workout_id, other_headers):
    assert client.get("/api/workouts", headers=other_headers).json() == []
    assert client.get("/api/workouts/stats", headers=other_headers).json() == {
        "workoutCount": 0,
        "weeklyStreak": 0,
    }
    assert client.get("/api/workouts/previous/577", headers=other_headers).json() == []
    assert client.get("/api/exercises/577/workouts", headers=other_headers).json() == []


def test_another_user_cannot_patch_a_workout(client, workout_id, auth_headers, other_headers):
    response = client.patch(
        f"/api/workouts/{workout_id}", json={"duration": 1}, headers=other_headers
    )

    assert response.status_code == 404
    assert client.get(f"/api/workouts/{workout_id}", headers=auth_headers).json()["duration"] == 3600


def test_another_user_cannot_delete_a_workout(client, db, workout_id, other_headers):
    response = client.delete(f"/api/workouts/{workout_id}", headers=other_headers)

    assert response.status_code == 404
    assert count(db, Workout) == 1


def test_another_user_cannot_read_a_routine(client, routine_id, other_headers):
    assert client.get(f"/api/routines/{routine_id}", headers=other_headers).status_code == 404
    assert client.get("/api/routines", headers=other_headers).json() == []


def test_another_user_cannot_patch_a_routine(client, routine_id, auth_headers, other_headers):
    response = client.patch(
        f"/api/routines/{routine_id}", json={"name": "Hijacked"}, headers=other_headers
    )

    assert response.status_code == 404
    assert client.get(f"/api/routines/{routine_id}", headers=auth_headers).json()["name"] == "Push"


def test_another_user_cannot_delete_a_routine(client, db, routine_id, other_headers):
    response = client.delete(f"/api/routines/{routine_id}", headers=other_headers)

    assert response.status_code == 404
    assert count(db, Routine) == 1


def test_a_workout_cannot_be_logged_against_another_users_routine(
    client, db, routine_id, other_headers
):
    response = client.post(
        "/api/workouts", json=workout_payload(routineId=routine_id), headers=other_headers
    )

    assert response.status_code == 404
    assert count(db, Workout) == 0


def test_workouts_can_be_logged_against_your_own_routine(client, routine_id, auth_headers):
    response = client.post(
        "/api/workouts", json=workout_payload(routineId=routine_id), headers=auth_headers
    )

    assert response.status_code == 201
    assert response.json()["routineId"] == routine_id


def test_routine_filters_only_see_your_own_workouts(
    client, routine_id, auth_headers, other_headers
):
    client.post("/api/workouts", json=workout_payload(routineId=routine_id), headers=auth_headers)

    url = f"/api/workouts?routineId={routine_id}"
    assert len(client.get(url, headers=auth_headers).json()) == 1
    assert client.get(url, headers=other_headers).json() == []
    stats = client.get(f"/api/workouts/stats?routineId={routine_id}", headers=other_headers)
    assert stats.json()["workoutCount"] == 0


def test_achievements_belong_to_the_user_who_earned_them(
    client, workout_id, auth_headers, other_headers
):
    mine = client.get("/api/achievements/user", headers=auth_headers).json()
    assert mine

    assert client.get("/api/achievements/user", headers=other_headers).json() == []
    assert client.get(f"/api/achievements/workout/{workout_id}", headers=other_headers).json() == []
    assert client.get("/api/achievements/exercise/577", headers=other_headers).json() == []


def test_replacing_routine_items_leaves_other_users_routines_alone(
    client, routine_id, auth_headers, other_headers
):
    other_routine = client.post(
        "/api/routines", json=routine_payload(name="Theirs"), headers=other_headers
    ).json()["id"]

    client.patch(
        f"/api/routines/{other_routine}",
        json={"routineItems": [item_payload(exerciseId=578)]},
        headers=other_headers,
    )

    mine = client.get(f"/api/routines/{routine_id}", headers=auth_headers).json()
    assert [i["exerciseId"] for i in mine["routineItems"]] == [577]


def test_a_workout_set_cannot_be_moved_to_another_users_workout(
    client, workout_id, auth_headers, other_headers
):
    client.patch(
        f"/api/workouts/{workout_id}",
        json={"sets": [set_payload(reps=99)]},
        headers=other_headers,
    )

    stored = client.get(f"/api/workouts/{workout_id}", headers=auth_headers).json()
    assert [s["reps"] for s in stored["sets"]] == [5]
