from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from app.models import Achievement
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


def _log_days(db, user, start, count, **kwargs):

    return [log(db, user, start + timedelta(days=i), **kwargs) for i in range(count)]


@pytest.mark.parametrize("count", [5, 10, 25])
def test_workout_count_ladder(db, user, count):

    start = datetime(2026, 1, 1, 12, 0)
    workouts = [log(db, user, start + timedelta(days=3 * i)) for i in range(count)]

    assert f"workouts_{count}" in milestones_for(db, user, workouts[-1])
    assert f"workouts_{count}" not in milestones_for(db, user, workouts[-2])


@pytest.mark.parametrize(
    "hour, expected, absent",
    [
        (5, "early_riser", None),
        (6, "early_bird", "early_riser"),
        (12, "lunch_break_lifter", None),
        (14, None, "lunch_break_lifter"),
        (23, "midnight_oil", None),
        (22, "night_owl", "midnight_oil"),
    ],
)
def test_time_of_day_milestones(db, user, hour, expected, absent):

    # Start at `hour`; completed an hour later.
    workout = log(db, user, datetime(2026, 10, 20, hour, 0) + timedelta(hours=1))
    earned = milestones_for(db, user, workout)

    if expected:
        assert expected in earned
    if absent:
        assert absent not in earned


def test_speed_demon_needs_enough_sets(db, user):
    ids = range(REPS_WEIGHT_EXERCISE_ID, REPS_WEIGHT_EXERCISE_ID + 5)
    quick_save = log(db, user, datetime(2026, 10, 20, 12, 0), duration=600)
    quick_session = log(
        db, user, datetime(2026, 10, 21, 12, 0), duration=15 * 60, exercise_ids=ids
    )

    assert "speed_demon" not in milestones_for(db, user, quick_save)
    assert "speed_demon" in milestones_for(db, user, quick_session)


def _volume_workout(db, user, weight, reps=10, sets=1, day=20):
    payload = [
        WorkoutSetCreate(
            exercise_id=REPS_WEIGHT_EXERCISE_ID,
            set_index=i + 1,
            reps=reps,
            weight=weight,
        )
        for i in range(sets)
    ]
    return workout_service.create_workout(
        db,
        user.id,
        WorkoutCreate(
            completed_at=datetime(2026, 10, day, 12, 0), duration=3600, sets=payload
        ),
    )


def test_volume_ladder(db, user):
    light = _volume_workout(db, user, 100, sets=5, day=20)  # 5,000 kg
    heavy = _volume_workout(db, user, 100, sets=20, day=21)  # 20,000 kg

    assert "heavy_hitter" in milestones_for(db, user, light)
    assert "ton_up" not in milestones_for(db, user, light)
    assert {"ton_up", "volume_monster"} <= milestones_for(db, user, heavy)


def test_three_and_five_day_runs(db, user):
    days = _log_days(db, user, datetime(2026, 10, 19, 12, 0), 5)

    assert "three_peat" in milestones_for(db, user, days[2])
    assert "five_day_fire" not in milestones_for(db, user, days[3])
    assert "five_day_fire" in milestones_for(db, user, days[4])


def test_weekly_warrior_counts_one_week(db, user):
    # 19 Oct 2026 is a Monday.
    days = _log_days(db, user, datetime(2026, 10, 19, 12, 0), 5)

    assert "weekly_warrior" in milestones_for(db, user, days[4])
    assert "weekly_warrior" not in milestones_for(db, user, days[3])


def test_weekly_warrior_does_not_span_weeks(db, user):
    days = _log_days(db, user, datetime(2026, 10, 22, 12, 0), 5)  # Thu to Mon

    assert "weekly_warrior" not in milestones_for(db, user, days[4])


def test_monthly_regular(db, user):
    workouts = _log_days(db, user, datetime(2026, 10, 1, 12, 0), 15)

    assert "monthly_regular" in milestones_for(db, user, workouts[14])
    assert "monthly_regular" not in milestones_for(db, user, workouts[13])


def test_consecutive_weeks(db, user):

    start = datetime(2026, 8, 3, 12, 0)  # a Monday
    weeks = [log(db, user, start + timedelta(weeks=i)) for i in range(8)]

    assert "four_week_focus" not in milestones_for(db, user, weeks[2])
    assert "four_week_focus" in milestones_for(db, user, weeks[3])
    assert "two_month_club" not in milestones_for(db, user, weeks[6])
    assert "two_month_club" in milestones_for(db, user, weeks[7])


def test_a_missed_week_resets_the_run(db, user):

    start = datetime(2026, 8, 3, 12, 0)
    for i in (0, 1, 2):
        log(db, user, start + timedelta(weeks=i))
    after_gap = log(db, user, start + timedelta(weeks=4))

    assert "four_week_focus" not in milestones_for(db, user, after_gap)


def _pr_workout(db, user, completed_at, exercise_ids, weight):
    payload = [
        WorkoutSetCreate(exercise_id=e, set_index=1, reps=5, weight=weight)
        for e in exercise_ids
    ]
    return workout_service.create_workout(
        db,
        user.id,
        WorkoutCreate(completed_at=completed_at, duration=3600, sets=payload),
    )


def test_triple_threat_needs_three_beaten_records(db, user):
    ids = list(range(REPS_WEIGHT_EXERCISE_ID, REPS_WEIGHT_EXERCISE_ID + 3))
    first = _pr_workout(db, user, datetime(2026, 10, 20, 12, 0), ids, 20)
    second = _pr_workout(db, user, datetime(2026, 10, 27, 12, 0), ids, 30)

    assert "triple_threat" not in milestones_for(db, user, first)
    assert "triple_threat" in milestones_for(db, user, second)


def test_record_breaker_counts_beaten_records(db, user):

    start = datetime(2026, 1, 1, 12, 0)
    workouts = [
        _pr_workout(
            db, user, start + timedelta(days=7 * i), [REPS_WEIGHT_EXERCISE_ID], 20 + i
        )
        for i in range(11)
    ]

    assert "record_breaker" not in milestones_for(db, user, workouts[9])
    assert "record_breaker" in milestones_for(db, user, workouts[10])


def test_new_year(db, user):
    workout = log(db, user, datetime(2027, 1, 1, 12, 0))

    assert "new_year_new_gains" in milestones_for(db, user, workout)


def test_first_anniversary_needs_a_year(db, user):
    log(db, user, datetime(2025, 10, 20, 12, 0))
    early = log(db, user, datetime(2026, 10, 19, 12, 0))
    later = log(db, user, datetime(2026, 10, 20, 12, 0))

    assert "first_anniversary" not in milestones_for(db, user, early)
    assert "first_anniversary" in milestones_for(db, user, later)


def test_seed_syncs_renamed_milestones(db):
    row = db.execute(
        select(Achievement).where(Achievement.type == "variety_5")
    ).scalar_one()
    row.name, row.icon = "Variety 5", "shapes"
    db.commit()

    achievement_service.seed_achievements(db)
    db.refresh(row)

    assert (row.name, row.icon) == ("Explorer", "compass")


def test_user_achievements_sort_milestones_then_streaks_then_prs(db, user):
    log(db, user, datetime.now())  # streaks only count the current week

    rows = achievement_service.get_user_achievements(db, user.id)
    priorities = [row.achievement.priority for row in rows]

    assert {"first_workout", "freq_streak_1", "pr_weight"} <= {
        row.achievement.type for row in rows
    }
    assert priorities == sorted(priorities)
    assert priorities[0] == 0  # a milestone
    assert priorities[-1] == 2  # a personal record
    assert 1 in priorities
