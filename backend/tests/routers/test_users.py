import pytest
from app.config import settings
from app.limiter import limiter
from app.models import User
from app.services import demo as demo_service
from app.services import user as user_service
from tests.helpers import PASSWORD, run_reset


def _register(client, email):
    return client.post(
        "/api/auth/register",
        json={"username": "New", "email": email, "password": PASSWORD},
    )


def _login_json(client, email="test@example.com", password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def _login_form(client, email="test@example.com", password=PASSWORD):
    return client.post(
        "/api/auth/token", data={"username": email, "password": password}
    )


def test_register_stores_a_lowercase_email(client, db):
    assert _register(client, "  New.User@Example.COM ").status_code == 201

    assert db.query(User).one().email == "new.user@example.com"


def test_register_rejects_the_same_email_in_a_different_case(client, user):
    response = _register(client, "TEST@Example.com")

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.parametrize("login", [_login_json, _login_form])
def test_login_ignores_email_case(client, user, login):
    assert login(client, email="Test@EXAMPLE.com").status_code == 200


def test_login_works_for_accounts_stored_with_a_mixed_case_email(client, db):
    db.add(
        User(
            username="Old",
            email="Old.User@Example.com",
            password_hash=user_service.get_password_hash(PASSWORD),
        )
    )
    db.commit()

    assert _login_json(client, email="old.user@example.com").status_code == 200


def test_login_is_rate_limited_per_client(client, user, monkeypatch):
    monkeypatch.setattr(limiter, "enabled", True)

    responses = [_login_json(client, password="Wrong-password1") for _ in range(11)]

    assert [r.status_code for r in responses] == [401] * 10 + [429]
    assert responses[-1].json() == {"detail": "Too many requests. Try again later."}
    assert int(responses[-1].headers["Retry-After"]) > 0


def test_demo_endpoint(client, db, fixture, freeze, monkeypatch):
    monkeypatch.setattr(settings, "demo_mode_enabled", False)
    assert client.post("/api/auth/demo").status_code == 404

    monkeypatch.setattr(settings, "demo_mode_enabled", True)
    assert client.post("/api/auth/demo").status_code == 503

    summary = run_reset(db, fixture, freeze)
    response = client.post("/api/auth/demo")
    assert response.status_code == 200
    token = response.json()["access_token"]

    import jwt

    claims = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    from datetime import datetime, timezone

    remaining = claims["exp"] - datetime.now(timezone.utc).timestamp()
    assert 7000 < remaining <= 7200

    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/auth/me", headers=headers).json()["id"] == summary.user_id
    assert len(client.get("/api/workouts", headers=headers).json()) == 14

    login = client.post(
        "/api/auth/login", json={"email": fixture["user"]["email"], "password": "Anything1"}
    )
    assert login.status_code == 401

    subscribe = client.post(
        "/api/notifications/subscribe",
        json={"endpoint": "e", "keys": {"p256dh": "p", "auth": "a"}},
        headers=headers,
    )
    assert subscribe.status_code == 403


def test_demo_quotas(client, db, fixture, freeze, monkeypatch):
    monkeypatch.setattr(settings, "demo_mode_enabled", True)
    run_reset(db, fixture, freeze)
    monkeypatch.setattr(demo_service, "DEMO_MAX_WORKOUTS", 14)
    monkeypatch.setattr(demo_service, "DEMO_MAX_ROUTINES", 4)
    headers = {"Authorization": f"Bearer {client.post('/api/auth/demo').json()['access_token']}"}

    workout = {
        "completedAt": "2026-10-20T12:00:00", "duration": 60,
        "sets": [{"exerciseId": 577, "setIndex": 1, "reps": 5, "weight": 20}],
    }
    assert client.post("/api/workouts", json=workout, headers=headers).status_code == 403
    routine = {
        "name": "x", "day": 1,
        "routineItems": [{"exerciseId": 577, "targetSets": 3, "targetReps": 5, "order": 1}],
    }
    assert client.post("/api/routines", json=routine, headers=headers).status_code == 403
