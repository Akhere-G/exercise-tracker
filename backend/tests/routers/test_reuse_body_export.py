from datetime import date, timedelta

from tests.helpers import (
    REPS_WEIGHT_EXERCISE_ID,
    item_payload,
    routine_payload,
    set_payload,
    workout_payload,
)

EX_A = REPS_WEIGHT_EXERCISE_ID
EX_B = REPS_WEIGHT_EXERCISE_ID + 1
EX_C = REPS_WEIGHT_EXERCISE_ID + 2


def _workout(client, headers, sets, **overrides):
    response = client.post(
        "/api/workouts", json=workout_payload(sets=sets, **overrides), headers=headers
    )
    assert response.status_code == 201
    return response.json()["id"]


# ---------- body weight


def test_body_weight_is_upserted_by_day(client, auth_headers):
    day = date.today().isoformat()

    first = client.put(
        "/api/body/weights", json={"measuredOn": day, "weightKg": 80}, headers=auth_headers
    )
    second = client.put(
        "/api/body/weights", json={"measuredOn": day, "weightKg": 79.5}, headers=auth_headers
    )
    listing = client.get("/api/body/weights", headers=auth_headers).json()

    assert first.status_code == second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert [(e["measuredOn"], e["weightKg"]) for e in listing] == [(day, 79.5)]


def test_body_weights_can_be_limited_to_a_range_and_deleted(client, auth_headers):
    today = date.today()
    ids = {}
    for offset in (10, 5, 0):
        day = (today - timedelta(days=offset)).isoformat()
        ids[offset] = client.put(
            "/api/body/weights",
            json={"measuredOn": day, "weightKg": 80 - offset},
            headers=auth_headers,
        ).json()["id"]

    start = (today - timedelta(days=6)).isoformat()
    ranged = client.get(f"/api/body/weights?start={start}", headers=auth_headers).json()
    assert [e["id"] for e in ranged] == [ids[5], ids[0]]

    assert client.delete(f"/api/body/weights/{ids[5]}", headers=auth_headers).status_code == 200
    assert client.delete(f"/api/body/weights/{ids[5]}", headers=auth_headers).status_code == 404


def test_body_weight_rejects_bad_values(client, auth_headers):
    today = date.today()
    for body in (
        {"measuredOn": today.isoformat(), "weightKg": 0},
        {"measuredOn": today.isoformat(), "weightKg": 5000},
        {"measuredOn": (today + timedelta(days=30)).isoformat(), "weightKg": 80},
    ):
        assert client.put("/api/body/weights", json=body, headers=auth_headers).status_code == 422


# ---------- routine from workout


def test_a_routine_can_be_built_from_a_workout(client, auth_headers):
    workout_id = _workout(
        client,
        auth_headers,
        [
            set_payload(exerciseId=EX_A, setIndex=1, reps=10, weight=20, setType="warmup", supersetGroup=1),
            set_payload(exerciseId=EX_A, setIndex=2, reps=8, supersetGroup=1),
            set_payload(exerciseId=EX_A, setIndex=3, reps=6, supersetGroup=1),
            set_payload(exerciseId=EX_A, setIndex=4, reps=10, supersetGroup=1),
            set_payload(exerciseId=EX_B, setIndex=1, reps=12, supersetGroup=1),
            set_payload(exerciseId=EX_C, setIndex=1, reps=5, supersetGroup=2),
        ],
    )

    response = client.post(
        f"/api/routines/from-workout/{workout_id}",
        json={"name": "Saved", "day": 2},
        headers=auth_headers,
    )

    assert response.status_code == 201
    items = {i["exerciseId"]: i for i in response.json()["routineItems"]}
    assert items[EX_A]["targetSets"] == 3  # warm-up excluded
    assert items[EX_A]["targetReps"] == 8  # median of 8, 6, 10
    assert items[EX_A]["order"] == 0 and items[EX_B]["order"] == 1
    assert items[EX_A]["supersetGroup"] == items[EX_B]["supersetGroup"] == 1
    assert items[EX_C]["supersetGroup"] is None  # alone in its group


def test_building_a_routine_from_someone_elses_or_missing_workout_is_a_404(
    client, auth_headers
):
    response = client.post(
        "/api/routines/from-workout/999999",
        json={"name": "Saved", "day": 2},
        headers=auth_headers,
    )

    assert response.status_code == 404


def test_building_a_routine_from_a_workout_with_no_sets_is_a_422(client, auth_headers):
    workout_id = _workout(client, auth_headers, [])

    response = client.post(
        f"/api/routines/from-workout/{workout_id}",
        json={"name": "Empty", "day": 0},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_a_routine_can_be_synced_from_a_workout_keeping_rest_times(client, auth_headers):
    routine = client.post(
        "/api/routines",
        json=routine_payload(
            routineItems=[
                item_payload(exerciseId=EX_A, restSecs=75, order=0),
                item_payload(exerciseId=EX_B, order=1),
            ]
        ),
        headers=auth_headers,
    ).json()
    workout_id = _workout(
        client,
        auth_headers,
        [
            set_payload(exerciseId=EX_A, setIndex=1, reps=5),
            set_payload(exerciseId=EX_A, setIndex=2, reps=5),
            set_payload(exerciseId=EX_C, setIndex=1, reps=12),
        ],
        routineId=routine["id"],
    )

    response = client.put(
        f"/api/routines/{routine['id']}/sync-from-workout/{workout_id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    items = {i["exerciseId"]: i for i in response.json()["routineItems"]}
    assert set(items) == {EX_A, EX_C}  # EX_B was not done, EX_C is new
    assert items[EX_A]["targetSets"] == 2
    assert items[EX_A]["restSecs"] == 75
    assert items[EX_C]["restSecs"] is None


def test_syncing_an_unknown_routine_is_a_404(client, auth_headers):
    workout_id = _workout(client, auth_headers, [set_payload()])

    response = client.put(
        f"/api/routines/999999/sync-from-workout/{workout_id}", headers=auth_headers
    )

    assert response.status_code == 404


# ---------- export


def test_workouts_export_as_csv_with_one_row_per_set(client, auth_headers):
    routine = client.post(
        "/api/routines",
        json=routine_payload(name="=HYPERLINK(\"http://evil\")"),
        headers=auth_headers,
    ).json()
    _workout(
        client,
        auth_headers,
        [
            set_payload(setIndex=1, setType="warmup", weight=20),
            set_payload(setIndex=2, weight=60, rpe=8.5),
        ],
        routineId=routine["id"],
        completedAt="2026-10-20T12:00:00",
        duration=3600,
    )

    response = client.get("/api/export/workouts.csv", headers=auth_headers)

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]
    lines = response.text.strip().split("\n")
    assert lines[0].startswith("Date,Workout Name,Duration (min)")
    assert len(lines) == 3
    assert "2026-10-20 12:00:00" in lines[1]
    assert ",warmup," in lines[1] and ",normal," in lines[2]
    assert ",8.5," in lines[2]
    # user-supplied text can not become a spreadsheet formula
    assert "'=HYPERLINK" in lines[1]


def test_exports_only_include_the_users_own_data(client, auth_headers, db):
    from app.models import User
    from app.services import user as user_service
    from tests.helpers import PASSWORD

    _workout(client, auth_headers, [set_payload()])
    other = User(
        username="Other",
        email="other@example.com",
        password_hash=user_service.get_password_hash(PASSWORD),
    )
    db.add(other)
    db.commit()
    other_headers = {
        "Authorization": "Bearer "
        + user_service.create_access_token({"sub": other.email})
    }

    response = client.get("/api/export/workouts.csv", headers=other_headers)

    assert response.text.strip().count("\n") == 0  # header only


def test_body_weight_exports_as_csv(client, auth_headers):
    client.put(
        "/api/body/weights",
        json={"measuredOn": date.today().isoformat(), "weightKg": 81.2},
        headers=auth_headers,
    )

    response = client.get("/api/export/body-weight.csv", headers=auth_headers)

    assert response.text.strip().split("\n") == [
        "Date,Weight (kg)",
        f"{date.today().isoformat()},81.2",
    ]


def test_exports_require_authentication(client):
    assert client.get("/api/export/workouts.csv").status_code == 401
