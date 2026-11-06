from app.constants.personas import PERSONAS, get_persona
from app.services.progression import SetResult, Suggestion, describe, suggest_next


def sets(*pairs, rpe=None, rir=None):
    return [SetResult(reps, weight, rpe, rir) for reps, weight in pairs]


def test_adds_load_when_every_set_hits_target_comfortably():
    result = suggest_next(sets((8, 60), (8, 60), (8, 60), rpe=7), 2.5)
    assert result == Suggestion("increase", 62.5, 8)


def test_repeats_load_when_effort_was_high():
    result = suggest_next(sets((8, 60), (8, 60), rpe=9.5), 2.5)
    assert result == Suggestion("repeat", 60, 8)


def test_repeats_load_when_no_reps_in_reserve():
    result = suggest_next(sets((8, 60), (8, 60), rir=0), 2.5)
    assert result.action == "repeat"


def test_adds_a_rep_when_a_set_fell_short_of_the_target():
    result = suggest_next(sets((8, 60), (6, 60)), 2.5, target_reps=8)
    assert result == Suggestion("add_rep", 60, 7)


def test_bodyweight_exercises_progress_by_reps():
    result = suggest_next(sets((10, None), (8, 0)), 2.5)
    assert result == Suggestion("reps_up", None, 11)


def test_no_suggestion_without_a_previous_session():
    assert suggest_next([], 2.5) is None


def test_every_persona_covers_every_action():
    actions = set(get_persona("hype").lines)
    for persona in PERSONAS.values():
        assert set(persona.lines) == actions


def test_describe_shows_weight_in_the_users_unit():
    suggestion = Suggestion("increase", 45.359237, 8)
    assert "100 lb" in describe("drill", suggestion, "lb")
    assert "45.3592 kg" in describe("drill", suggestion, "kg")


def test_unknown_persona_falls_back_to_the_default():
    assert get_persona("nope").slug == get_persona(None).slug
