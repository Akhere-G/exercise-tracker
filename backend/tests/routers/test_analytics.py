from datetime import date, datetime, timedelta

from app.models import User
from app.services import analytics as analytics_service
from sqlalchemy import select
from tests.helpers import REPS_WEIGHT_EXERCISE_ID, set_payload, workout_payload

BENCH_ID = 25  # Barbell Bench Press, one of the strength standard lifts


def _log(client, headers, sets, when: datetime | None = None):
    when = when or datetime.now().replace(microsecond=0)
    response = client.post(
        "/api/workouts",
        json=workout_payload(completedAt=when.isoformat(), sets=sets),
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def _by_group(items, key="group"):
    return {item[key]: item for item in items}


# ---------- muscle volume


def test_muscle_volume_counts_working_sets_and_skips_warmups(client, auth_headers):
    _log(
        client,
        auth_headers,
        [
            set_payload(setIndex=1, setType="warmup", weight=10),
            set_payload(setIndex=2),
            set_payload(setIndex=3),
            set_payload(setIndex=4),
        ],
    )

    data = client.get("/api/stats/muscle-volume?weeks=4", headers=auth_headers).json()
    groups = _by_group(data["groups"])

    assert len(data["weeks"]) == 4
    assert groups["triceps"]["thisWeekSets"] == 3.0
    assert groups["triceps"]["volume"][-1] == 3 * 5 * 20
    assert groups["shoulders"]["thisWeekSets"] == 1.5  # secondary counts half
    assert groups["calves"]["thisWeekSets"] == 0


def test_muscle_volume_rejects_too_many_weeks(client, auth_headers):
    assert (
        client.get("/api/stats/muscle-volume?weeks=100", headers=auth_headers).status_code
        == 422
    )


# ---------- recovery


def test_recovery_marks_trained_groups_and_decays_over_time(client, auth_headers, db):
    _log(client, auth_headers, [set_payload(setIndex=i) for i in (1, 2, 3)])

    groups = _by_group(client.get("/api/stats/recovery", headers=auth_headers).json())
    assert groups["triceps"]["status"] in ("recovering", "fatigued")
    assert groups["triceps"]["fatigue"] > 0.25
    assert groups["calves"] == {
        "group": "calves",
        "fatigue": 0.0,
        "status": "fresh",
        "hoursSinceTrained": None,
    }

    user_id = db.execute(select(User.id)).scalar_one()
    later = analytics_service.get_recovery(
        db, user_id, now=datetime.utcnow() + timedelta(days=5)
    )
    assert _by_group(later)["triceps"]["fatigue"] < groups["triceps"]["fatigue"] / 2


# ---------- strength standards


def test_strength_standards_need_body_weight_for_a_level(client, auth_headers):
    _log(client, auth_headers, [set_payload(exerciseId=BENCH_ID, weight=100, reps=5)])

    without = client.get("/api/stats/strength-standards", headers=auth_headers).json()
    bench = _by_group(without["lifts"], "key")["bench"]
    assert without["bodyWeightKg"] is None
    assert bench["estimatedOneRepMax"] == 116.7
    assert bench["level"] is None

    client.put(
        "/api/body/weights",
        json={"measuredOn": date.today().isoformat(), "weightKg": 80},
        headers=auth_headers,
    )
    with_weight = client.get("/api/stats/strength-standards", headers=auth_headers).json()
    bench = _by_group(with_weight["lifts"], "key")["bench"]
    assert bench["ratio"] == 1.46
    assert bench["level"] == "advanced"
    assert bench["nextLevel"] == "elite"
    assert bench["kgToNext"] > 0


def test_strength_standards_ignore_warmups(client, auth_headers):
    _log(
        client,
        auth_headers,
        [set_payload(exerciseId=BENCH_ID, weight=200, reps=5, setType="warmup")],
    )
    data = client.get("/api/stats/strength-standards", headers=auth_headers).json()
    assert _by_group(data["lifts"], "key")["bench"]["estimatedOneRepMax"] is None


# ---------- consistency


def test_consistency_summarises_the_year(client, auth_headers):
    now = datetime.now().replace(microsecond=0)
    _log(client, auth_headers, [set_payload()], now)
    _log(client, auth_headers, [set_payload()], now - timedelta(minutes=5))

    data = client.get(
        f"/api/stats/consistency?year={now.year}", headers=auth_headers
    ).json()

    assert data["year"] == now.year
    assert data["totalWorkouts"] == 2
    assert data["activeDays"] == 1
    assert data["bestWeekCount"] == 2
    assert data["averagePerWeek"] == 2.0
    assert data["longestWeeklyStreak"] == 1
    assert sum(data["weekdayCounts"]) == 2
    assert data["bestMonth"] == now.month
    assert data["heatmap"] == [{"day": now.date().isoformat(), "count": 2}]


def test_consistency_for_an_empty_year(client, auth_headers):
    data = client.get("/api/stats/consistency?year=2010", headers=auth_headers).json()
    assert data["totalWorkouts"] == 0
    assert data["bestMonth"] is None
    assert data["heatmap"] == []


# ---------- comparisons


def test_compare_periods_returns_deltas_against_the_previous_range(
    client, auth_headers
):
    today = datetime.now().replace(microsecond=0)
    _log(client, auth_headers, [set_payload()], today)
    _log(client, auth_headers, [set_payload()], today - timedelta(minutes=1))
    _log(client, auth_headers, [set_payload()], today - timedelta(days=8))

    start = (today - timedelta(days=6)).date().isoformat()
    end = today.date().isoformat()
    data = client.get(
        f"/api/stats/compare/periods?start={start}&end={end}", headers=auth_headers
    ).json()

    assert data["current"]["workoutCount"] == 2
    assert data["previous"]["workoutCount"] == 1
    assert data["deltas"]["workoutCount"] == {"change": 1, "percent": 100.0}


def test_compare_periods_rejects_a_backwards_range(client, auth_headers):
    response = client.get(
        "/api/stats/compare/periods?start=2026-10-10&end=2026-10-01",
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_compare_exercises_returns_a_series_per_exercise(client, auth_headers):
    now = datetime.now().replace(microsecond=0)
    _log(
        client,
        auth_headers,
        [set_payload(weight=60, reps=10), set_payload(setIndex=2, weight=80, reps=3)],
        now - timedelta(days=2),
    )
    _log(client, auth_headers, [set_payload(weight=90, reps=5)], now)
    _log(client, auth_headers, [set_payload(exerciseId=BENCH_ID, weight=50, reps=5)], now)

    data = client.get(
        f"/api/stats/compare/exercises?ids={REPS_WEIGHT_EXERCISE_ID},{BENCH_ID}",
        headers=auth_headers,
    ).json()

    assert [s["exerciseId"] for s in data] == [REPS_WEIGHT_EXERCISE_ID, BENCH_ID]
    first = data[0]["sessions"]
    assert [s["topWeight"] for s in first] == [80, 90]
    assert first[0]["volume"] == 60 * 10 + 80 * 3
    assert first[0]["estimatedOneRepMax"] == 88.0  # 80 x 3 beats 60 x 10 (80.0)
    assert len(data[1]["sessions"]) == 1


def test_compare_exercises_validates_ids(client, auth_headers):
    assert (
        client.get("/api/stats/compare/exercises?ids=a,b", headers=auth_headers).status_code
        == 422
    )
    assert (
        client.get("/api/stats/compare/exercises?ids=", headers=auth_headers).status_code
        == 422
    )


# ---------- monthly trends


def test_trends_can_be_grouped_by_month(client, auth_headers):
    now = datetime.now().replace(microsecond=0)
    _log(client, auth_headers, [set_payload()], now)

    data = client.get("/api/stats?granularity=month", headers=auth_headers).json()
    trends = data["trends"]

    assert [t["weekStart"] for t in trends] == [now.date().replace(day=1).isoformat()]
    assert trends[0]["workoutCount"] == 1


def test_stats_reject_an_unknown_granularity(client, auth_headers):
    assert (
        client.get("/api/stats?granularity=day", headers=auth_headers).status_code == 422
    )


def test_analytics_endpoints_require_login(client):
    for path in ("muscle-volume", "recovery", "strength-standards", "consistency"):
        assert client.get(f"/api/stats/{path}").status_code == 401
