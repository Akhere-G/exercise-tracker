from datetime import UTC, datetime, timedelta

from tests.helpers import REPS_WEIGHT_EXERCISE_ID, set_payload, workout_payload

SECOND_EXERCISE_ID = REPS_WEIGHT_EXERCISE_ID + 1


def log(client, auth_headers, days_ago, weight, **extra):
    completed = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days_ago)
    response = client.post(
        "/api/workouts",
        json=workout_payload(
            completedAt=completed.isoformat(),
            sets=[
                set_payload(weight=weight, reps=5, **extra),
                set_payload(
                    exerciseId=SECOND_EXERCISE_ID,
                    setIndex=2,
                    weight=weight,
                    reps=5,
                    **extra,
                ),
            ],
        ),
        headers=auth_headers,
    )
    assert response.status_code == 201


def test_no_deload_for_a_new_user(client, auth_headers):
    response = client.get("/api/progression/deload", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["shouldDeload"] is False


def test_recommends_a_deload_when_lifts_have_stalled(client, auth_headers):
    for days_ago in (21, 14, 7, 1):
        log(client, auth_headers, days_ago, weight=50)

    body = client.get("/api/progression/deload", headers=auth_headers).json()

    assert body["shouldDeload"] is True
    assert body["stalledExercises"][0]["reason"] == "stalled"
    assert body["stalledExercises"][0]["changePercent"] == 0
    assert "2 of 2 tracked lifts" in body["reasons"][0]
    assert body["suggestion"] == {"volumePercent": 60, "maxRpe": 7.0}
    assert body["message"]


def test_recommends_a_deload_after_a_run_of_hard_sessions(client, auth_headers):
    for days_ago, weight in ((6, 50), (3, 52), (1, 54)):
        log(client, auth_headers, days_ago, weight=weight, rpe=9.5)

    body = client.get("/api/progression/deload", headers=auth_headers).json()

    assert body["shouldDeload"] is True
    assert "average effort is RPE 9.5" in body["reasons"][0]
    assert body["stalledExercises"] == []


def test_progressing_lifter_is_left_alone(client, auth_headers):
    for days_ago, weight in ((21, 50), (14, 52), (7, 54), (1, 56)):
        log(client, auth_headers, days_ago, weight=weight)

    body = client.get("/api/progression/deload", headers=auth_headers).json()

    assert body["shouldDeload"] is False


def test_does_not_repeat_the_recommendation_during_the_cooldown(client, auth_headers):
    for days_ago in (21, 14, 7, 1):
        log(client, auth_headers, days_ago, weight=50)

    first = client.get("/api/progression/deload", headers=auth_headers).json()
    second = client.get("/api/progression/deload", headers=auth_headers).json()

    assert first["shouldDeload"] is True
    assert second["shouldDeload"] is False
