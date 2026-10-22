from datetime import date, datetime

from app.models import Workout
from app.schemas.workout import WorkoutCreate, WorkoutSetCreate, WorkoutUpdate
from app.services import achievement as achievement_service
from app.services import workout as workout_service
from sqlalchemy import func, select
from tests.helpers import REPS_WEIGHT_EXERCISE_ID


def _workout_in(weight: float = 50) -> WorkoutCreate:
    return WorkoutCreate(
        completed_at=datetime(2026, 10, 20, 12, 0),
        duration=3600,
        sets=[
            WorkoutSetCreate(
                exercise_id=REPS_WEIGHT_EXERCISE_ID, set_index=1, reps=5, weight=weight
            )
        ],
    )


def _workout_count(db) -> int:
    return db.execute(select(func.count()).select_from(Workout)).scalar_one()


def _break_achievements(monkeypatch) -> None:
    def boom(*args, **kwargs):
        raise RuntimeError("achievements are broken")

    monkeypatch.setattr(achievement_service, "check_and_award_prs", boom)


def test_create_workout_awards_achievements(db, user):
    workout = workout_service.create_workout(db, user.id, _workout_in())

    assert achievement_service.get_achievements_for_workout(db, user.id, workout.id)


def test_create_workout_survives_achievement_failure(db, user, monkeypatch):
    _break_achievements(monkeypatch)

    workout = workout_service.create_workout(db, user.id, _workout_in())

    assert workout.id is not None
    assert len(workout.sets) == 1
    assert _workout_count(db) == 1


def test_update_workout_survives_achievement_failure(db, user, monkeypatch):
    workout = workout_service.create_workout(db, user.id, _workout_in())
    _break_achievements(monkeypatch)

    updated = workout_service.update_workout(
        db, user.id, workout.id, WorkoutUpdate(duration=1800)
    )

    assert updated.duration == 1800
    assert _workout_count(db) == 1


def _log_workout_at(db, user, completed_at):
    workout = WorkoutCreate(
        completed_at=completed_at,
        duration=3600,
        sets=[
            WorkoutSetCreate(
                exercise_id=REPS_WEIGHT_EXERCISE_ID, set_index=1, reps=5, weight=20
            )
        ],
    )
    return workout_service.create_workout(db, user.id, workout)


def test_get_workouts_filters_by_inclusive_date_range(db, user):
    moments = [
        datetime(2026, 10, 18, 23, 59),
        datetime(2026, 10, 19, 0, 0),
        datetime(2026, 10, 20, 23, 59),
        datetime(2026, 10, 21, 0, 0),
    ]
    ids = [_log_workout_at(db, user, moment).id for moment in moments]

    in_range = workout_service.get_workouts(
        db, user.id, start=date(2026, 10, 19), end=date(2026, 10, 20)
    )
    assert sorted(w.id for w in in_range) == ids[1:3]

    from_start = workout_service.get_workouts(db, user.id, start=date(2026, 10, 20))
    assert sorted(w.id for w in from_start) == ids[2:]

    until_end = workout_service.get_workouts(db, user.id, end=date(2026, 10, 18))
    assert [w.id for w in until_end] == ids[:1]

    assert len(workout_service.get_workouts(db, user.id)) == 4
