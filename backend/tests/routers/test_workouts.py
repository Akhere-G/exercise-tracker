import pytest
from app.models import Workout, WorkoutSet
from app.schemas.workout import WorkoutCreate
from app.services import workout as workout_service
from sqlalchemy import func, select
from tests.helpers import add_exercise, set_payload, workout_payload


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


@pytest.mark.parametrize("field", ["completedAt", "duration"])
def test_patching_a_required_workout_field_to_null_is_a_422(client, auth_headers, field):
    created = client.post("/api/workouts", json=workout_payload(), headers=auth_headers)
    url = f"/api/workouts/{created.json()['id']}"

    response = client.patch(url, json={field: None}, headers=auth_headers)

    assert response.status_code == 422
    assert client.get(url, headers=auth_headers).json() == created.json()


def test_a_workout_with_a_muscleless_exercise_can_be_saved_and_read(
    client, db, auth_headers
):
    exercise = add_exercise(db)
    payload = workout_payload(sets=[set_payload(exerciseId=exercise.id)])

    created = client.post("/api/workouts", json=payload, headers=auth_headers)

    assert created.status_code == 201
    assert created.json()["sets"][0]["exercise"]["muscles"] == []
    fetched = client.get(f"/api/exercises/{exercise.id}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["muscles"] == []


def test_a_failed_save_rolls_back_the_whole_workout(db, user, monkeypatch):
    def boom():
        raise RuntimeError("commit failed")

    monkeypatch.setattr(db, "commit", boom)

    with pytest.raises(RuntimeError):
        workout_service.create_workout(db, user.id, WorkoutCreate.model_validate(workout_payload()))

    assert db.execute(select(func.count()).select_from(Workout)).scalar_one() == 0
    assert db.execute(select(func.count()).select_from(WorkoutSet)).scalar_one() == 0
