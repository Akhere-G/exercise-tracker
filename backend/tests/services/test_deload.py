from app.services.deload import average_effort, stall_reason


def test_progressing_lift_is_not_stalled():
    assert stall_reason([100, 102, 104, 106]) is None


def test_flat_lift_is_stalled():
    assert stall_reason([100, 99, 100, 98]) == "stalled"


def test_a_five_percent_drop_is_a_decline():
    assert stall_reason([100, 98, 96, 94]) == "declined"


def test_needs_enough_sessions_to_judge():
    assert stall_reason([100, 90, 80]) is None


def test_only_the_latest_sessions_count():
    assert stall_reason([50, 60, 70, 80, 90]) is None


def test_average_effort_ignores_missing_data():
    assert average_effort([]) is None
    assert average_effort([8, 9, 10]) == 9
