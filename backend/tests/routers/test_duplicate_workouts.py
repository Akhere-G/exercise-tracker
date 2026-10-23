from datetime import date

from app.models import UserAchievement, Workout
from sqlalchemy import func, select
from tests.helpers import routine_payload, set_payload, workout_payload


def _post(client, headers, **overrides):
    return client.post("/api/workouts", json=workout_payload(**overrides), headers=headers)


def _count(db, model) -> int:
    return db.execute(select(func.count()).select_from(model)).scalar_one()


def test_resubmitting_an_identical_workout_returns_the_existing_one(
    client, db, auth_headers
):
    first = _post(client, auth_headers)
    achievements = _count(db, UserAchievement)

    second = _post(client, auth_headers)

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json() == first.json()
    assert _count(db, Workout) == 1
    assert _count(db, UserAchievement) == achievements


def test_a_duplicate_does_not_inflate_the_weekly_streak(
    client, db, auth_headers, freeze
):
    freeze(date(2026, 10, 21))
    for _ in range(3):
        _post(client, auth_headers)

    stats = client.get("/api/workouts/stats", headers=auth_headers).json()

    assert stats == {"workoutCount": 1, "weeklyStreak": 1}


def test_a_different_workout_at_the_same_time_is_still_created(
    client, db, auth_headers
):
    _post(client, auth_headers)

    different_sets = _post(client, auth_headers, sets=[set_payload(reps=6)])
    different_duration = _post(client, auth_headers, duration=1800)
    two_sets = _post(client, auth_headers, sets=[set_payload(), set_payload(setIndex=2)])

    assert {r.status_code for r in (different_sets, different_duration, two_sets)} == {201}
    assert _count(db, Workout) == 4


def test_the_same_workout_for_another_routine_or_user_is_not_a_duplicate(
    client, db, auth_headers
):
    routine = client.post("/api/routines", json=routine_payload(), headers=auth_headers)
    _post(client, auth_headers)

    with_routine = _post(client, auth_headers, routineId=routine.json()["id"])
    other = client.post(
        "/api/auth/register",
        json={"username": "B", "email": "b@example.com", "password": "Password1"},
    ).json()["access_token"]
    other_user = _post(client, {"Authorization": f"Bearer {other}"})

    assert with_routine.status_code == other_user.status_code == 201
    assert _count(db, Workout) == 3


def test_the_same_sets_in_a_different_order_are_a_duplicate(client, db, auth_headers):
    sets = [set_payload(setIndex=1, reps=5), set_payload(setIndex=2, reps=8)]
    _post(client, auth_headers, sets=sets)

    again = _post(client, auth_headers, sets=list(reversed(sets)))

    assert again.status_code == 200
    assert _count(db, Workout) == 1
