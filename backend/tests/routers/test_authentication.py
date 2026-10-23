from datetime import timedelta

import jwt
import pytest
from app.config import settings
from app.services import user as user_service

ENDPOINTS = [
    ("get", "/api/auth/me"),
    ("get", "/api/workouts"),
    ("get", "/api/workouts/stats"),
    ("get", "/api/workouts/1"),
    ("get", "/api/workouts/previous/577"),
    ("post", "/api/workouts"),
    ("patch", "/api/workouts/1"),
    ("delete", "/api/workouts/1"),
    ("get", "/api/routines"),
    ("get", "/api/routines/1"),
    ("post", "/api/routines"),
    ("patch", "/api/routines/1"),
    ("delete", "/api/routines/1"),
    ("get", "/api/exercises"),
    ("get", "/api/exercises/577"),
    ("get", "/api/exercises/577/workouts"),
    ("get", "/api/achievements"),
    ("get", "/api/achievements/user"),
    ("get", "/api/achievements/exercise/577"),
    ("get", "/api/achievements/workout/1"),
    ("get", "/api/notifications"),
    ("patch", "/api/notifications/1/read"),
    ("post", "/api/notifications/subscribe"),
]


def _bearer(token):
    return {"Authorization": f"Bearer {token}"}


def _token(claims, expires=None):
    return user_service.create_access_token(claims, expires)


def _bad_credentials():
    return {
        "malformed": _bearer("not-a-jwt"),
        "wrong scheme": {"Authorization": "Basic dGVzdDp0ZXN0"},
        "forged": _bearer(
            jwt.encode(
                {"sub": "test@example.com"}, "another-secret-of-at-least-32-chars!!", "HS256"
            )
        ),
        "expired": _bearer(_token({"sub": "test@example.com"}, timedelta(seconds=-5))),
        "no subject": _bearer(_token({"demo": True})),
        "unknown user": _bearer(_token({"sub": "ghost@example.com"})),
        "unsigned": _bearer(
            jwt.encode({"sub": "test@example.com"}, key=None, algorithm="none")
        ),
    }


@pytest.mark.parametrize("method, url", ENDPOINTS)
def test_requests_without_a_token_are_401(client, user, method, url):
    response = getattr(client, method)(url)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("name", list(_bad_credentials()))
@pytest.mark.parametrize("method, url", [("get", "/api/workouts"), ("post", "/api/routines")])
def test_unusable_tokens_are_401(client, user, method, url, name):
    response = getattr(client, method)(url, headers=_bad_credentials()[name])

    assert response.status_code == 401


def test_a_valid_token_is_accepted(client, user, auth_headers):
    assert client.get("/api/auth/me", headers=auth_headers).status_code == 200


def test_a_token_for_a_deleted_user_is_rejected(client, db, user, auth_headers):
    from sqlalchemy import delete
    from app.models import User

    db.execute(delete(User).where(User.id == user.id))
    db.commit()

    assert client.get("/api/auth/me", headers=auth_headers).status_code == 401


def test_a_token_is_not_accepted_after_it_expires(client, user, monkeypatch):
    token = _token({"sub": user.email}, timedelta(seconds=1))
    assert client.get("/api/auth/me", headers=_bearer(token)).status_code == 200

    expired = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    expired["exp"] -= 60
    stale = jwt.encode(expired, settings.secret_key, algorithm=settings.algorithm)

    assert client.get("/api/auth/me", headers=_bearer(stale)).status_code == 401


def test_the_health_check_needs_no_token(client):
    assert client.get("/").status_code == 200
