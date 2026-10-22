from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env", extra="ignore"
    )

    secret_key: str = Field(min_length=32)
    algorithm: Literal["HS256", "HS384", "HS512"]

    database_url: str = "sqlite:///./database.db"
    db_ca_cert_path: str = "/app/certs/ca.pem"
    db_pool_recycle_secs: int = 1800
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_connect_timeout_secs: int = 10

    frontend_origin: str = "http://localhost:3000"
    demo_mode_enabled: bool = False

    redis_url: str | None = None
    trusted_proxy_count: int | None = None

    vapid_private_key: str | None = None


settings = Settings()
