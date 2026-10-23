from datetime import datetime
from types import SimpleNamespace

import pytest
from app.schemas.user import UserCreate, UserLogin, UserResponse
from pydantic import ValidationError
from tests.helpers import PASSWORD


def _create(**overrides):
    return UserCreate(
        **{"username": "Ok", "email": "ok@example.com", "password": PASSWORD, **overrides}
    )


@pytest.mark.parametrize(
    "overrides",
    [
        {"username": ""},
        {"username": "   "},
        {"username": "x" * 51},
        {"email": "a" * 45 + "@example.com"},
    ],
)
def test_user_create_rejects_values_that_do_not_fit_the_columns(overrides):
    with pytest.raises(ValidationError):
        _create(**overrides)


def test_emails_are_trimmed_and_lowercased():
    assert _create(email="  New.User@Example.COM ").email == "new.user@example.com"
    assert (
        UserLogin(email="Test@EXAMPLE.com", password=PASSWORD).email
        == "test@example.com"
    )


@pytest.mark.parametrize(
    "password",
    [
        "Short1a",  # 7 characters
        "alllowercase1",
        "ALLUPPERCASE1",
        "NoDigitsHere",
        "x" * 73,
        "",
    ],
)
def test_user_create_rejects_weak_passwords(password):
    with pytest.raises(ValidationError):
        _create(password=password)


@pytest.mark.parametrize("password", ["Passw0rd", "a1B" + "x" * 69, "Pass word 1"])
def test_user_create_accepts_passwords_meeting_the_rules(password):
    assert _create(password=password).password == password


def test_user_create_trims_the_username():
    assert _create(username="  Sam  ").username == "Sam"


@pytest.mark.parametrize("email", ["not-an-email", "a@", "@example.com", ""])
def test_user_create_rejects_malformed_emails(email):
    with pytest.raises(ValidationError):
        _create(email=email)


def test_user_response_exposes_only_the_public_profile():
    orm_user = SimpleNamespace(
        id=1,
        username="Test",
        email="test@example.com",
        is_demo=False,
        created_at=datetime(2026, 10, 21),
        password_hash="secret",
    )

    dumped = UserResponse.model_validate(orm_user).model_dump(by_alias=True)

    assert set(dumped) == {"id", "username", "email", "isDemo", "createdAt"}
