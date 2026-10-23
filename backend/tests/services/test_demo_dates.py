from datetime import date, datetime

import pytest
from app.services.demo import resolve_completed_at

WEDNESDAY = date(2026, 10, 21)


@pytest.mark.parametrize(
    "workout, expected",
    [
        ({"weekOffset": 0, "weekday": 0, "completedTime": "11:00"}, datetime(2026, 10, 19, 11, 0)),
        ({"weekOffset": 0, "weekday": 6, "completedTime": "13:30"}, datetime(2026, 10, 25, 13, 30)),
        ({"weekOffset": -1, "weekday": 2, "completedTime": "12:15"}, datetime(2026, 10, 14, 12, 15)),
        ({"weekOffset": -5, "weekday": 0, "completedTime": "11:00"}, datetime(2026, 9, 14, 11, 0)),
        ({"weekOffset": 1, "weekday": 3, "completedTime": "14:00"}, datetime(2026, 10, 29, 14, 0)),
    ],
)
def test_completed_at_is_relative_to_the_monday_of_the_current_week(workout, expected):
    assert resolve_completed_at(workout, WEDNESDAY) == expected


@pytest.mark.parametrize("today", [date(2026, 10, 19), date(2026, 10, 25)])
def test_every_day_of_a_week_resolves_the_same_way(today):
    workout = {"weekOffset": 0, "weekday": 1, "completedTime": "12:00"}

    assert resolve_completed_at(workout, today) == datetime(2026, 10, 20, 12, 0)
