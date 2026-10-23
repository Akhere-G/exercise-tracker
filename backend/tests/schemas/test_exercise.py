from types import SimpleNamespace

from app.schemas.exercise import ExerciseBase


def _link(name, contribution_type):
    return SimpleNamespace(
        muscle=SimpleNamespace(name=name), contribution_type=contribution_type
    )


def _exercise(muscles):
    return ExerciseBase.model_validate(
        {
            "name": "Move",
            "instructions": "-",
            "imageUrl": "-",
            "videoUrl": "-",
            "equipment": "none",
            "metrics": "reps",
            "priority": 0,
            "muscles": muscles,
        }
    )


def test_muscle_links_are_flattened_to_names_and_contribution_types():
    exercise = _exercise([_link("Chest", "primary"), _link("Triceps", "secondary")])

    assert [(m.name, m.contribution_type) for m in exercise.muscles] == [
        ("Chest", "primary"),
        ("Triceps", "secondary"),
    ]


def test_an_exercise_with_no_muscles_has_an_empty_list():
    assert _exercise([]).muscles == []
