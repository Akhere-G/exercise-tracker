from datetime import date

from app.services.demo import reset_demo_user

PASSWORD = "Password1"
REPS_WEIGHT_EXERCISE_ID = 577


def run_reset(db, fixture, freeze, day=date(2026, 10, 21), **kwargs):
    now = freeze(day)
    return reset_demo_user(db, fixture, today=day, now=now, **kwargs)


def workout_payload(**overrides):
    return {
        "completedAt": "2026-10-20T12:00:00",
        "duration": 3600,
        "sets": [set_payload()],
        **overrides,
    }


def set_payload(**overrides):
    return {
        "exerciseId": REPS_WEIGHT_EXERCISE_ID,
        "setIndex": 1,
        "reps": 5,
        "weight": 20,
        **overrides,
    }


def routine_payload(**overrides):
    return {
        "name": "Push",
        "day": 1,
        "routineItems": [item_payload()],
        **overrides,
    }


def item_payload(**overrides):
    return {
        "exerciseId": REPS_WEIGHT_EXERCISE_ID,
        "targetSets": 3,
        "targetReps": 5,
        "order": 1,
        **overrides,
    }
