from datetime import date, timedelta

import pytest
from app.services.workout import _current_streak, _week_start

THIS_WEEK = date(2026, 10, 19)  # a Monday


def _weeks(*counts: int, newest: date = THIS_WEEK) -> dict[date, int]:
    """Workouts per week, newest first, one entry per consecutive week."""
    return {newest - timedelta(weeks=i): n for i, n in enumerate(counts)}


@pytest.mark.parametrize(
    "day, monday",
    [
        (date(2026, 10, 19), date(2026, 10, 19)),
        (date(2026, 10, 21), date(2026, 10, 19)),
        (date(2026, 10, 25), date(2026, 10, 19)),
        (date(2026, 10, 26), date(2026, 10, 26)),
        (date(2026, 1, 1), date(2025, 12, 29)),
        (date(2024, 2, 29), date(2024, 2, 26)),
    ],
)
def test_week_start_is_the_monday_on_or_before_the_day(day, monday):
    assert _week_start(day) == monday


def test_no_workouts_is_no_streak():
    assert _current_streak({}, 1, THIS_WEEK) == 0


def test_consecutive_weeks_count():
    assert _current_streak(_weeks(2, 3, 1), 1, THIS_WEEK) == 3


def test_the_current_week_gets_grace_while_still_short_of_the_target():
    # Nothing yet this week, but the previous two weeks hit the target.
    assert _current_streak(_weeks(0, 2, 2), 2, THIS_WEEK) == 2
    assert _current_streak(_weeks(1, 2, 2), 2, THIS_WEEK) == 2


def test_a_completed_current_week_extends_the_streak():
    assert _current_streak(_weeks(2, 2, 2), 2, THIS_WEEK) == 3


def test_grace_applies_to_the_current_week_only():
    # Last week missed too, so the streak is already broken.
    assert _current_streak(_weeks(0, 0, 3, 3), 1, THIS_WEEK) == 0
    assert _current_streak(_weeks(0, 1, 0, 1), 1, THIS_WEEK) == 1


def test_a_gap_ends_the_streak():
    counts = {THIS_WEEK: 1, THIS_WEEK - timedelta(weeks=2): 1}

    assert _current_streak(counts, 1, THIS_WEEK) == 1


def test_an_old_run_does_not_count_after_a_gap():
    counts = _weeks(1, 1, 0, 1, 1, 1)

    assert _current_streak(counts, 1, THIS_WEEK) == 2


@pytest.mark.parametrize("frequency", [1, 2, 3, 4, 5])
def test_each_frequency_needs_that_many_workouts_per_week(frequency):
    meets = _weeks(*[frequency] * 3)
    falls_short = _weeks(*[frequency - 1] * 3)

    assert _current_streak(meets, frequency, THIS_WEEK) == 3
    assert _current_streak(falls_short, frequency, THIS_WEEK) == 0


def test_a_week_above_the_target_still_counts():
    assert _current_streak(_weeks(5, 4, 3), 3, THIS_WEEK) == 3


def test_a_week_below_the_target_in_the_middle_breaks_the_run():
    assert _current_streak(_weeks(3, 2, 3, 3), 3, THIS_WEEK) == 1


def test_streak_spans_a_year_boundary():
    counts = _weeks(1, 1, 1, newest=date(2026, 1, 5))

    assert _current_streak(counts, 1, date(2026, 1, 5)) == 3
