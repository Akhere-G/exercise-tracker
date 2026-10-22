import pytest
from app.schemas.user import UserCreate, UserLogin
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
