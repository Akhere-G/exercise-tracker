from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, event
from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
cert_path = os.getenv("DB_CA_CERT_PATH", "/app/certs/ca.pem")

def create_db_engine(database_url: str, ca_cert_path: str):
    if database_url.startswith("sqlite"):
        return create_engine(database_url, connect_args={"check_same_thread": False})

    return create_engine(
        database_url,
        # Replace connections the server or network dropped while idle (for
        # example after a Cloud SQL restart) instead of failing a request.
        pool_pre_ping=True,
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE_SECS", "1800")),
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
        connect_args={
            "sslmode": "require",
            "sslrootcert": ca_cert_path,
            "connect_timeout": int(os.getenv("DB_CONNECT_TIMEOUT_SECS", "10")),
        },
    )


engine = create_db_engine(DATABASE_URL, cert_path)


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
