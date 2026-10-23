from datetime import date

import pytest
from app.models import Achievement, UserAchievement
from app.services.achievement import PR_RULES
from sqlalchemy import func, select
from tests.helpers import (
    REPS_WEIGHT_EXERCISE_ID,
    exercise_id_for,
    set_payload,
    workout_payload,
)

TODAY = date(2026, 10, 21)  # a Wednesday; its week starts on Monday the 19th


def _post(client, headers, completed_at="2026-10-20T12:00:00", **overrides):
    response = client.post(
        "/api/workouts",
        json=workout_payload(completedAt=completed_at, **overrides),
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _earned(client, headers, **path):
    """{achievement type: value} for a workout's own achievements."""
    url = "/api/achievements/user" if not path else f"/api/achievements/workout/{path['workout']}"
    return {a["achievement"]["type"]: a["value"] for a in client.get(url, headers=headers).json()}


def _pr_rows(db) -> int:
    stmt = (
        select(func.count())
        .select_from(UserAchievement)
        .join(Achievement)
        .where(Achievement.type.like("pr\\_%", escape="\\"))
    )
    return db.execute(stmt).scalar_one()


def _prs(client, headers, exercise_id):
    rows = client.get(f"/api/achievements/exercise/{exercise_id}", headers=headers).json()
    return {r["achievement"]["type"]: r["value"] for r in rows}


def test_a_first_workout_sets_a_weight_pr(client, auth_headers, freeze):
    freeze(TODAY)

    workout = _post(client, auth_headers, sets=[set_payload(weight=20), set_payload(setIndex=2, weight=30)])

    assert _earned(client, auth_headers, workout=workout["id"])["pr_weight"] == 30
    assert _prs(client, auth_headers, REPS_WEIGHT_EXERCISE_ID) == {"pr_weight": 30}


def test_only_a_heavier_lift_awards_a_new_weight_pr(client, db, auth_headers, freeze):
    freeze(TODAY)
    _post(client, auth_headers, sets=[set_payload(weight=30)])
    rows = _pr_rows(db)

    same = _post(client, auth_headers, completed_at="2026-10-20T13:00:00", sets=[set_payload(weight=30)])
    lighter = _post(client, auth_headers, completed_at="2026-10-20T14:00:00", sets=[set_payload(weight=10)])

    assert "pr_weight" not in _earned(client, auth_headers, workout=same["id"])
    assert "pr_weight" not in _earned(client, auth_headers, workout=lighter["id"])
    assert _pr_rows(db) == rows

    heavier = _post(client, auth_headers, completed_at="2026-10-20T15:00:00", sets=[set_payload(weight=35)])

    assert _earned(client, auth_headers, workout=heavier["id"])["pr_weight"] == 35
    assert _prs(client, auth_headers, REPS_WEIGHT_EXERCISE_ID)["pr_weight"] == 35


@pytest.mark.parametrize("metrics", sorted(PR_RULES))
def test_each_metric_type_awards_its_own_prs(client, db, auth_headers, freeze, metrics):
    freeze(TODAY)
    exercise_id = exercise_id_for(db, metrics)
    first_sets = {
        "reps+weight": [{"reps": 5, "weight": 40}],
        "reps": [{"reps": 12}],
        "duration": [{"durationSecs": 60}],
        "duration+distance": [{"durationSecs": 1800, "distanceMeters": 5000}],
    }[metrics]
    better_sets = {
        "reps+weight": [{"reps": 3, "weight": 45}],
        "reps": [{"reps": 15}],
        "duration": [{"durationSecs": 90}],
        "duration+distance": [{"durationSecs": 1500, "distanceMeters": 6000}],
    }[metrics]
    expected_types = {pr_type for pr_type, _ in PR_RULES[metrics]}

    def sets(values):
        return [
            {"exerciseId": exercise_id, "setIndex": i + 1, **v} for i, v in enumerate(values)
        ]

    first = _post(client, auth_headers, sets=sets(first_sets))
    second = _post(client, auth_headers, completed_at="2026-10-20T13:00:00", sets=sets(better_sets))

    first_earned = _earned(client, auth_headers, workout=first["id"])
    second_earned = _earned(client, auth_headers, workout=second["id"])
    assert expected_types <= set(first_earned)
    assert {t for t in second_earned if t.startswith("pr_")} <= expected_types
    assert set(_prs(client, auth_headers, exercise_id)) == expected_types


def test_distance_and_duration_prs_improve_independently(client, db, auth_headers, freeze):
    freeze(TODAY)
    run = exercise_id_for(db, "duration+distance")

    def run_set(duration, distance):
        return [{"exerciseId": run, "setIndex": 1, "durationSecs": duration, "distanceMeters": distance}]

    _post(client, auth_headers, sets=run_set(1800, 5000))
    faster_but_shorter = _post(
        client, auth_headers, completed_at="2026-10-20T13:00:00", sets=run_set(1200, 8000)
    )

    earned = _earned(client, auth_headers, workout=faster_but_shorter["id"])
    assert earned["pr_distance"] == 8000
    assert "pr_duration" not in earned
    assert _prs(client, auth_headers, run) == {"pr_distance": 8000, "pr_duration": 1800}


def test_a_workout_with_several_exercises_awards_a_pr_for_each(client, db, auth_headers, freeze):
    freeze(TODAY)
    squat, plank = REPS_WEIGHT_EXERCISE_ID, exercise_id_for(db, "duration")

    workout = _post(
        client,
        auth_headers,
        sets=[
            set_payload(exerciseId=squat, weight=60),
            {"exerciseId": plank, "setIndex": 1, "durationSecs": 45},
        ],
    )

    assert _prs(client, auth_headers, squat) == {"pr_weight": 60}
    assert _prs(client, auth_headers, plank) == {"pr_duration": 45}
    assert {"pr_weight", "pr_duration"} <= set(_earned(client, auth_headers, workout=workout["id"]))


def test_prs_belong_to_the_exercise_not_the_workout_history_of_others(
    client, auth_headers, freeze
):
    from tests.helpers import register

    freeze(TODAY)
    _post(client, auth_headers, sets=[set_payload(weight=100)])
    other = register(client)

    workout = _post(client, other, sets=[set_payload(weight=20)])

    assert _earned(client, other, workout=workout["id"])["pr_weight"] == 20


def test_consecutive_weeks_build_the_weekly_streak(client, auth_headers, freeze):
    freeze(TODAY)
    for completed_at in ("2026-10-06T12:00:00", "2026-10-13T12:00:00", "2026-10-20T12:00:00"):
        last = _post(client, auth_headers, completed_at=completed_at)

    assert _earned(client, auth_headers)["freq_streak_1"] == 3
    assert "freq_streak_1" in _earned(client, auth_headers, workout=last["id"])
    assert client.get("/api/workouts/stats", headers=auth_headers).json() == {
        "workoutCount": 3,
        "weeklyStreak": 3,
    }


def test_higher_frequency_streaks_need_more_workouts_each_week(client, auth_headers, freeze):
    freeze(TODAY)
    for completed_at in (
        "2026-10-13T12:00:00",
        "2026-10-14T12:00:00",
        "2026-10-20T12:00:00",
        "2026-10-21T08:00:00",
        "2026-10-21T18:00:00",
    ):
        _post(client, auth_headers, completed_at=completed_at)

    earned = _earned(client, auth_headers)
    assert earned["freq_streak_1"] == 2
    assert earned["freq_streak_2"] == 2
    assert earned["freq_streak_3"] == 1
    assert "freq_streak_4" not in earned


def test_a_missed_week_resets_the_streak_but_keeps_the_best(client, auth_headers, freeze):
    freeze(TODAY)
    for completed_at in ("2026-10-06T12:00:00", "2026-10-13T12:00:00"):
        _post(client, auth_headers, completed_at=completed_at)
    assert _earned(client, auth_headers)["freq_streak_1"] == 2

    freeze(date(2026, 10, 28))  # two weeks on, with nothing logged in between
    assert client.get("/api/workouts/stats", headers=auth_headers).json()["weeklyStreak"] == 0

    new = _post(client, auth_headers, completed_at="2026-10-27T12:00:00")

    assert client.get("/api/workouts/stats", headers=auth_headers).json()["weeklyStreak"] == 1
    assert "freq_streak_1" not in _earned(client, auth_headers, workout=new["id"])
    assert _earned(client, auth_headers)["freq_streak_1"] == 2


def test_an_unchanged_streak_does_not_create_a_new_record(client, db, auth_headers, freeze):
    freeze(TODAY)
    for completed_at in ("2026-10-06T12:00:00", "2026-10-13T12:00:00", "2026-10-20T12:00:00"):
        _post(client, auth_headers, completed_at=completed_at)

    def streak_values():
        stmt = (
            select(UserAchievement.value)
            .join(Achievement)
            .where(Achievement.type == "freq_streak_1")
            .order_by(UserAchievement.id)
        )
        return db.execute(stmt).scalars().all()

    assert streak_values() == [2, 3]

    _post(client, auth_headers, completed_at="2026-10-14T12:00:00", sets=[set_payload(weight=1)])

    assert streak_values() == [2, 3]


def test_the_current_week_is_graced_until_the_target_is_met(client, auth_headers, freeze):
    freeze(date(2026, 10, 19))  # Monday, nothing logged yet this week
    for completed_at in ("2026-10-06T12:00:00", "2026-10-13T12:00:00"):
        _post(client, auth_headers, completed_at=completed_at)

    assert client.get("/api/workouts/stats", headers=auth_headers).json()["weeklyStreak"] == 2


def test_achievement_rows_reference_the_workout_that_earned_them(
    client, db, auth_headers, freeze
):
    freeze(TODAY)
    workout = _post(client, auth_headers)

    workout_ids = set(db.execute(select(UserAchievement.workout_id)).scalars())

    assert workout_ids == {workout["id"]}
