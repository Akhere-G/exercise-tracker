from app.models import (
    Routine,
    RoutineItem,
    User,
    UserAchievement,
    Workout,
    WorkoutSet,
)
from sqlalchemy import delete, select
from tests.helpers import count, register, routine_payload, workout_payload


def _routine_with_workout(client, headers, **workout_overrides):
    routine = client.post("/api/routines", json=routine_payload(), headers=headers).json()
    workout = client.post(
        "/api/workouts",
        json=workout_payload(routineId=routine["id"], **workout_overrides),
        headers=headers,
    ).json()
    return routine["id"], workout["id"]


def test_deleting_a_routine_keeps_its_workouts_with_a_null_routine(
    client, db, auth_headers
):
    routine_id, workout_id = _routine_with_workout(client, auth_headers)

    assert client.delete(f"/api/routines/{routine_id}", headers=auth_headers).status_code == 200

    workout = client.get(f"/api/workouts/{workout_id}", headers=auth_headers)
    assert workout.status_code == 200
    assert workout.json()["routineId"] is None
    assert len(workout.json()["sets"]) == 1
    assert count(db, Routine) == 0
    assert count(db, RoutineItem) == 0


def test_deleting_a_routine_does_not_touch_other_routines_workouts(
    client, db, auth_headers
):
    keep_routine, keep_workout = _routine_with_workout(client, auth_headers)
    drop_routine, _ = _routine_with_workout(
        client, auth_headers, completedAt="2026-10-19T09:00:00"
    )

    client.delete(f"/api/routines/{drop_routine}", headers=auth_headers)

    kept = client.get(f"/api/workouts/{keep_workout}", headers=auth_headers).json()
    assert kept["routineId"] == keep_routine


def test_deleting_a_workout_removes_its_sets_but_keeps_the_achievements(
    client, db, auth_headers
):
    created = client.post("/api/workouts", json=workout_payload(), headers=auth_headers).json()
    assert count(db, WorkoutSet) == 1
    earned = count(db, UserAchievement)
    assert earned > 0

    client.delete(f"/api/workouts/{created['id']}", headers=auth_headers)

    assert count(db, Workout) == 0
    assert count(db, WorkoutSet) == 0
    assert count(db, UserAchievement) == earned
    workout_ids = db.execute(select(UserAchievement.workout_id)).scalars().all()
    assert set(workout_ids) == {None}


def test_deleting_a_user_cascades_to_everything_they_own(client, db, user, auth_headers):
    _routine_with_workout(client, auth_headers)
    other_headers = register(client)
    _routine_with_workout(client, other_headers)
    other = db.execute(select(User).where(User.email == "b@example.com")).scalar_one()

    db.execute(delete(User).where(User.id == user.id))
    db.commit()

    for model in (Routine, Workout, UserAchievement):
        owners = set(db.execute(select(model.user_id)).scalars())
        assert owners == {other.id}
    assert db.execute(select(User.id)).scalars().all() == [other.id]
    assert count(db, Routine) == 1
    assert count(db, Workout) == 1
    assert count(db, WorkoutSet) == 1
    assert count(db, RoutineItem) == 1
    assert count(db, UserAchievement) > 0


def test_replacing_routine_items_removes_the_old_ones(client, db, auth_headers):
    routine = client.post("/api/routines", json=routine_payload(), headers=auth_headers).json()
    new_items = [
        {"exerciseId": 578, "targetSets": 2, "targetReps": 8, "order": 1},
        {"exerciseId": 579, "targetSets": 2, "targetReps": 8, "order": 2},
    ]

    client.patch(
        f"/api/routines/{routine['id']}", json={"routineItems": new_items}, headers=auth_headers
    )

    assert count(db, RoutineItem) == 2
    stored = client.get(f"/api/routines/{routine['id']}", headers=auth_headers).json()
    assert [i["exerciseId"] for i in stored["routineItems"]] == [578, 579]


def test_replacing_workout_sets_removes_the_old_ones(client, db, auth_headers):
    created = client.post("/api/workouts", json=workout_payload(), headers=auth_headers).json()
    new_sets = [
        {"exerciseId": 577, "setIndex": 1, "reps": 8, "weight": 30},
        {"exerciseId": 577, "setIndex": 2, "reps": 6, "weight": 35},
    ]

    client.patch(f"/api/workouts/{created['id']}", json={"sets": new_sets}, headers=auth_headers)

    assert count(db, WorkoutSet) == 2
