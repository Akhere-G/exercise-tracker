import pytest
from app.config import MIN_SECRET_KEY_LENGTH, ConfigError, load_signing_config

GOOD_KEY = "k" * MIN_SECRET_KEY_LENGTH


def test_valid_config_is_returned(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", GOOD_KEY)
    monkeypatch.setenv("ALGORITHM", "HS256")

    assert load_signing_config() == (GOOD_KEY, "HS256")


@pytest.mark.parametrize("key", [None, "", "too-short", "k" * (MIN_SECRET_KEY_LENGTH - 1)])
def test_missing_or_short_secret_key_is_rejected(monkeypatch, key):
    monkeypatch.setenv("ALGORITHM", "HS256")
    if key is None:
        monkeypatch.delenv("SECRET_KEY", raising=False)
    else:
        monkeypatch.setenv("SECRET_KEY", key)

    with pytest.raises(ConfigError, match="SECRET_KEY"):
        load_signing_config()


@pytest.mark.parametrize("algorithm", [None, "", "none", "RS256", "hs256"])
def test_missing_or_unsupported_algorithm_is_rejected(monkeypatch, algorithm):
    monkeypatch.setenv("SECRET_KEY", GOOD_KEY)
    if algorithm is None:
        monkeypatch.delenv("ALGORITHM", raising=False)
    else:
        monkeypatch.setenv("ALGORITHM", algorithm)

    with pytest.raises(ConfigError, match="ALGORITHM"):
        load_signing_config()
