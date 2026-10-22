import os

from dotenv import load_dotenv

load_dotenv()

ALLOWED_ALGORITHMS = {"HS256", "HS384", "HS512"}
MIN_SECRET_KEY_LENGTH = 32


class ConfigError(RuntimeError):
    """Raised when required configuration is missing or unsafe."""


def load_signing_config() -> tuple[str, str]:
    """Return (SECRET_KEY, ALGORITHM), refusing to run with an unsafe setup.

    An empty key would let anyone forge tokens, and an unexpected algorithm
    (for example "none") would weaken verification, so fail at startup.
    """
    secret_key = os.getenv("SECRET_KEY", "")
    algorithm = os.getenv("ALGORITHM", "")

    if len(secret_key) < MIN_SECRET_KEY_LENGTH:
        raise ConfigError(
            f"SECRET_KEY must be set and at least {MIN_SECRET_KEY_LENGTH} "
            "characters long."
        )
    if algorithm not in ALLOWED_ALGORITHMS:
        allowed = ", ".join(sorted(ALLOWED_ALGORITHMS))
        raise ConfigError(f"ALGORITHM must be one of: {allowed}.")

    return secret_key, algorithm
