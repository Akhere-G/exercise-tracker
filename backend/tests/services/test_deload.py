from datetime import datetime, timedelta

from app.models import Workout, WorkoutSet
from app.services import deload
from tests.helpers import REPS_WEIGHT_EXERCISE_ID

SECOND_EXERCISE_ID = REPS_WEIGHT_EXERCISE_ID + 1
NOW = datetime(2026, 11, 6, 12, 0)


def log_workout(db, user_id, days_ago, weight_by_exercise, rpe=None):
    workout = Workout(
        user_id=user_id,
        completed_at=NOW - timedelta(days=days_ago),
        duration=3600,
    )
    db.add(workout)
    db.flush()
    for set_index, (exercise_id, weight) in enumerate(weight_by_exercise.items(), 1):
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


def log_flat_history(db, user_id):
    for days_ago in (21, 14, 7, 1):
        log_workout(
            db,
            user_id,
            days_ago,
            {REPS_WEIGHT_EXERCISE_ID: 50, SECOND_EXERCISE_ID: 50},
        )


def log_hard_workouts(db, user_id, count):
    for days_ago in range(1, count + 1):
        log_workout(db, user_id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50}, rpe=9.5)


def fetch_recent_sets(db, user_id):
    return deload.fetch_working_sets(db, user_id, NOW - timedelta(weeks=8))


class TestFindStallReason:
    def test_progressing_lift_is_not_stalled(self):
        assert deload.find_stall_reason([100, 102, 104, 106]) is None

    def test_flat_lift_is_stalled(self):
        assert deload.find_stall_reason([100, 99, 100, 98]) == "stalled"

    def test_a_five_percent_drop_is_a_decline(self):
        assert deload.find_stall_reason([100, 98, 96, 94]) == "declined"

    def test_needs_enough_sessions_to_judge(self):
        assert deload.find_stall_reason([100, 90, 80]) is None

    def test_only_the_latest_sessions_count(self):
        assert deload.find_stall_reason([50, 60, 70, 80, 90]) is None


class TestCollectSessionOneRepMaxes:
    def test_keeps_the_best_set_of_each_workout(self, db, user):
        log_workout(db, user.id, 2, {REPS_WEIGHT_EXERCISE_ID: 50})
        log_workout(db, user.id, 1, {REPS_WEIGHT_EXERCISE_ID: 60})
        first_workout = db.query(Workout).order_by(Workout.completed_at).first()
        db.add(
            WorkoutSet(
                workout_id=first_workout.id,
                exercise_id=REPS_WEIGHT_EXERCISE_ID,
                set_index=2,
                reps=5,
                weight=55,
            ),
        )
        db.commit()

        one_rep_maxes = deload.collect_session_one_rep_maxes(
            fetch_recent_sets(db, user.id),
        )

        assert one_rep_maxes[REPS_WEIGHT_EXERCISE_ID] == [
            55 * (1 + 5 / 30),
            60 * (1 + 5 / 30),
        ]


class TestFindPlateauedLifts:
    def test_reports_every_flat_lift(self, db, user):
        log_flat_history(db, user.id)

        plateaued_lifts = deload.find_plateaued_lifts(fetch_recent_sets(db, user.id))

        assert {lift.exercise_id for lift in plateaued_lifts} == {
            REPS_WEIGHT_EXERCISE_ID,
            SECOND_EXERCISE_ID,
        }

    def test_one_tracked_lift_is_too_little_data_to_judge(self, db, user):
        for days_ago in (21, 14, 7, 1):
            log_workout(db, user.id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50})

        assert deload.find_plateaued_lifts(fetch_recent_sets(db, user.id)) == []

    def test_progressing_lifts_are_left_alone(self, db, user):
        for days_ago, weight in ((21, 50), (14, 52), (7, 54), (1, 56)):
            log_workout(
                db,
                user.id,
                days_ago,
                {REPS_WEIGHT_EXERCISE_ID: weight, SECOND_EXERCISE_ID: weight},
            )

        assert deload.find_plateaued_lifts(fetch_recent_sets(db, user.id)) == []


class TestFindHighAverageRpe:
    def test_returns_the_average_when_effort_is_high(self, db, user):
        log_hard_workouts(db, user.id, 3)

        average_rpe = deload.find_high_average_rpe(fetch_recent_sets(db, user.id), NOW)

        assert average_rpe == 9.5

    def test_two_workouts_are_too_little_data_to_judge(self, db, user):
        log_hard_workouts(db, user.id, 2)

        assert deload.find_high_average_rpe(fetch_recent_sets(db, user.id), NOW) is None

    def test_old_workouts_are_outside_the_window(self, db, user):
        for days_ago in (30, 28, 26):
            log_workout(db, user.id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50}, rpe=10)

        assert deload.find_high_average_rpe(fetch_recent_sets(db, user.id), NOW) is None

    def test_moderate_effort_is_not_high(self, db, user):
        for days_ago in (3, 2, 1):
            log_workout(db, user.id, days_ago, {REPS_WEIGHT_EXERCISE_ID: 50}, rpe=7)

        assert deload.find_high_average_rpe(fetch_recent_sets(db, user.id), NOW) is None


class TestAssessDeload:
    def test_explains_which_lifts_triggered_it(self, db, user):
        log_flat_history(db, user.id)

        result = deload.assess_deload(db, user.id, now=NOW)

        assert result["should_deload"] is True
        assert len(result["reasons"]) == 2
        assert (
            "estimated 1RM made no progress over your last 4 sessions"
            in (result["reasons"][0])
        )
        assert {lift["reason"] for lift in result["stalled_exercises"]} == {"stalled"}

    def test_explains_the_effort_that_triggered_it(self, db, user):
        log_hard_workouts(db, user.id, 3)

        result = deload.assess_deload(db, user.id, now=NOW)

        assert result["should_deload"] is True
        assert result["reasons"] == [
            "Your average effort over the last 14 days is RPE 9.5 "
            "(a deload is suggested from RPE 9.0).",
        ]
        assert result["stalled_exercises"] == []

    def test_is_not_repeated_during_the_cooldown(self, db, user):
        log_flat_history(db, user.id)

        first = deload.assess_deload(db, user.id, now=NOW)
        soon_after = deload.assess_deload(db, user.id, now=NOW + timedelta(days=3))

        assert first["should_deload"] is True
        assert soon_after == {"should_deload": False}

    def test_is_recommended_again_after_the_cooldown(self, db, user):
        log_flat_history(db, user.id)
        deload.assess_deload(db, user.id, now=NOW)

        after_cooldown = NOW + timedelta(days=deload.COOLDOWN_DAYS)
        log_workout(
            db,
            user.id,
            -(deload.COOLDOWN_DAYS - 1),
            {REPS_WEIGHT_EXERCISE_ID: 50, SECOND_EXERCISE_ID: 50},
        )

        result = deload.assess_deload(db, user.id, now=after_cooldown)

        assert result["should_deload"] is True

    def test_no_recommendation_after_the_lifter_stopped_training(self, db, user):
        log_flat_history(db, user.id)

        result = deload.assess_deload(db, user.id, now=NOW + timedelta(days=30))

        assert result == {"should_deload": False}
