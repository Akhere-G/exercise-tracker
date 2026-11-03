from app.models import Routine
from sqlalchemy import func, select
from tests.helpers import item_payload, routine_payload


def test_creating_a_routine_with_an_unknown_exercise_is_a_422(client, db, auth_headers):
    payload = routine_payload(routineItems=[item_payload(exerciseId=999_999)])

    response = client.post("/api/routines", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert db.execute(select(func.count()).select_from(Routine)).scalar_one() == 0


def test_updating_a_routine_with_an_unknown_exercise_is_a_422(client, auth_headers):
    created = client.post("/api/routines", json=routine_payload(), headers=auth_headers)
    url = f"/api/routines/{created.json()['id']}"

    response = client.patch(
        url,
        json={"routineItems": [item_payload(exerciseId=999_999)]},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_batch_creates_every_routine(client, auth_headers):
    response = client.post(
        "/api/routines/batch",
        json=[routine_payload(name="A", day=0), routine_payload(name="B", day=2)],
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert [r["name"] for r in response.json()] == ["A", "B"]
    assert len(client.get("/api/routines", headers=auth_headers).json()) == 2


def test_batch_creates_nothing_when_one_routine_is_invalid(client, auth_headers):
    bad_item = item_payload(exerciseId=999_999)
    response = client.post(
        "/api/routines/batch",
        json=[routine_payload(name="A"), routine_payload(name="B", routineItems=[bad_item])],
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert client.get("/api/routines", headers=auth_headers).json() == []


def test_batch_rejects_an_empty_list(client, auth_headers):
    response = client.post("/api/routines/batch", json=[], headers=auth_headers)
    assert response.status_code == 422
