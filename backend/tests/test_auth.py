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


def test_create_user_reports_a_lost_registration_race(db, account):
    from app.schemas.user import UserCreate

    with pytest.raises(user_service.EmailAlreadyRegisteredError):
        user_service.create_user(
            db,
            UserCreate(username="Dup", email="test@example.com", password=PASSWORD),
        )

    # The session is usable again after the rollback.
    assert db.query(User).count() == 1


def test_register_returns_400_when_the_insert_races(client, account, monkeypatch):
    # The existence check passes (simulating the race), the insert then fails.
    real = user_service.get_user_by_email
    calls = {"n": 0}

    def first_call_misses(db, email):
        calls["n"] += 1
        return None if calls["n"] == 1 else real(db, email)

    monkeypatch.setattr(user_service, "get_user_by_email", first_call_misses)

    response = _register(client, "test@example.com")

    assert response.status_code == 400
