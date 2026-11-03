from tests.helpers import (
    REPS_WEIGHT_EXERCISE_ID,
    item_payload,
    routine_payload,
    set_payload,
    workout_payload,
)

OTHER_EXERCISE_ID = REPS_WEIGHT_EXERCISE_ID + 1


def _post_workout(client, headers, **overrides):
    return client.post(
        "/api/workouts", json=workout_payload(**overrides), headers=headers
    )


def test_set_metadata_round_trips(client, auth_headers):
    sets = [
        set_payload(setType="warmup", setIndex=1),
        set_payload(setIndex=2, rpe=8.5, rir=1, supersetGroup=1),
    ]

    response = _post_workout(client, auth_headers, sets=sets)

    assert response.status_code == 201
    stored = sorted(response.json()["sets"], key=lambda s: s["setIndex"])
    assert stored[0]["setType"] == "warmup"
    assert stored[1]["setType"] == "normal"
    assert stored[1]["rpe"] == 8.5
    assert stored[1]["rir"] == 1
    assert stored[1]["supersetGroup"] == 1


def test_an_invalid_set_type_or_rpe_is_a_422(client, auth_headers):
    bad_type = _post_workout(
        client, auth_headers, sets=[set_payload(setType="bogus")]
    )
    bad_rpe = _post_workout(client, auth_headers, sets=[set_payload(rpe=8.3)])

    assert bad_type.status_code == 422
    assert bad_rpe.status_code == 422


def test_warmups_do_not_set_weight_records(client, auth_headers):
    _post_workout(
        client,
        auth_headers,
        sets=[set_payload(weight=200, setType="warmup"), set_payload(weight=50, setIndex=2)],
    )

    records = client.get(
        f"/api/achievements/exercise/{REPS_WEIGHT_EXERCISE_ID}", headers=auth_headers
    ).json()

    weights = [r["value"] for r in records if r.get("achievement", {}).get("type") == "pr_weight"]
    assert weights == [50]


def test_warmups_are_excluded_from_volume(client, auth_headers):
    _post_workout(
        client,
        auth_headers,
        sets=[
            set_payload(weight=100, reps=10, setType="warmup"),
            set_payload(weight=20, reps=5, setIndex=2),
        ],
    )

    stats = client.get("/api/stats", headers=auth_headers).json()

    assert stats["overview"]["totalVolume"] == 100


def test_previous_sets_come_back_per_exercise_from_the_latest_workout(
    client, auth_headers
):
    _post_workout(
        client,
        auth_headers,
        completedAt="2026-10-01T12:00:00",
        sets=[set_payload(weight=10)],
    )
    _post_workout(
        client,
        auth_headers,
        completedAt="2026-10-10T12:00:00",
        sets=[
            set_payload(weight=30, setIndex=1),
            set_payload(weight=35, setIndex=2),
            set_payload(exerciseId=OTHER_EXERCISE_ID, weight=5),
        ],
    )

    response = client.get(
        f"/api/workouts/previous?exerciseIds={REPS_WEIGHT_EXERCISE_ID},{OTHER_EXERCISE_ID},999999",
        headers=auth_headers,
    )

    body = response.json()
    assert [s["weight"] for s in body[str(REPS_WEIGHT_EXERCISE_ID)]] == [30, 35]
    assert [s["weight"] for s in body[str(OTHER_EXERCISE_ID)]] == [5]
    assert "999999" not in body


def test_previous_sets_rejects_a_malformed_id_list(client, auth_headers):
    response = client.get("/api/workouts/previous?exerciseIds=1,abc", headers=auth_headers)

    assert response.status_code == 422


def test_routine_items_keep_rest_and_superset_group(client, auth_headers):
    payload = routine_payload(
        routineItems=[item_payload(restSecs=90, supersetGroup=2)]
    )

    created = client.post("/api/routines", json=payload, headers=auth_headers).json()
    item = created["routineItems"][0]

    assert item["restSecs"] == 90
    assert item["supersetGroup"] == 2

    updated = client.patch(
        f"/api/routines/{created['id']}",
        json={"routineItems": [item_payload(restSecs=45)]},
        headers=auth_headers,
    ).json()
    assert updated["routineItems"][0]["restSecs"] == 45
    assert updated["routineItems"][0]["supersetGroup"] is None


def test_profile_defaults_and_updates(client, auth_headers):
    defaults = client.get("/api/profile", headers=auth_headers).json()
    assert defaults["weightUnit"] == "kg"
    assert defaults["effortMetric"] == "off"
    assert defaults["onboardedAt"] is None

    updated = client.patch(
        "/api/profile",
        json={"weightUnit": "lb", "effortMetric": "rpe", "timezone": "Europe/London"},
        headers=auth_headers,
    )

    assert updated.status_code == 200
    assert updated.json()["weightUnit"] == "lb"
    assert client.get("/api/profile", headers=auth_headers).json()["effortMetric"] == "rpe"


def test_profile_rejects_bad_values(client, auth_headers):
    for body in ({"weightUnit": "stone"}, {"timezone": "Mars/Base"}):
        assert client.patch("/api/profile", json=body, headers=auth_headers).status_code == 422


def test_exercise_rest_setting_is_saved_per_user(client, auth_headers):
    url = f"/api/exercises/{REPS_WEIGHT_EXERCISE_ID}/settings"

    saved = client.put(url, json={"restSecs": 120}, headers=auth_headers)
    listing = client.get("/api/exercises/settings", headers=auth_headers).json()
    client.put(url, json={"restSecs": 60}, headers=auth_headers)
    relisted = client.get("/api/exercises/settings", headers=auth_headers).json()

    assert saved.status_code == 200
    assert listing == [{"exerciseId": REPS_WEIGHT_EXERCISE_ID, "restSecs": 120}]
    assert relisted[0]["restSecs"] == 60


def test_exercise_rest_setting_for_an_unknown_exercise_is_a_422(client, auth_headers):
    response = client.put(
        "/api/exercises/999999/settings", json={"restSecs": 60}, headers=auth_headers
    )

    assert response.status_code == 422
