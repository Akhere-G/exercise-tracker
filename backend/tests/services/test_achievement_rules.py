from datetime import datetime
from types import SimpleNamespace

import pytest
from app.models import UserAchievement
from app.services.achievement import (
    PR_RULES,
    PR_TYPES,
    _best_value,
    _record_if_better,
)

NOW = datetime(2026, 10, 21, 12, 0)


def _set(**values):
    blank = {"reps": None, "weight": None, "duration_secs": None, "distance_meters": None}
    return SimpleNamespace(**{**blank, **values})


def _record(existing, value):
    return _record_if_better(
        existing,
        value=value,
        now=NOW,
        user_id=1,
        achievement_id=2,
        workout_id=3,
        exercise_id=4,
    )


def _stored(value):
    return UserAchievement(user_id=1, achievement_id=2, value=value)


def test_pr_rules_cover_every_metric_with_the_expected_achievements():
    assert PR_RULES == {
        "reps+weight": [("pr_weight", "weight")],
        "reps": [("pr_reps", "reps")],
        "duration": [("pr_duration", "duration_secs")],
        "duration+distance": [
            ("pr_distance", "distance_meters"),
            ("pr_duration", "duration_secs"),
        ],
    }


def test_every_pr_rule_names_a_known_achievement_type():
    awarded = {pr_type for rules in PR_RULES.values() for pr_type, _ in rules}

    assert awarded == set(PR_TYPES)


@pytest.mark.parametrize(
    "field, sets, best",
    [
        ("weight", [_set(weight=40), _set(weight=60), _set(weight=50)], 60),
        ("reps", [_set(reps=8), _set(reps=12), _set(reps=10)], 12),
        ("duration_secs", [_set(duration_secs=30), _set(duration_secs=90)], 90),
        ("distance_meters", [_set(distance_meters=1500.5), _set(distance_meters=900)], 1500.5),
    ],
)
def test_best_value_is_the_highest_across_sets(field, sets, best):
    assert _best_value(sets, field) == best


@pytest.mark.parametrize("sets", [[], [_set()], [_set(weight=0)], [_set(weight=None)]])
def test_best_value_is_none_when_nothing_was_recorded(sets):
    assert _best_value(sets, "weight") is None


def test_best_value_ignores_sets_missing_the_field():
    sets = [_set(reps=5), _set(reps=5, weight=25)]

    assert _best_value(sets, "weight") == 25


def test_first_award_creates_a_row():
    row = _record(None, 50)

    assert (row.user_id, row.achievement_id, row.exercise_id) == (1, 2, 4)
    assert (row.value, row.workout_id, row.unlocked_at) == (50, 3, NOW)


def test_a_new_record_creates_a_row():
    assert _record(_stored(50), 55).value == 55


@pytest.mark.parametrize("value", [50, 49, 1])
def test_equalling_or_missing_the_record_creates_nothing(value):
    assert _record(_stored(50), value) is None


def test_distance_and_duration_prs_are_independent_rules():
    run = [_set(duration_secs=1800, distance_meters=5000), _set(duration_secs=900, distance_meters=7000)]
    (distance_type, distance_field), (duration_type, duration_field) = PR_RULES["duration+distance"]

    assert (distance_type, _best_value(run, distance_field)) == ("pr_distance", 7000)
    assert (duration_type, _best_value(run, duration_field)) == ("pr_duration", 1800)
