import pytest
from app.config import settings
from app.models import Routine, Workout
from app.services import demo as demo_service
from tests.helpers import count, routine_payload, run_reset, workout_payload

DEMO_WORKOUTS = 14
DEMO_ROUTINES = 4


@pytest.fixture
def demo_headers(client, db, fixture, freeze, monkeypatch):
    monkeypatch.setattr(settings, "demo_mode_enabled", True)
    run_reset(db, fixture, freeze)
    token = client.post("/api/auth/demo").json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_demo_user_below_the_limit_can_still_add_workouts_and_routines(
    client, db, demo_headers, monkeypatch
):
    monkeypatch.setattr(demo_service, "DEMO_MAX_WORKOUTS", DEMO_WORKOUTS + 1)
    monkeypatch.setattr(demo_service, "DEMO_MAX_ROUTINES", DEMO_ROUTINES + 1)

    workout = client.post("/api/workouts", json=workout_payload(), headers=demo_headers)
    routine = client.post("/api/routines", json=routine_payload(), headers=demo_headers)

    assert (workout.status_code, routine.status_code) == (201, 201)


def test_demo_user_is_blocked_exactly_at_the_limit(client, db, demo_headers, monkeypatch):
    monkeypatch.setattr(demo_service, "DEMO_MAX_WORKOUTS", DEMO_WORKOUTS + 1)

    assert client.post("/api/workouts", json=workout_payload(), headers=demo_headers).status_code == 201
    blocked = client.post(
        "/api/workouts",
        json=workout_payload(completedAt="2026-10-19T09:00:00"),
        headers=demo_headers,
    )

    assert blocked.status_code == 403
    assert "limited" in blocked.json()["detail"]
    assert count(db, Workout) == DEMO_WORKOUTS + 1


def test_the_workout_and_routine_quotas_are_independent(client, db, demo_headers, monkeypatch):
    monkeypatch.setattr(demo_service, "DEMO_MAX_WORKOUTS", DEMO_WORKOUTS)  # full
    monkeypatch.setattr(demo_service, "DEMO_MAX_ROUTINES", DEMO_ROUTINES + 1)  # one free

    assert client.post("/api/workouts", json=workout_payload(), headers=demo_headers).status_code == 403
    assert client.post("/api/routines", json=routine_payload(), headers=demo_headers).status_code == 201
    assert client.post("/api/routines", json=routine_payload(), headers=demo_headers).status_code == 403
    assert count(db, Routine) == DEMO_ROUTINES + 1


def test_reading_and_deleting_still_work_at_the_limit(client, demo_headers, monkeypatch):
    monkeypatch.setattr(demo_service, "DEMO_MAX_WORKOUTS", DEMO_WORKOUTS)
    workouts = client.get("/api/workouts", headers=demo_headers).json()
    assert len(workouts) == DEMO_WORKOUTS

    deleted = client.delete(f"/api/workouts/{workouts[0]['id']}", headers=demo_headers)
    added = client.post("/api/workouts", json=workout_payload(), headers=demo_headers)

    assert deleted.status_code == 200
    assert added.status_code == 201


def test_regular_users_are_not_limited(client, db, user, auth_headers, monkeypatch):
    monkeypatch.setattr(demo_service, "DEMO_MAX_WORKOUTS", 1)
    monkeypatch.setattr(demo_service, "DEMO_MAX_ROUTINES", 1)

    for hour in range(3):
        workout = workout_payload(completedAt=f"2026-10-20T0{hour}:00:00")
        assert client.post("/api/workouts", json=workout, headers=auth_headers).status_code == 201
        assert client.post("/api/routines", json=routine_payload(), headers=auth_headers).status_code == 201


def test_quota_is_reported_per_user(db, user, fixture, freeze):
    run_reset(db, fixture, freeze)
    demo_user = demo_service.get_demo_user(db)

    assert demo_service.is_quota_exceeded(db, user) == {"workouts": False, "routines": False}
    assert demo_service.is_quota_exceeded(db, demo_user) == {"workouts": False, "routines": False}
