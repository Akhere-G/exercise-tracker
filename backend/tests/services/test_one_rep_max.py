import pytest

from app.services.analytics.common import MAX_REPS_FOR_ESTIMATE, estimate_one_rep_max


def test_a_single_rep_is_the_weight_plus_a_little():
    assert estimate_one_rep_max(100, 1) == pytest.approx(103.33, abs=0.01)


def test_high_rep_sets_do_not_inflate_the_estimate():
    capped = estimate_one_rep_max(50, MAX_REPS_FOR_ESTIMATE)

    assert estimate_one_rep_max(50, 100) == capped
    assert estimate_one_rep_max(50, 10_000) == capped


def test_more_reps_up_to_the_cap_still_raise_the_estimate():
    assert estimate_one_rep_max(100, 8) > estimate_one_rep_max(100, 5)
