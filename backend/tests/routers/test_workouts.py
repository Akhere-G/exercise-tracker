from app.models import Workout
from sqlalchemy import func, select
from tests.helpers import set_payload, workout_payload


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
        ids[day] = client.post("/api/workouts", json=payload, headers=auth_headers).json()["id"]

    response = client.get("/api/workouts?start=2026-10-19&end=2026-10-19", headers=auth_headers)

    assert [w["id"] for w in response.json()] == [ids[19]]


def test_a_date_range_ending_before_it_starts_is_a_422(client, auth_headers):
    response = client.get("/api/workouts?start=2026-10-20&end=2026-10-19", headers=auth_headers)

    assert response.status_code == 422
