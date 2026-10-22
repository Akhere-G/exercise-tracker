import os

# Must be set before app modules import: never let tests reach a real database.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-at-least-32-chars"
os.environ["ALGORITHM"] = "HS256"

import json
from datetime import date, datetime, time
from pathlib import Path

import pytest
from app.database import Base, enable_sqlite_foreign_keys
from app.services import demo as demo_service
from app.services import workout as workout_service
from app.services.achievement import seed_achievements
from seed import seed_all_muscles, seed_exercises_and_junctions
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
WEDNESDAY = date(2026, 10, 21)


@pytest.fixture(scope="session")
def exercise_data():
    with open(ROOT / "exercises.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def engine(exercise_data):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    enable_sqlite_foreign_keys(engine)
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as session:
        muscles = seed_all_muscles(session, exercise_data)
        seed_exercises_and_junctions(session, exercise_data, muscles)
        session.commit()
        seed_achievements(session)
    yield engine
    engine.dispose()


@pytest.fixture
def db(engine):
    session = sessionmaker(bind=engine, autoflush=False)()
    yield session
    session.close()


@pytest.fixture
def fixture():
    return demo_service.load_fixture()


class FrozenDate(date):
    frozen = WEDNESDAY

    @classmethod
    def today(cls):
        return cls.frozen


@pytest.fixture
def freeze(monkeypatch):
    def _freeze(day: date) -> datetime:
        FrozenDate.frozen = day
        monkeypatch.setattr(workout_service, "date", FrozenDate)
        monkeypatch.setattr(demo_service, "date", FrozenDate)
        return datetime.combine(day, time(23, 59))

    return _freeze
