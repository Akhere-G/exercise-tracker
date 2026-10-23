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


@pytest.fixture(scope="session", autouse=True)
def cheap_password_hashing():
    """bcrypt at production cost dominates the run time and proves nothing here."""
    from app.services import user as user_service

    user_service.pwd_context.update(bcrypt_sha256__rounds=4)


@pytest.fixture(scope="session")
def password_hash(cheap_password_hashing):
    from app.services import user as user_service
    from tests.helpers import PASSWORD

    return user_service.get_password_hash(PASSWORD)


@pytest.fixture(scope="session")
def exercise_data():
    with open(ROOT / "exercises.json", encoding="utf-8") as f:
        return json.load(f)


def _new_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    enable_sqlite_foreign_keys(engine)
    return engine


@pytest.fixture(scope="session")
def seeded_template(exercise_data):
    """The schema, exercise catalogue and achievements, built once per run."""
    engine = _new_engine()
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as session:
        muscles = seed_all_muscles(session, exercise_data)
        seed_exercises_and_junctions(session, exercise_data, muscles)
        session.commit()
        seed_achievements(session)
    yield engine
    engine.dispose()


@pytest.fixture
def engine(seeded_template):
    """A fresh in-memory copy of the seeded template for each test."""
    engine = _new_engine()
    source = seeded_template.raw_connection()
    target = engine.raw_connection()
    try:
        source.driver_connection.backup(target.driver_connection)
    finally:
        source.close()
        target.close()
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


@pytest.fixture(autouse=True)
def reset_rate_limits():
    from app.limiter import limiter

    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def client(engine, monkeypatch):
    from app.database import get_db
    from app.main import create_app
    from fastapi.testclient import TestClient
    from sqlalchemy.orm import sessionmaker

    app = create_app()
    Session = sessionmaker(bind=engine, autoflush=False)

    def override():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override
    return TestClient(app)


@pytest.fixture
def user(db, password_hash):
    from app.models import User

    user = User(
        username="Test",
        email="test@example.com",
        password_hash=password_hash,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def auth_headers(user):
    from app.services import user as user_service

    token = user_service.get_access_token(user.email).access_token
    return {"Authorization": f"Bearer {token}"}
