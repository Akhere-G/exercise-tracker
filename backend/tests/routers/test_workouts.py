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
