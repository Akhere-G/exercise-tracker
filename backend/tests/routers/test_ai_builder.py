import json

import pytest
from app.exceptions import AIUnavailable
from app.services import ai_builder

REQUEST = {
    "goal": "hypertrophy",
    "equipment": ["machines", "dumbbells"],
    "minutes": 45,
    "daysPerWeek": 2,
}


@pytest.fixture
def known_id(db):
    """An exercise the builder offers for the requested equipment."""
    return ai_builder.find_candidates(db, REQUEST["equipment"])[0].id


@pytest.fixture
def reply(monkeypatch):
    """Set what the model says; the prompt it was given is kept on `reply.prompt`."""

    def set_reply(text):
        def fake_generate(prompt, system, providers=None):
            set_reply.prompt, set_reply.system = prompt, system
            if isinstance(text, Exception):
                raise text
            return text

        monkeypatch.setattr(ai_builder.ai_service, "generate_text", fake_generate)

    return set_reply


def plan(*routines, rationale="Because."):
    return json.dumps({"routines": list(routines), "rationale": rationale})


def routine(name, *items):
    return {"name": name, "items": list(items)}


def item(exercise_id, **overrides):
    return {
        "exerciseId": exercise_id,
        "sets": 3,
        "reps": 10,
        "restSecs": 90,
        "supersetGroup": None,
        **overrides,
    }


def build(client, auth_headers):
    return client.post("/api/ai/build-routine", json=REQUEST, headers=auth_headers)


def test_returns_a_preview_with_exercise_names_and_spread_days(
    client, auth_headers, reply, known_id
):
    reply(plan(routine("Day A", item(known_id)), routine("Day B", item(known_id))))

    response = build(client, auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert [r["day"] for r in body["routines"]] == [0, 4]
    assert body["routines"][0]["items"][0]["name"]
    assert body["rationale"] == "Because."


def test_unknown_exercise_ids_are_dropped(client, auth_headers, reply, known_id):
    reply(plan(routine("Day A", item(known_id), item(999_999))))

    [only] = build(client, auth_headers).json()["routines"]

    assert [i["exerciseId"] for i in only["items"]] == [known_id]


def test_exercises_outside_the_chosen_equipment_are_dropped(
    client, auth_headers, reply, known_id
):
    barbell_bench_press = 25
    reply(plan(routine("Day A", item(known_id), item(barbell_bench_press))))

    [only] = build(client, auth_headers).json()["routines"]

    assert len(only["items"]) == 1


def test_sets_reps_and_rest_are_clamped(client, auth_headers, reply, known_id):
    reply(plan(routine("Day A", item(known_id, sets=99, reps=500, restSecs=-5))))

    [only] = build(client, auth_headers).json()["routines"]

    assert (only["items"][0]["sets"], only["items"][0]["reps"]) == (10, 30)
    assert only["items"][0]["restSecs"] == 0


def test_a_plan_with_no_known_exercises_is_unavailable(client, auth_headers, reply):
    reply(plan(routine("Day A", item(999_999))))

    assert build(client, auth_headers).status_code == 503


def test_unreadable_output_is_unavailable(client, auth_headers, reply):
    reply("sorry, I cannot do that")

    assert build(client, auth_headers).status_code == 503


def test_provider_outage_is_unavailable(client, auth_headers, reply):
    reply(AIUnavailable())

    assert build(client, auth_headers).status_code == 503


def test_prompt_lists_only_matching_equipment_and_uses_the_persona(
    client, auth_headers, reply, known_id
):
    client.patch("/api/profile", json={"coachPersona": "drill"}, headers=auth_headers)
    reply(plan(routine("Day A", item(known_id))))

    build(client, auth_headers)

    assert f"{known_id}:" in reply.prompt
    assert "Barbell Bench Press" not in reply.prompt
    assert "drill sergeant" in reply.system


def test_demo_users_cannot_build(client, auth_headers, db, reply, known_id):
    from app.models import User

    db.query(User).update({"is_demo": True})
    db.commit()
    reply(plan(routine("Day A", item(known_id))))

    assert build(client, auth_headers).status_code == 403


def test_requires_at_least_one_equipment_choice(client, auth_headers):
    response = client.post(
        "/api/ai/build-routine",
        json={**REQUEST, "equipment": []},
        headers=auth_headers,
    )
    assert response.status_code == 422
