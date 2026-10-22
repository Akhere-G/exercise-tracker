import app.main as main
from app.database import create_db_engine
from app.models import Achievement
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import sessionmaker


def test_startup_seeds_missing_achievements(db, engine, monkeypatch):
    db.execute(delete(Achievement))
    db.commit()
    monkeypatch.setattr(main, "SessionLocal", sessionmaker(bind=engine))

    with TestClient(main.create_app()):
        pass

    db.expire_all()
    assert db.execute(select(func.count()).select_from(Achievement)).scalar_one() > 0


def test_postgres_engine_is_built_for_flaky_connections():
    engine = create_db_engine("postgresql+psycopg2://u:p@localhost/db", "/tmp/ca.pem")

    assert engine.pool._pre_ping is True
    assert engine.pool.size() == 5
    assert engine.pool._recycle == 1800
    assert engine.pool._max_overflow == 10


def test_postgres_engine_pool_is_configurable(monkeypatch):
    monkeypatch.setenv("DB_POOL_SIZE", "2")
    monkeypatch.setenv("DB_MAX_OVERFLOW", "3")

    engine = create_db_engine("postgresql+psycopg2://u:p@localhost/db", "/tmp/ca.pem")

    assert (engine.pool.size(), engine.pool._max_overflow) == (2, 3)


def test_sqlite_engine_keeps_its_simple_setup():
    engine = create_db_engine("sqlite://", "/unused")

    assert engine.dialect.name == "sqlite"
