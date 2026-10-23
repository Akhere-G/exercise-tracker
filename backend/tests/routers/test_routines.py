import pytest
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


@pytest.mark.parametrize("field", ["name", "day"])
def test_patching_a_required_routine_field_to_null_is_a_422(client, auth_headers, field):
    created = client.post("/api/routines", json=routine_payload(), headers=auth_headers)
    url = f"/api/routines/{created.json()['id']}"

    response = client.patch(url, json={field: None}, headers=auth_headers)

    assert response.status_code == 422
    assert client.get(url, headers=auth_headers).json() == created.json()
