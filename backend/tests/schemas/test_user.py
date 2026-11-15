import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate, UserLogin
from tests.helpers import PASSWORD


def _create(**overrides):
    return UserCreate(
        **{
            "username": "Ok",
            "email": "ok@example.com",
            "password": PASSWORD,
            "terms_accepted": True,
            **overrides,
        }
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


@pytest.mark.parametrize("terms_accepted", [False, None])
def test_user_create_requires_terms_acceptance(terms_accepted):
    with pytest.raises(ValidationError):
        if terms_accepted is None:
            UserCreate(username="Ok", email="ok@example.com", password=PASSWORD)
        else:
            _create(terms_accepted=terms_accepted)
