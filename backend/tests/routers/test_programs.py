import pytest
from app.constants.programs import PROGRAMS
from app.services.program import resolve_exercise_ids


@pytest.mark.parametrize("program", PROGRAMS.values(), ids=lambda p: p.slug)
def test_every_program_exercise_exists_in_the_catalogue(db, program):
    ids = resolve_exercise_ids(db, program)

    assert len(ids) == len({e.name for d in program.days for e in d.exercises})


def test_lists_all_programs(client, auth_headers):
    response = client.get("/api/programs", headers=auth_headers)

    assert response.status_code == 200
    assert {p["slug"] for p in response.json()} == set(PROGRAMS)


def test_applying_a_program_creates_a_routine_per_day(client, auth_headers):
    response = client.post(
        "/api/programs/upper-lower/apply",
        json={"startDay": 0},
        headers=auth_headers,
    )

    assert response.status_code == 201
    routines = response.json()
    assert [r["day"] for r in routines] == [0, 1, 3, 4]
    assert routines[0]["name"] == "Upper / Lower: Upper A"
    first = routines[0]["routineItems"][0]
    assert (first["targetSets"], first["targetReps"], first["restSecs"]) == (4, 6, 180)
    assert len(client.get("/api/routines", headers=auth_headers).json()) == 4


def test_days_wrap_around_the_week(client, auth_headers):
    response = client.post(
        "/api/programs/five-by-five/apply",
        json={"startDay": 5},
        headers=auth_headers,
    )

    assert [r["day"] for r in response.json()] == [5, 0, 2]


def test_unknown_program_is_a_404(client, auth_headers):
    response = client.post(
        "/api/programs/nope/apply", json={"startDay": 0}, headers=auth_headers
    )
    assert response.status_code == 404


def test_rejects_an_invalid_start_day(client, auth_headers):
    response = client.post(
        "/api/programs/ppl/apply", json={"startDay": 9}, headers=auth_headers
    )
    assert response.status_code == 422
