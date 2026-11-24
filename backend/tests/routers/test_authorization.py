import pytest

from tests.helpers import routine_payload, workout_payload

# Routes that must work without a token.
PUBLIC_ROUTES = {
    ("POST", "/api/auth/register"),
    ("POST", "/api/auth/login"),
    ("POST", "/api/auth/token"),
    ("POST", "/api/auth/demo"),
}


def _api_routes(client):
    routes = []
    for route in client.app.routes:
        path = getattr(route, "path", "")
        for method in sorted(getattr(route, "methods", None) or []):
            if method in {"HEAD", "OPTIONS"}:
                continue
            routes.append((method, path))
    return routes


def test_every_route_requires_login_unless_it_is_public(client):
    unprotected = []
    checked = 0
    for method, path in _api_routes(client):
        if (method, path) in PUBLIC_ROUTES or not path.startswith("/api"):
            continue
        checked += 1
        response = client.request(method, path.format_map(_AnyInt()))
        if response.status_code != 401:
            unprotected.append((method, path, response.status_code))

    assert checked > 40  # the sweep must really cover the API
    assert unprotected == []


class _AnyInt(dict):
    """Fills every {path_param} with 1."""

    def __missing__(self, key):
        return "1"


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_another_user_cannot_touch_a_workout(
    client, auth_headers, other_headers, method
):
    created = client.post(
        "/api/workouts", json=workout_payload(), headers=auth_headers
    ).json()

    kwargs = {"json": workout_payload()} if method == "patch" else {}
    response = getattr(client, method)(
        f"/api/workouts/{created['id']}", headers=other_headers, **kwargs
    )

    assert response.status_code == 404
    still_there = client.get(f"/api/workouts/{created['id']}", headers=auth_headers)
    assert still_there.status_code == 200


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_another_user_cannot_touch_a_routine(
    client, auth_headers, other_headers, method
):
    created = client.post(
        "/api/routines", json=routine_payload(), headers=auth_headers
    ).json()

    kwargs = {"json": routine_payload()} if method == "patch" else {}
    response = getattr(client, method)(
        f"/api/routines/{created['id']}", headers=other_headers, **kwargs
    )

    assert response.status_code == 404
    still_there = client.get(f"/api/routines/{created['id']}", headers=auth_headers)
    assert still_there.status_code == 200
