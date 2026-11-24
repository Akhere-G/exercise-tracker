import os
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# The test suite sets this so a developer's own backend/.env (a real Redis, AI
# keys, proxy settings) never leaks into tests.
SKIP_ENV_FILE_VARIABLE = "GAINS_SKIP_ENV_FILE"
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None if os.environ.get(SKIP_ENV_FILE_VARIABLE) else ENV_FILE,
        extra="ignore",
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
    # Contact the push services can reach (an email or https URL) if we misbehave.
    vapid_contact: str | None = None

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash"
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-20b"


settings = Settings()
