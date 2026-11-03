from app.constants.personas import PERSONAS
from tests.helpers import set_payload, workout_payload


def log(client, auth_headers, completed_at, weight=20, duration=3600):
    response = client.post(
        "/api/workouts",
        json=workout_payload(
            completedAt=completed_at,
            duration=duration,
            sets=[set_payload(setIndex=i + 1, weight=weight) for i in range(2)],
        ),
        headers=auth_headers,
    )
    assert response.status_code == 201


def wrapped(client, auth_headers, **params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    response = client.get(f"/api/wrapped?{query}", headers=auth_headers)
    assert response.status_code == 200
    return response.json()


def test_month_summarises_only_that_month(client, auth_headers):
    log(client, auth_headers, "2026-10-19T12:00:00", weight=20)
    log(client, auth_headers, "2026-10-20T12:00:00", weight=40)
    log(client, auth_headers, "2026-09-10T12:00:00")

    result = wrapped(client, auth_headers, period="month", year=2026, month=10)

    assert result["workoutCount"] == 2
    assert result["totalSets"] == 4
    assert result["totalVolume"] == 2 * 5 * 20 + 2 * 5 * 40
    assert result["longestStreakDays"] == 2
    assert result["biggestSession"]["volume"] == 400
    assert result["topExercise"]["count"] == 4


def test_year_covers_every_month(client, auth_headers):
    log(client, auth_headers, "2026-03-10T12:00:00")
    log(client, auth_headers, "2026-10-20T12:00:00")

    result = wrapped(client, auth_headers, period="year", year=2026)

    assert result["workoutCount"] == 2
    assert result["start"] == "2026-01-01"
    assert result["end"] == "2026-12-31"


def test_favourite_time_of_day_and_weekday(client, auth_headers):
    log(client, auth_headers, "2026-10-20T08:00:00")  # Tuesday morning

    result = wrapped(client, auth_headers, period="month", year=2026, month=10)

    assert result["favouriteWeekday"] == 1
    assert result["favouriteTimeOfDay"] == "morning"


def test_an_empty_period_is_still_a_valid_summary(client, auth_headers):
    result = wrapped(client, auth_headers, period="month", year=2020, month=1)

    assert result["workoutCount"] == 0
    assert result["topExercise"] is None
    assert result["blurb"] is None


def test_blurb_uses_the_chosen_coach(client, auth_headers):
    log(client, auth_headers, "2026-10-20T12:00:00")
    client.patch("/api/profile", json={"coachPersona": "drill"}, headers=auth_headers)

    result = wrapped(client, auth_headers, period="month", year=2026, month=10)

    assert result["blurb"] == PERSONAS["drill"].lines["wrapped"].format(workouts=1)


def test_large_volume_is_compared_to_something_relatable(client, auth_headers):
    log(client, auth_headers, "2026-10-20T12:00:00", weight=1000)

    result = wrapped(client, auth_headers, period="month", year=2026, month=10)

    assert result["totalVolume"] == 10_000
    assert result["equivalence"] == {"label": "elephants", "count": 1.7}
