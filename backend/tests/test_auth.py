import pytest
from app.limiter import limiter
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




def _register(client, email, password=PASSWORD):
    return client.post(
        "/api/auth/register",
        json={"username": "New", "email": email, "password": password},
    )


def test_register_stores_a_lowercase_email(client, db):
    assert _register(client, "  New.User@Example.COM ").status_code == 201

    assert db.query(User).one().email == "new.user@example.com"


def test_register_rejects_the_same_email_in_a_different_case(client, account):
    response = _register(client, "TEST@Example.com")

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_ignores_email_case(client, account):
    assert _login_json(client, email="Test@EXAMPLE.com").status_code == 200
    assert _login_form(client, email="Test@EXAMPLE.com").status_code == 200


def test_login_finds_accounts_stored_with_a_mixed_case_email(client, db):
    db.add(
        User(
            username="Old",
            email="Old.User@Example.com",
            password_hash=user_service.get_password_hash(PASSWORD),
        )
    )
    db.commit()

    assert _login_json(client, email="old.user@example.com").status_code == 200



def test_login_is_rate_limited_per_client(client, account, monkeypatch):
    monkeypatch.setattr(limiter, "enabled", True)

    responses = [_login_json(client, password="Wrong-password1") for _ in range(11)]

    assert [r.status_code for r in responses] == [401] * 10 + [429]
    assert responses[-1].json() == {"detail": "Too many requests. Try again later."}
    assert int(responses[-1].headers["Retry-After"]) > 0
