import copy
import re
from datetime import date

import pytest
from app.models import (
    Exercise,
    Notification,
    NotificationSubscription,
    Routine,
    RoutineItem,
    User,
    UserAchievement,
    Workout,
    WorkoutSet,
)
from app.services import demo as demo_service
from app.services import user as user_service
from app.services import workout as workout_service
from app.services.achievement import backfill_user_achievements
from app.services.demo import DemoSeedError, reset_demo_user
from sqlalchemy import event, func, select

REQUESTED_IDS = {
    1350, 596, 1723, 572, 1761, 1347, 32, 334, 9, 2963, 171, 968, 2311, 3666, 285,
    1452, 491, 50, 577, 2406, 2318, 43, 30, 2611, 294, 58, 2330, 11, 586, 597, 602, 312,
}


def run_reset(db, fixture, freeze, day=date(2026, 10, 21), **kwargs):
    now = freeze(day)
    return reset_demo_user(db, fixture, today=day, now=now, **kwargs)


def count(db, model, **filters):
    stmt = select(func.count()).select_from(model)
    for key, value in filters.items():
        stmt = stmt.where(getattr(model, key) == value)
    return db.execute(stmt).scalar_one()


def make_other_user(db):
    user = User(username="Real", email="real@example.com", password_hash="x")
    db.add(user)
    db.flush()
    routine = Routine(
        name="Mine", user_id=user.id, day=1,
        routine_items=[RoutineItem(exercise_id=577, target_sets=3, target_reps=10, order=1)],
    )
    from datetime import datetime

    workout = Workout(
        user_id=user.id, completed_at=datetime.now(), duration=100,
        sets=[WorkoutSet(exercise_id=577, set_index=1, reps=5, weight=20)],
    )
    db.add_all([routine, workout])
    db.add(Notification(user_id=user.id, title="t", message="m"))
    db.add(NotificationSubscription(user_id=user.id, endpoint="e", p256dh="p", auth="a"))
    db.flush()
    backfill_user_achievements(db, user.id)
    db.commit()
    return user


def snapshot(db, user_id):
    out = {}
    for model in (User, Routine, Workout, UserAchievement, Notification, NotificationSubscription):
        col = model.id if model is User else model.user_id
        rows = db.execute(select(model).where(col == user_id)).scalars().all()
        out[model.__tablename__] = sorted(
            tuple((c.name, getattr(r, c.name)) for c in model.__table__.columns) for r in rows
        )
    routine_ids = db.execute(select(Routine.id).where(Routine.user_id == user_id)).scalars().all()
    workout_ids = db.execute(select(Workout.id).where(Workout.user_id == user_id)).scalars().all()
    out["items"] = db.execute(select(RoutineItem.exercise_id).where(RoutineItem.routine_id.in_(routine_ids))).all()
    out["sets"] = db.execute(select(WorkoutSet.id, WorkoutSet.reps).where(WorkoutSet.workout_id.in_(workout_ids))).all()
    return out


def normalised(db, user_id):
    wanted = lambda rows: sorted(rows)
    workouts = db.execute(
        select(Workout.completed_at, Workout.duration, Workout.routine_id.is_(None)).where(Workout.user_id == user_id)
    ).all()
    sets = db.execute(
        select(WorkoutSet.exercise_id, WorkoutSet.set_index, WorkoutSet.reps, WorkoutSet.weight)
        .join(Workout).where(Workout.user_id == user_id)
    ).all()
    achievements = db.execute(
        select(UserAchievement.achievement_id, UserAchievement.exercise_id, UserAchievement.value, UserAchievement.unlocked_at)
        .where(UserAchievement.user_id == user_id)
    ).all()
    return wanted(workouts), wanted(sets), wanted(achievements)


# 1 fixture validity -----------------------------------------------------------

def test_fixture_is_valid_and_covers_requested_exercises(db, fixture, freeze):
    now = freeze(date(2026, 10, 21))
    catalogue = demo_service.get_catalogue(db, {e["id"] for e in fixture["exercises"]})
    demo_service.validate_fixture(fixture, catalogue, date(2026, 10, 21), now)
    used = {s["exerciseId"] for w in fixture["workouts"] for s in w["sets"]}
    assert used == REQUESTED_IDS
    assert len(fixture["workouts"]) == 14


def mutate(fixture, fn):
    copied = copy.deepcopy(fixture)
    fn(copied)
    return copied


MUTATIONS = {
    "unknown exercise": lambda f: f["exercises"][0].update(id=999999),
    "wrong name": lambda f: f["exercises"][0].update(name="Nope"),
    "wrong metrics set": lambda f: f["workouts"][0]["sets"][0].update(weight=None),
    "extra field": lambda f: f["workouts"][0]["sets"][0].update(distanceMeters=5),
    "future date": lambda f: f["workouts"][0].update(weekOffset=0, weekday=6),
    "duplicate key": lambda f: f["workouts"][1].update(key=f["workouts"][0]["key"]),
    "bad weekday": lambda f: f["workouts"][0].update(weekday=9),
    "fractional weight": lambda f: f["workouts"][0]["sets"][0].update(weight=40.5),
    "bad set index": lambda f: f["workouts"][0]["sets"][0].update(setIndex=3),
    "start time": lambda f: f["routines"][0].update(startTime="08:00"),
}


@pytest.mark.parametrize("name", MUTATIONS)
def test_invalid_fixtures_are_rejected(db, fixture, freeze, name):
    bad = mutate(fixture, MUTATIONS[name])
    with pytest.raises(DemoSeedError):
        run_reset(db, bad, freeze)
    assert count(db, User) == 0


# 2 derived state --------------------------------------------------------------

@pytest.mark.parametrize("day", [date(2026, 10, 19), date(2026, 10, 21), date(2026, 10, 25)])
def test_streaks_hold_throughout_the_current_week(db, fixture, freeze, day):
    summary = run_reset(db, fixture, freeze, day)
    assert workout_service.get_stats(db, summary.user_id)["weeklyStreak"] == 5
    streaks = workout_service.calculate_current_frequency_streaks(db, summary.user_id)
    assert streaks == {1: 5, 2: 5, 3: 4, 4: 0, 5: 0}
    assert summary.workouts == 14 and summary.routines == 4
    assert all(
        ua.unlocked_at is not None
        for ua in db.execute(select(UserAchievement)).scalars()
    )


# 3 idempotency ----------------------------------------------------------------

def test_reset_is_idempotent(db, fixture, freeze):
    first = run_reset(db, fixture, freeze)
    before = normalised(db, first.user_id)
    second = run_reset(db, fixture, freeze)
    assert second.user_id == first.user_id and not second.created_user
    assert normalised(db, second.user_id) == before
    assert count(db, User, is_demo=True) == 1


# 4 isolation + 5 statement capture --------------------------------------------

def test_reset_never_touches_other_users(db, engine, fixture, freeze):
    other = make_other_user(db)
    before = snapshot(db, other.id)
    exercises_before = count(db, Exercise)

    statements = []

    @event.listens_for(engine, "before_cursor_execute")
    def capture(conn, cursor, statement, parameters, context, executemany):
        statements.append((statement, parameters))

    summary = run_reset(db, fixture, freeze)
    run_reset(db, fixture, freeze)
    event.remove(engine, "before_cursor_execute", capture)

    assert snapshot(db, other.id) == before
    assert count(db, Exercise) == exercises_before

    writes = [(s, p) for s, p in statements if re.match(r"\s*(INSERT|UPDATE|DELETE)", s)]
    for statement, params in writes:
        assert not re.search(
            r"(INSERT INTO|UPDATE|DELETE FROM)\s+(exercises|muscles|exercise_muscles|achievements)\b",
            statement,
        ), statement
        if statement.lstrip().startswith("DELETE"):
            assert "user_id" in statement, statement
            assert summary.user_id in tuple(params), (statement, params)


def test_reset_refuses_when_foreign_keys_are_off(db, fixture, freeze):
    db.execute(__import__("sqlalchemy").text("PRAGMA foreign_keys=OFF"))
    with pytest.raises(DemoSeedError):
        run_reset(db, fixture, freeze)


# 6 hijack guard ---------------------------------------------------------------

def test_existing_non_demo_user_with_demo_email_is_protected(db, fixture, freeze):
    victim = User(username="Real", email=fixture["user"]["email"], password_hash="x")
    db.add(victim)
    db.flush()
    db.add(Workout(user_id=victim.id, completed_at=__import__("datetime").datetime.now(), duration=1))
    db.commit()

    with pytest.raises(DemoSeedError):
        run_reset(db, fixture, freeze)
    assert count(db, Workout, user_id=victim.id) == 1
    assert db.get(User, victim.id).is_demo is False


# 7 atomicity ------------------------------------------------------------------

def test_failure_mid_reset_keeps_previous_data(db, fixture, freeze, monkeypatch):
    summary = run_reset(db, fixture, freeze)
    ids_before = sorted(db.execute(select(Workout.id).where(Workout.user_id == summary.user_id)).scalars())

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(demo_service, "_insert_workouts", boom)
    with pytest.raises(RuntimeError):
        run_reset(db, fixture, freeze)

    ids_after = sorted(db.execute(select(Workout.id).where(Workout.user_id == summary.user_id)).scalars())
    assert ids_after == ids_before


def test_dry_run_rolls_back(db, fixture, freeze):
    run_reset(db, fixture, freeze, commit=False)
    assert count(db, User) == 0


# 8 endpoints ------------------------------------------------------------------

def test_demo_endpoint(client, db, fixture, freeze, monkeypatch):
    monkeypatch.delenv("DEMO_MODE_ENABLED", raising=False)
    assert client.post("/api/auth/demo").status_code == 404

    monkeypatch.setenv("DEMO_MODE_ENABLED", "true")
    assert client.post("/api/auth/demo").status_code == 503

    summary = run_reset(db, fixture, freeze)
    response = client.post("/api/auth/demo")
    assert response.status_code == 200
    token = response.json()["access_token"]

    import jwt

    claims = jwt.decode(token, user_service.SECRET_KEY, algorithms=[user_service.ALGORITHM])
    from datetime import datetime, timezone

    remaining = claims["exp"] - datetime.now(timezone.utc).timestamp()
    assert 7000 < remaining <= 7200

    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/auth/me", headers=headers).json()["id"] == summary.user_id
    assert len(client.get("/api/workouts", headers=headers).json()) == 14

    login = client.post(
        "/api/auth/login", json={"email": fixture["user"]["email"], "password": "Anything1"}
    )
    assert login.status_code == 401

    subscribe = client.post(
        "/api/notifications/subscribe",
        json={"endpoint": "e", "keys": {"p256dh": "p", "auth": "a"}},
        headers=headers,
    )
    assert subscribe.status_code == 403


def test_demo_quotas(client, db, fixture, freeze, monkeypatch):
    monkeypatch.setenv("DEMO_MODE_ENABLED", "true")
    run_reset(db, fixture, freeze)
    monkeypatch.setattr(demo_service, "DEMO_MAX_WORKOUTS", 14)
    monkeypatch.setattr(demo_service, "DEMO_MAX_ROUTINES", 4)
    headers = {"Authorization": f"Bearer {client.post('/api/auth/demo').json()['access_token']}"}

    workout = {
        "completedAt": "2026-10-20T12:00:00", "duration": 60,
        "sets": [{"exerciseId": 577, "setIndex": 1, "reps": 5, "weight": 20}],
    }
    assert client.post("/api/workouts", json=workout, headers=headers).status_code == 403
    routine = {
        "name": "x", "day": 1,
        "routineItems": [{"exerciseId": 577, "targetSets": 3, "targetReps": 5, "order": 1}],
    }
    assert client.post("/api/routines", json=routine, headers=headers).status_code == 403


# 9 database hook + migration --------------------------------------------------

def test_sqlite_foreign_keys_hook(engine):
    from sqlalchemy import text

    with engine.connect() as conn:
        assert conn.execute(text("PRAGMA foreign_keys")).scalar() == 1


def test_single_demo_user_index(db):
    db.add(User(username="a", email="a@x.com", password_hash="x", is_demo=True))
    db.commit()
    db.add(User(username="b", email="b@x.com", password_hash="x", is_demo=True))
    with pytest.raises(Exception):
        db.commit()
    db.rollback()


def test_migration_downgrade_and_upgrade(tmp_path):
    """The initial chain does not build from empty, so start from the model schema."""
    import os
    import subprocess
    import sys

    from app.database import Base
    from sqlalchemy import create_engine, inspect

    url = f"sqlite:///{tmp_path / 'm.db'}"
    Base.metadata.create_all(create_engine(url))
    env = {**os.environ, "DATABASE_URL": url}
    backend = os.path.dirname(os.path.dirname(__file__))

    def alembic(*args):
        result = subprocess.run(
            [sys.executable, "-m", "alembic", *args], cwd=backend, env=env,
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr

    columns = lambda: {c["name"] for c in inspect(create_engine(url)).get_columns("users")}
    alembic("stamp", "51e8ae576d9d")
    alembic("downgrade", "-1")
    assert "is_demo" not in columns()
    alembic("upgrade", "head")
    assert "is_demo" in columns()
