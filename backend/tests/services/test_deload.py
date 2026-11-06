from datetime import datetime, timedelta

from app.models import Workout, WorkoutSet
from app.services import deload
from app.services.deload import find_stall_reason
from tests.helpers import REPS_WEIGHT_EXERCISE_ID

SECOND_EXERCISE_ID = REPS_WEIGHT_EXERCISE_ID + 1
NOW = datetime(2026, 11, 6, 12, 0)


def log_session(db, user_id, days_ago, exercises, rpe=None):
    """Log one workout; `exercises` maps exercise id to the weight lifted for 5."""
    workout = Workout(
        user_id=user_id,
        completed_at=NOW - timedelta(days=days_ago),
        duration=3600,
    )
    db.add(workout)
    db.flush()
    for set_index, (exercise_id, weight) in enumerate(exercises.items(), start=1):
        db.add(
            WorkoutSet(
                workout_id=workout.id,
                exercise_id=exercise_id,
                set_index=set_index,
                reps=5,
                weight=weight,
                rpe=rpe,
            ),
        )
    db.commit()


def log_flat_history(db, user_id, exercise_ids):
    for days_ago in (21, 14, 7, 1):
        log_session(db, user_id, days_ago, dict.fromkeys(exercise_ids, 50))


class TestFindStallReason:
    def test_progressing_lift_is_not_stalled(self):
        assert find_stall_reason([100, 102, 104, 106]) is None

    def test_flat_lift_is_stalled(self):
        assert find_stall_reason([100, 99, 100, 98]) == "stalled"

    def test_a_five_percent_drop_is_a_decline(self):
        assert find_stall_reason([100, 98, 96, 94]) == "declined"

    def test_needs_enough_sessions_to_judge(self):
        assert find_stall_reason([100, 90, 80]) is None

    def test_only_the_latest_sessions_count(self):
        assert find_stall_reason([50, 60, 70, 80, 90]) is None


class TestStrengthProgression:
    def test_two_flat_lifts_are_reported_as_stalled(self, db, user):
        log_flat_history(db, user.id, [REPS_WEIGHT_EXERCISE_ID, SECOND_EXERCISE_ID])

        sets = deload.fetch_working_sets(db, user.id, NOW - timedelta(weeks=8))
        strength = deload.assess_strength_progression(sets)

        assert strength.tracked_lift_count == 2
        assert len(strength.stalled_lifts) == 2

    def test_a_single_lift_is_too_little_data_to_judge(self, db, user):
        log_flat_history(db, user.id, [REPS_WEIGHT_EXERCISE_ID])

        sets = deload.fetch_working_sets(db, user.id, NOW - timedelta(weeks=8))

        assert deload.assess_strength_progression(sets) is None

    def test_sessions_crammed_into_a_few_days_are_not_judged(self, db, user):
        for days_ago in (4, 3, 2, 1):
            log_session(
                db,
                user.id,
                days_ago,
                {REPS_WEIGHT_EXERCISE_ID: 50, SECOND_EXERCISE_ID: 50},
            )

        sets = deload.fetch_working_sets(db, user.id, NOW - timedelta(weeks=8))

        assert deload.assess_strength_progression(sets) is None

    def test_best_set_in_a_workout_is_the_session_value(self, db, user):
        log_session(db, user.id, 1, {REPS_WEIGHT_EXERCISE_ID: 50})
        workout = db.query(Workout).one()
        db.add(
            WorkoutSet(
                workout_id=workout.id,
                exercise_id=REPS_WEIGHT_EXERCISE_ID,
                set_index=2,
                reps=5,
                weight=60,
            ),
        )
        db.commit()

        sets = deload.fetch_working_sets(db, user.id, NOW - timedelta(weeks=8))
        sessions = deload.group_lift_sessions(sets)[REPS_WEIGHT_EXERCISE_ID]

        assert len(sessions) == 1
        assert sessions[0].estimated_one_rep_max == 60 * (1 + 5 / 30)


class TestTrainingFatigue:
    def test_averages_effort_per_workout(self, db, user):
        for days_ago in (6, 3, 1):
            log_session(db, user.id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50}, rpe=9.5)

        sets = deload.fetch_working_sets(db, user.id, NOW - timedelta(weeks=8))
        fatigue = deload.assess_training_fatigue(sets, NOW)

        assert fatigue.average_rpe == 9.5
        assert fatigue.workouts_counted == 3

    def test_two_workouts_are_too_little_data_to_judge(self, db, user):
        for days_ago in (3, 1):
            log_session(db, user.id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50}, rpe=10)

        sets = deload.fetch_working_sets(db, user.id, NOW - timedelta(weeks=8))

        assert deload.assess_training_fatigue(sets, NOW) is None

    def test_old_workouts_are_outside_the_effort_window(self, db, user):
        for days_ago in (30, 28, 26):
            log_session(db, user.id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50}, rpe=10)

        sets = deload.fetch_working_sets(db, user.id, NOW - timedelta(weeks=8))

        assert deload.assess_training_fatigue(sets, NOW) is None


class TestAssessDeload:
    def test_explains_which_lifts_triggered_it(self, db, user):
        log_flat_history(db, user.id, [REPS_WEIGHT_EXERCISE_ID, SECOND_EXERCISE_ID])

        result = deload.assess_deload(db, user.id, now=NOW)

        assert result["should_deload"] is True
        assert result["reasons"][0] == "2 of 2 tracked lifts have stalled or declined."
        assert len(result["reasons"]) == 3
        assert (
            "estimated 1RM made no progress over your last 4 sessions"
            in (result["reasons"][1])
        )
        assert {e["reason"] for e in result["stalled_exercises"]} == {"stalled"}

    def test_explains_the_effort_that_triggered_it(self, db, user):
        for days_ago in (6, 3, 1):
            log_session(db, user.id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50}, rpe=9.5)

        result = deload.assess_deload(db, user.id, now=NOW)

        assert result["should_deload"] is True
        assert result["reasons"] == [
            "Your average effort is RPE 9.5 across your last 3 workouts "
            "(a deload is suggested from RPE 9.0).",
        ]
        assert result["stalled_exercises"] == []

    def test_is_not_repeated_during_the_cooldown(self, db, user):
        log_flat_history(db, user.id, [REPS_WEIGHT_EXERCISE_ID, SECOND_EXERCISE_ID])

        first = deload.assess_deload(db, user.id, now=NOW)
        soon_after = deload.assess_deload(db, user.id, now=NOW + timedelta(days=3))

        assert first["should_deload"] is True
        assert soon_after == {"should_deload": False}

    def test_is_recommended_again_once_the_cooldown_has_passed(self, db, user):
        log_flat_history(db, user.id, [REPS_WEIGHT_EXERCISE_ID, SECOND_EXERCISE_ID])
        deload.assess_deload(db, user.id, now=NOW)

        later = NOW + timedelta(days=deload.COOLDOWN_DAYS)
        # Keep training through the cooldown so the lifter still counts as active.
        one_day_before_later = -(deload.COOLDOWN_DAYS - 1)
        log_session(
            db,
            user.id,
            one_day_before_later,
            {REPS_WEIGHT_EXERCISE_ID: 50, SECOND_EXERCISE_ID: 50},
        )

        assert deload.assess_deload(db, user.id, now=later)["should_deload"] is True

    def test_no_recommendation_for_someone_who_stopped_training(self, db, user):
        log_flat_history(db, user.id, [REPS_WEIGHT_EXERCISE_ID, SECOND_EXERCISE_ID])

        result = deload.assess_deload(db, user.id, now=NOW + timedelta(days=30))

        assert result == {"should_deload": False}
