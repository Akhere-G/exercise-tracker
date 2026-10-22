from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=settings.db_pool_recycle_secs,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        connect_args={
            "sslmode": "require",
            "sslrootcert": settings.db_ca_cert_path,
            "connect_timeout": settings.db_connect_timeout_secs,
        },
    )


def enable_sqlite_foreign_keys(target_engine) -> None:
    """Enforce foreign keys (and so ON DELETE rules) on every SQLite connection."""
    if target_engine.dialect.name != "sqlite":
        return

    @event.listens_for(target_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


enable_sqlite_foreign_keys(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Base(DeclarativeBase):
    pass
