from datetime import date, timedelta

from tests.helpers import REPS_WEIGHT_EXERCISE_ID, set_payload, workout_payload


def test_goals_are_empty_until_targets_are_set(client, auth_headers):
    response = client.get("/api/profile/goals", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"weekly": None, "bodyWeight": None, "lift": None}


def test_goals_report_progress_towards_each_target(client, auth_headers):
    client.patch(
        "/api/profile",
        json={
            "workoutsPerWeekTarget": 3,
            "targetBodyWeightKg": 80,
            "targetLiftExerciseId": REPS_WEIGHT_EXERCISE_ID,
            "targetLiftKg": 100,
        },
        headers=auth_headers,
    )
    client.put(
        "/api/body/weights",
        json={"measuredOn": date.today().isoformat(), "weightKg": 85},
        headers=auth_headers,
    )
    client.post(
        "/api/workouts",
        json=workout_payload(
            completedAt=f"{date.today().isoformat()}T09:00:00",
            sets=[set_payload(weight=70)],
        ),
        headers=auth_headers,
    )

    goals = client.get("/api/profile/goals", headers=auth_headers).json()

    assert goals["weekly"] == {"target": 3, "completed": 1}
    assert goals["bodyWeight"] == {"targetKg": 80, "currentKg": 85}
    assert goals["lift"]["bestKg"] == 70
    assert goals["lift"]["targetKg"] == 100


def test_last_weeks_workouts_do_not_count_towards_this_week(client, auth_headers):
    client.patch(
        "/api/profile", json={"workoutsPerWeekTarget": 3}, headers=auth_headers
    )
    last_week = date.today() - timedelta(days=date.today().weekday() + 1)
    client.post(
        "/api/workouts",
        json=workout_payload(completedAt=f"{last_week.isoformat()}T09:00:00"),
        headers=auth_headers,
    )

    goals = client.get("/api/profile/goals", headers=auth_headers).json()

    assert goals["weekly"]["completed"] == 0
