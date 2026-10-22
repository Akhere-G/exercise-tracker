import glob
import importlib.util
import os
import subprocess
import sys

from app.database import Base
from sqlalchemy import create_engine, inspect, text

BACKEND = os.path.dirname(os.path.dirname(__file__))
INDEX_REVISION = "3f9a7df24886"
PREVIOUS_REVISION = "51e8ae576d9d"


def _alembic(url, *args):
    result = subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=BACKEND,
        env={**os.environ, "DATABASE_URL": url},
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    return result.stdout + result.stderr


def _load_migration():
    path = glob.glob(os.path.join(BACKEND, "alembic", "versions", f"{INDEX_REVISION}_*.py"))[0]
    spec = importlib.util.spec_from_file_location("index_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _index_names(url):
    inspector = inspect(create_engine(url))
    return {
        index["name"]
        for table in inspector.get_table_names()
        for index in inspector.get_indexes(table)
    }


def test_index_migration_adds_and_removes_the_foreign_key_indexes(tmp_path):
    """The initial chain does not build from empty, so start from the model schema."""
    url = f"sqlite:///{tmp_path / 'idx.db'}"
    engine = create_engine(url)
    Base.metadata.create_all(engine)

    # Put the database back in its pre-migration state: no new indexes.
    migration = _load_migration()
    with engine.begin() as conn:
        for name, _, _ in migration.INDEXES:
            conn.execute(text(f'DROP INDEX "{name}"'))
    wanted = {name for name, _, _ in migration.INDEXES}
    assert not wanted & _index_names(url)

    _alembic(url, "stamp", PREVIOUS_REVISION)
    _alembic(url, "upgrade", "head")
    assert wanted <= _index_names(url)
    # The migrated schema matches what the models declare.
    assert "No new upgrade operations detected" in _alembic(url, "check")

    _alembic(url, "downgrade", "-1")
    assert not wanted & _index_names(url)
