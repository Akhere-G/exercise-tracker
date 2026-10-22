import pytest
from app.models import User


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
    backend = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

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
    alembic("upgrade", "51e8ae576d9d")
    assert "is_demo" in columns()

