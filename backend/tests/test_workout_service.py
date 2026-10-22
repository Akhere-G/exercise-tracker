from datetime import datetime

import pytest
from app.models import Exercise, User, Workout
from app.schemas.workout import WorkoutCreate, WorkoutSetCreate, WorkoutUpdate
from app.services import achievement as achievement_service
from app.services import workout as workout_service
from sqlalchemy import func, select


@pytest.fixture
def user(db):
    user = User(username="Test", email="test@example.com", password_hash="x")
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def weighted_exercise(db):
    stmt = select(Exercise).where(Exercise.metrics == "reps+weight").limit(1)
    return db.execute(stmt).scalars().one()


def _workout_in(exercise_id: int, weight: float = 50) -> WorkoutCreate:
    return WorkoutCreate(
        completed_at=datetime(2026, 10, 20, 12, 0),
        duration=3600,
        sets=[
            WorkoutSetCreate(
                exercise_id=exercise_id, set_index=1, reps=5, weight=weight
            )
        ],
    )


def _workout_count(db) -> int:
    return db.execute(select(func.count()).select_from(Workout)).scalar_one()


def _break_achievements(monkeypatch) -> None:
    def boom(*args, **kwargs):
        raise RuntimeError("achievements are broken")

    monkeypatch.setattr(achievement_service, "check_and_award_prs", boom)


def test_create_workout_awards_achievements(db, user, weighted_exercise):
    workout = workout_service.create_workout(
        db, user.id, _workout_in(weighted_exercise.id)
    )

    awarded = achievement_service.get_achievements_for_workout(
        db, user.id, workout.id
    )
    assert awarded


def test_create_workout_survives_achievement_failure(
    db, user, weighted_exercise, monkeypatch
):
    _break_achievements(monkeypatch)

    workout = workout_service.create_workout(
        db, user.id, _workout_in(weighted_exercise.id)
    )

    assert workout.id is not None
    assert len(workout.sets) == 1
    assert _workout_count(db) == 1


def test_update_workout_survives_achievement_failure(
    db, user, weighted_exercise, monkeypatch
):
    workout = workout_service.create_workout(
        db, user.id, _workout_in(weighted_exercise.id)
    )
    _break_achievements(monkeypatch)

    updated = workout_service.update_workout(
        db, user.id, workout.id, WorkoutUpdate(duration=1800)
    )

    assert updated is not None
    assert updated.duration == 1800
    assert _workout_count(db) == 1
