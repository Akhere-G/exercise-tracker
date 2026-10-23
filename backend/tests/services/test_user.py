from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import jwt
import pytest
from app.config import settings
from app.models import User
from app.services import user as user_service
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError


def test_get_user_by_email_ignores_case(db, user):
    assert user_service.get_user_by_email(db, "TEST@Example.com").id == user.id


def test_get_user_by_email_finds_accounts_stored_with_a_mixed_case_email(db):
    db.add(User(username="Old", email="Old.User@Example.com", password_hash="x"))
    db.commit()

    assert user_service.get_user_by_email(db, "old.user@example.com") is not None


def _decode(token, **kwargs):
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm], **kwargs)


def test_access_token_carries_the_subject_and_a_week_long_expiry():
    token = user_service.get_access_token("a@example.com").access_token

    claims = _decode(token)
    remaining = claims["exp"] - datetime.now(timezone.utc).timestamp()
    assert claims["sub"] == "a@example.com"
    assert 6.9 * 86400 < remaining <= 7 * 86400


def test_create_access_token_honours_a_custom_expiry():
    token = user_service.create_access_token({"sub": "a"}, timedelta(minutes=5))

    remaining = _decode(token)["exp"] - datetime.now(timezone.utc).timestamp()
    assert 290 < remaining <= 300


def test_create_access_token_does_not_mutate_its_input():
    data = {"sub": "a"}

    user_service.create_access_token(data)

    assert data == {"sub": "a"}


def test_an_expired_token_fails_to_decode():
    token = user_service.create_access_token({"sub": "a"}, timedelta(seconds=-1))

    with pytest.raises(ExpiredSignatureError):
        _decode(token)


def test_a_token_signed_with_another_key_fails_to_decode():
    forged = jwt.encode({"sub": "a"}, "another-secret-key-of-32-characters!", algorithm="HS256")

    with pytest.raises(InvalidTokenError):
        _decode(forged)


def test_demo_tokens_are_flagged_and_short_lived():
    token = user_service.get_demo_access_token(SimpleNamespace(email="demo@example.com"))

    claims = _decode(token.access_token)
    assert claims["demo"] is True
    assert claims["exp"] - datetime.now(timezone.utc).timestamp() <= 7200


def test_password_hashes_verify_only_the_right_password():
    hashed = user_service.get_password_hash("Password1")

    assert hashed != "Password1"
    assert user_service.check_password_hash("Password1", hashed)
    assert not user_service.check_password_hash("Password2", hashed)
