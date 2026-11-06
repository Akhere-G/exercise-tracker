from tests.helpers import REPS_WEIGHT_EXERCISE_ID, set_payload, workout_payload


def log_session(client, auth_headers, reps, weight, **extra):
    sets = [
        set_payload(setIndex=i + 1, reps=reps, weight=weight, **extra)
        for i in range(3)
    ]
    response = client.post(
        "/api/workouts", json=workout_payload(sets=sets), headers=auth_headers
    )
    assert response.status_code == 201


def test_suggests_more_weight_after_a_comfortable_session(client, auth_headers):
    log_session(client, auth_headers, reps=8, weight=40)

    response = client.get(
        f"/api/progression?exerciseIds={REPS_WEIGHT_EXERCISE_ID}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    [suggestion] = response.json()
    assert suggestion["exerciseId"] == REPS_WEIGHT_EXERCISE_ID
    assert suggestion["action"] == "increase"
    assert suggestion["weight"] > 40
    assert suggestion["reps"] == 8


def test_warmups_do_not_set_the_baseline(client, auth_headers):
    sets = [
        set_payload(setIndex=1, reps=10, weight=20, setType="warmup"),
        set_payload(setIndex=2, reps=5, weight=60),
    ]
    client.post("/api/workouts", json=workout_payload(sets=sets), headers=auth_headers)

    [suggestion] = client.get(
        f"/api/progression?exerciseIds={REPS_WEIGHT_EXERCISE_ID}",
        headers=auth_headers,
    ).json()

    assert suggestion["weight"] > 60


def test_nothing_suggested_for_unlogged_exercises(client, auth_headers):
    response = client.get("/api/progression?exerciseIds=577", headers=auth_headers)
    assert response.json() == []


def test_rejects_malformed_exercise_ids(client, auth_headers):
    response = client.get("/api/progression?exerciseIds=a,b", headers=auth_headers)
    assert response.status_code == 422


def test_lists_personas(client, auth_headers):
    response = client.get("/api/ai/personas", headers=auth_headers)

    assert response.status_code == 200
    assert {p["slug"] for p in response.json()} == {
        "hype", "drill", "physio", "nerd", "oldschool",
    }
