import pytest
from app.models import Exercise, Routine, User, Workout
from app.services import user as user_service
from sqlalchemy import func, select

EXERCISE_ID = 577  # a "reps+weight" exercise from exercises.json


@pytest.fixture
def headers(db):
    user = User(username="Val", email="val@example.com", password_hash="x")
    db.add(user)
    db.commit()
    token = user_service.get_access_token(user.email).access_token
    return {"Authorization": f"Bearer {token}"}


def _set(**overrides):
    return {"exerciseId": EXERCISE_ID, "setIndex": 1, "reps": 5, "weight": 20, **overrides}


def _workout(**overrides):
    return {
        "completedAt": "2026-10-20T12:00:00",
        "duration": 3600,
        "sets": [_set()],
        **overrides,
    }


def _routine(**overrides):
    return {
        "name": "Push",
        "day": 1,
        "routineItems": [
            {"exerciseId": EXERCISE_ID, "targetSets": 3, "targetReps": 5, "order": 1}
        ],
        **overrides,
    }


def _count(db, model):
    return db.execute(select(func.count()).select_from(model)).scalar_one()


# registration ---------------------------------------------------------------

@pytest.mark.parametrize(
    "overrides",
    [
        {"username": ""},
        {"username": "   "},
        {"username": "x" * 51},
        {"email": "a" * 45 + "@example.com"},
    ],
)
def test_register_rejects_values_that_do_not_fit_the_columns(client, overrides):
    body = {"username": "Ok", "email": "ok@example.com", "password": "Password1"}

    response = client.post("/api/auth/register", json={**body, **overrides})

    assert response.status_code == 422


# workouts -------------------------------------------------------------------

def test_valid_workout_is_accepted(client, headers):
    assert client.post("/api/workouts", json=_workout(), headers=headers).status_code == 201


@pytest.mark.parametrize(
    "payload",
    [
        _workout(sets=[_set(weight=-1)]),
        _workout(sets=[_set(weight=10_001)]),
        _workout(sets=[_set(reps=2_147_483_648)]),
        _workout(sets=[_set(setIndex=0)]),
        _workout(sets=[_set(durationSecs=100_000)]),
        _workout(duration=-1),
        _workout(duration=8 * 24 * 60 * 60),
        _workout(sets=[_set(setIndex=i + 1) for i in range(501)]),
    ],
)
def test_out_of_range_workouts_are_rejected(client, headers, db, payload):
    response = client.post("/api/workouts", json=payload, headers=headers)

    assert response.status_code == 422
    assert _count(db, Workout) == 0


def test_workout_with_unknown_exercise_is_a_422_not_a_500(client, headers, db):
    response = client.post(
        "/api/workouts", json=_workout(sets=[_set(exerciseId=999_999)]), headers=headers
    )

    assert response.status_code == 422
    assert "999999" in response.json()["detail"]
    assert _count(db, Workout) == 0


def test_workout_update_is_validated_too(client, headers):
    created = client.post("/api/workouts", json=_workout(), headers=headers).json()
    url = f"/api/workouts/{created['id']}"

    assert client.patch(url, json={"duration": -5}, headers=headers).status_code == 422
    unknown = client.patch(
        url, json={"sets": [_set(exerciseId=999_999)]}, headers=headers
    )
    assert unknown.status_code == 422
    assert client.patch(url, json={"duration": 1800}, headers=headers).status_code == 200


def test_existing_out_of_range_rows_can_still_be_read(client, headers, db):
    """Bounds are for input only; legacy rows (e.g. inflated durations) must load."""
    created = client.post("/api/workouts", json=_workout(), headers=headers).json()
    workout = db.get(Workout, created["id"])
    workout.duration = 9_999_999
    db.commit()

    response = client.get(f"/api/workouts/{created['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["duration"] == 9_999_999


# routines -------------------------------------------------------------------

def test_valid_routine_is_accepted(client, headers):
    assert client.post("/api/routines", json=_routine(), headers=headers).status_code == 201


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": ""},
        {"name": "x" * 256},
        {"day": 7},
        {"day": -1},
        {
            "routineItems": [
                {"exerciseId": EXERCISE_ID, "targetSets": 0, "targetReps": 5, "order": 1}
            ]
        },
        {
            "routineItems": [
                {"exerciseId": EXERCISE_ID, "targetSets": 3, "targetReps": 5, "order": 1},
                {"exerciseId": EXERCISE_ID, "targetSets": 3, "targetReps": 5, "order": 2},
            ]
        },
    ],
)
def test_invalid_routines_are_rejected(client, headers, db, overrides):
    response = client.post("/api/routines", json=_routine(**overrides), headers=headers)

    assert response.status_code == 422
    assert _count(db, Routine) == 0


def test_routine_with_unknown_exercise_is_a_422_not_a_500(client, headers, db):
    payload = _routine(
        routineItems=[
            {"exerciseId": 999_999, "targetSets": 3, "targetReps": 5, "order": 1}
        ]
    )

    response = client.post("/api/routines", json=payload, headers=headers)

    assert response.status_code == 422
    assert _count(db, Routine) == 0


def test_routine_update_is_validated_too(client, headers):
    created = client.post("/api/routines", json=_routine(), headers=headers).json()
    url = f"/api/routines/{created['id']}"

    assert client.patch(url, json={"day": 9}, headers=headers).status_code == 422
    assert client.patch(url, json={"name": "Pull"}, headers=headers).status_code == 200


# exercises ------------------------------------------------------------------

@pytest.mark.parametrize("query", ["page=0", "page=-1", "limit=0", "limit=101"])
def test_exercise_paging_is_bounded(client, headers, query):
    assert client.get(f"/api/exercises?{query}", headers=headers).status_code == 422


def test_exercise_limit_is_honoured(client, headers):
    response = client.get("/api/exercises?limit=3", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 3


def test_search_treats_like_wildcards_literally(client, headers, db):
    # "%" would match every exercise if it were passed through as a wildcard.
    assert client.get("/api/exercises?search=%25", headers=headers).json() == []
    # "_" would match any single character; here it must match a literal one.
    underscore = client.get("/api/exercises?search=_", headers=headers).json()
    assert underscore
    assert all("_" in e["name"] for e in underscore)

    name = db.execute(select(Exercise.name).where(Exercise.id == EXERCISE_ID)).scalar_one()
    found = client.get(f"/api/exercises?search={name}", headers=headers).json()
    assert EXERCISE_ID in {e["id"] for e in found}
