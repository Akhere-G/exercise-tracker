import pytest
from tests.helpers import routine_payload, workout_payload

MISSING = 999_999


@pytest.mark.parametrize(
    "method, url, body",
    [
        ("get", f"/api/workouts/{MISSING}", None),
        ("patch", f"/api/workouts/{MISSING}", {"duration": 5}),
        ("delete", f"/api/workouts/{MISSING}", None),
        ("get", f"/api/routines/{MISSING}", None),
        ("patch", f"/api/routines/{MISSING}", {"name": "x"}),
        ("delete", f"/api/routines/{MISSING}", None),
        ("get", f"/api/exercises/{MISSING}", None),
    ],
)
def test_missing_records_are_404(client, auth_headers, method, url, body):
    response = getattr(client, method)(url, headers=auth_headers, **({"json": body} if body else {}))

    assert response.status_code == 404
    assert response.json()["detail"]


def test_a_workout_for_a_missing_routine_is_404(client, db, auth_headers):
    response = client.post(
        "/api/workouts", json=workout_payload(routineId=MISSING), headers=auth_headers
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Routine not found."


def test_a_deleted_record_is_gone(client, auth_headers):
    workout = client.post("/api/workouts", json=workout_payload(), headers=auth_headers).json()
    routine = client.post("/api/routines", json=routine_payload(), headers=auth_headers).json()

    assert client.delete(f"/api/workouts/{workout['id']}", headers=auth_headers).json() == workout["id"]
    assert client.delete(f"/api/routines/{routine['id']}", headers=auth_headers).json() == routine["id"]

    assert client.get(f"/api/workouts/{workout['id']}", headers=auth_headers).status_code == 404
    assert client.get(f"/api/routines/{routine['id']}", headers=auth_headers).status_code == 404
    assert client.delete(f"/api/workouts/{workout['id']}", headers=auth_headers).status_code == 404


def test_lists_for_missing_ids_are_empty_not_errors(client, auth_headers):
    assert client.get(f"/api/workouts/previous/{MISSING}", headers=auth_headers).json() == []
    assert client.get(f"/api/exercises/{MISSING}/workouts", headers=auth_headers).json() == []
    assert client.get(f"/api/achievements/workout/{MISSING}", headers=auth_headers).json() == []
    assert client.get(f"/api/workouts?routineId={MISSING}", headers=auth_headers).json() == []
