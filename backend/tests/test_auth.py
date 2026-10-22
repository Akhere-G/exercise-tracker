import pytest
from app.models import User
from app.services import user as user_service

PASSWORD = "Password1"


@pytest.fixture
def account(db):
    user = User(
        username="Test",
        email="test@example.com",
        password_hash=user_service.get_password_hash(PASSWORD),
    )
    db.add(user)
    db.commit()
    return user


def _login_json(client, email="test@example.com", password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def _login_form(client, email="test@example.com", password=PASSWORD):
    return client.post(
        "/api/auth/token", data={"username": email, "password": password}
    )


@pytest.mark.parametrize("login", [_login_json, _login_form])
def test_login_returns_a_token_that_works(client, account, login):
    response = login(client)

    assert response.status_code == 200
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    assert client.get("/api/auth/me", headers=headers).json()["id"] == account.id


@pytest.mark.parametrize("login", [_login_json, _login_form])
def test_wrong_password_and_unknown_email_fail_identically(client, account, login):
    wrong_password = login(client, password="Wrong-password1")
    unknown_email = login(client, email="nobody@example.com")

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()
    assert wrong_password.json()["detail"] == "Incorrect email or password"


def test_authenticate_user_checks_a_hash_for_unknown_email(db, monkeypatch):
    calls = []
    real = user_service.check_password_hash

    def spy(password, hash_):
        calls.append(hash_)
        return real(password, hash_)

    monkeypatch.setattr(user_service, "check_password_hash", spy)

    assert user_service.authenticate_user(db, "nobody@example.com", PASSWORD) is None
    assert len(calls) == 1
