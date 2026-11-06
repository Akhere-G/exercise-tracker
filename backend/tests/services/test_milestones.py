from datetime import datetime

import pytest
from app.schemas.profile import ProfileUpdate
from app.schemas.workout import WorkoutCreate, WorkoutSetCreate
from app.services import achievement as achievement_service
from app.services import profile as profile_service
from app.services import workout as workout_service
from tests.helpers import REPS_WEIGHT_EXERCISE_ID


def log(db, user, completed_at, duration=3600, exercise_ids=(REPS_WEIGHT_EXERCISE_ID,)):
    sets = [
        WorkoutSetCreate(exercise_id=e, set_index=1, reps=5, weight=20)
        for e in exercise_ids
    ]
    return workout_service.create_workout(
        db,
        user.id,
        WorkoutCreate(completed_at=completed_at, duration=duration, sets=sets),
    )


def milestones_for(db, user, workout) -> set[str]:
    rows = achievement_service.get_achievements_for_workout(db, user.id, workout.id)
    return {row.achievement.type for row in rows}


def test_first_workout_is_awarded_once(db, user):
    first = log(db, user, datetime(2026, 10, 20, 12, 0))
    second = log(db, user, datetime(2026, 10, 27, 12, 0))

    assert "first_workout" in milestones_for(db, user, first)
    assert "first_workout" not in milestones_for(db, user, second)


@pytest.mark.parametrize(
    "timezone, expected",
    [(None, "night_owl"), ("Asia/Tokyo", "early_bird")],
)
def test_time_of_day_uses_the_users_timezone(db, user, timezone, expected):
    profile_service.update_profile(db, user.id, ProfileUpdate(timezone=timezone))
    # Started 21:30 UTC, which is 06:30 the next morning in Tokyo.
    workout = log(db, user, datetime(2026, 10, 20, 22, 30), duration=3600)

    assert expected in milestones_for(db, user, workout)


def test_back_to_back_needs_consecutive_days(db, user):
    log(db, user, datetime(2026, 10, 19, 12, 0))
    gap = log(db, user, datetime(2026, 10, 22, 12, 0))
    consecutive = log(db, user, datetime(2026, 10, 23, 12, 0))

    assert "back_to_back" not in milestones_for(db, user, gap)
    assert "back_to_back" in milestones_for(db, user, consecutive)


def test_weekend_warrior_needs_both_weekend_days(db, user):
    log(db, user, datetime(2026, 10, 24, 12, 0))  # Saturday
    sunday = log(db, user, datetime(2026, 10, 25, 12, 0))

    assert "weekend_warrior" in milestones_for(db, user, sunday)


def test_long_and_heavy_sessions_are_recognised(db, user):
    workout = log(db, user, datetime(2026, 10, 20, 12, 0), duration=95 * 60)

    assert "marathon_session" in milestones_for(db, user, workout)
    assert "ton_up" not in milestones_for(db, user, workout)


def test_variety_counts_distinct_exercises(db, user):
    ids = range(REPS_WEIGHT_EXERCISE_ID, REPS_WEIGHT_EXERCISE_ID + 5)
    workout = log(db, user, datetime(2026, 10, 20, 12, 0), exercise_ids=ids)

    assert "variety_5" in milestones_for(db, user, workout)
    assert "variety_10" not in milestones_for(db, user, workout)


def test_backfill_awards_milestones_as_of_each_workout(db, user):
    first = log(db, user, datetime(2026, 10, 19, 12, 0))
    log(db, user, datetime(2026, 10, 20, 12, 0))

    achievement_service.backfill_user_achievements(db, user.id)

    assert "first_workout" in milestones_for(db, user, first)
