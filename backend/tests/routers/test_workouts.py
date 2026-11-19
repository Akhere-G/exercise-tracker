from sqlalchemy import func, select

from app.models import Workout
from tests.helpers import REPS_WEIGHT_EXERCISE_ID, set_payload, workout_payload


def test_creating_a_workout_with_an_unknown_exercise_is_a_422(client, db, auth_headers):
    payload = workout_payload(sets=[set_payload(exerciseId=999_999)])

    response = client.post("/api/workouts", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert "999999" in response.json()["detail"]
    assert db.execute(select(func.count()).select_from(Workout)).scalar_one() == 0


def test_updating_a_workout_with_an_unknown_exercise_is_a_422(client, auth_headers):
    created = client.post("/api/workouts", json=workout_payload(), headers=auth_headers)
    url = f"/api/workouts/{created.json()['id']}"

    response = client.patch(
        url, json={"sets": [set_payload(exerciseId=999_999)]}, headers=auth_headers
    )

    assert response.status_code == 422


def test_workouts_can_be_limited_to_a_date_range(client, auth_headers):
    ids = {}
    for day in (18, 19, 20):
        payload = workout_payload(completedAt=f"2026-10-{day}T12:00:00")
        ids[day] = client.post(
            "/api/workouts", json=payload, headers=auth_headers
        ).json()["id"]

    response = client.get(
        "/api/workouts?start=2026-10-19&end=2026-10-19", headers=auth_headers
    )

    assert [w["id"] for w in response.json()] == [ids[19]]


def test_a_date_range_ending_before_it_starts_is_a_422(client, auth_headers):
    response = client.get(
        "/api/workouts?start=2026-10-20&end=2026-10-19", headers=auth_headers
    )

    assert response.status_code == 422


def test_creating_a_workout_longer_than_the_cap_clamps_the_duration(
    client, auth_headers
):
    payload = workout_payload(duration=30 * 24 * 60 * 60)

    response = client.post("/api/workouts", json=payload, headers=auth_headers)

    assert response.status_code == 201
    assert response.json()["duration"] == 3 * 60 * 60
    assert response.json()["durationCapped"] is True


def test_creating_a_workout_within_the_cap_is_not_flagged(client, auth_headers):
    response = client.post(
        "/api/workouts",
        json=workout_payload(duration=3 * 60 * 60),
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["duration"] == 3 * 60 * 60
    assert response.json()["durationCapped"] is False


SECOND_EXERCISE_ID = 578


def test_sets_are_returned_in_the_order_they_were_submitted(client, auth_headers):
    payload = workout_payload(
        sets=[
            set_payload(exerciseId=SECOND_EXERCISE_ID, setIndex=1),
            set_payload(exerciseId=REPS_WEIGHT_EXERCISE_ID, setIndex=1),
            set_payload(exerciseId=SECOND_EXERCISE_ID, setIndex=2),
        ]
    )

    created = client.post("/api/workouts", json=payload, headers=auth_headers)
    fetched = client.get(f"/api/workouts/{created.json()['id']}", headers=auth_headers)

    assert [s["exerciseId"] for s in fetched.json()["sets"]] == [
        SECOND_EXERCISE_ID,
        REPS_WEIGHT_EXERCISE_ID,
        SECOND_EXERCISE_ID,
    ]


def test_reordering_sets_on_update_is_kept_after_reload(client, auth_headers):
    created = client.post(
        "/api/workouts",
        json=workout_payload(
            sets=[
                set_payload(exerciseId=REPS_WEIGHT_EXERCISE_ID, setIndex=1),
                set_payload(exerciseId=SECOND_EXERCISE_ID, setIndex=1),
            ]
        ),
        headers=auth_headers,
    )
    url = f"/api/workouts/{created.json()['id']}"

    client.patch(
        url,
        json={
            "sets": [
                set_payload(exerciseId=SECOND_EXERCISE_ID, setIndex=1),
                set_payload(exerciseId=REPS_WEIGHT_EXERCISE_ID, setIndex=1),
            ]
        },
        headers=auth_headers,
    )
    fetched = client.get(url, headers=auth_headers)

    assert [s["exerciseId"] for s in fetched.json()["sets"]] == [
        SECOND_EXERCISE_ID,
        REPS_WEIGHT_EXERCISE_ID,
    ]
