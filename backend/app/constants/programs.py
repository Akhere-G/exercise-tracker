"""Prebuilt training programs. Exercises are referenced by name (as stored in the
exercise table) and resolved to ids when a program is applied."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ProgramExercise:
    name: str
    sets: int
    reps: int
    rest_secs: int = 120


@dataclass(frozen=True)
class ProgramDay:
    name: str
    offset: int  # days after the day the user starts the program
    exercises: tuple[ProgramExercise, ...]


@dataclass(frozen=True)
class Program:
    slug: str
    name: str
    description: str
    level: str
    days: tuple[ProgramDay, ...]


def _ex(name: str, sets: int, reps: int, rest_secs: int = 120) -> ProgramExercise:
    return ProgramExercise(name, sets, reps, rest_secs)


_PUSH = (
    _ex("Barbell Bench Press", 4, 6, 180),
    _ex("Dumbbell Seated Shoulder Press", 3, 8),
    _ex("Dumbbell Incline Bench Press", 3, 10),
    _ex("Dumbbell Lateral Raise", 3, 15, 60),
    _ex("Cable Pushdown", 3, 12, 60),
)
_PULL = (
    _ex("Barbell Bent Over Row", 4, 6, 180),
    _ex("Cable Pulldown", 3, 10),
    _ex("Cable Seated Row", 3, 10),
    _ex("Cable Standing Rear Delt Row (With Rope)", 3, 15, 60),
    _ex("Barbell Curl", 3, 10, 60),
)
_LEGS = (
    _ex("Barbell Full Squat", 4, 6, 180),
    _ex("Barbell Romanian Deadlift", 3, 8),
    _ex("Lever Seated Leg Curl", 3, 12, 60),
    _ex("Lever Leg Extension", 3, 12, 60),
    _ex("Barbell Standing Calf Raise", 4, 12, 60),
)
_UPPER = (
    _ex("Barbell Bench Press", 4, 6, 180),
    _ex("Barbell Bent Over Row", 4, 8, 150),
    _ex("Dumbbell Seated Shoulder Press", 3, 10),
    _ex("Cable Pulldown", 3, 10),
    _ex("Barbell Curl", 2, 12, 60),
    _ex("Cable Pushdown", 2, 12, 60),
)
_LOWER = (
    _ex("Barbell Full Squat", 4, 6, 180),
    _ex("Barbell Romanian Deadlift", 3, 8),
    _ex("Dumbbell Lunge", 3, 10),
    _ex("Lever Seated Leg Curl", 3, 12, 60),
    _ex("Barbell Standing Calf Raise", 4, 12, 60),
)

PROGRAMS: dict[str, Program] = {
    p.slug: p
    for p in (
        Program(
            slug="ppl",
            name="Push / Pull / Legs",
            description="Six days a week, each muscle trained twice. Best with some training experience.",
            level="intermediate",
            days=(
                ProgramDay("Push A", 0, _PUSH),
                ProgramDay("Pull A", 1, _PULL),
                ProgramDay("Legs A", 2, _LEGS),
                ProgramDay("Push B", 3, _PUSH),
                ProgramDay("Pull B", 4, _PULL),
                ProgramDay("Legs B", 5, _LEGS),
            ),
        ),
        Program(
            slug="upper-lower",
            name="Upper / Lower",
            description="Four days a week alternating upper and lower body.",
            level="beginner",
            days=(
                ProgramDay("Upper A", 0, _UPPER),
                ProgramDay("Lower A", 1, _LOWER),
                ProgramDay("Upper B", 3, _UPPER),
                ProgramDay("Lower B", 4, _LOWER),
            ),
        ),
        Program(
            slug="five-by-five",
            name="5x5 Strength",
            description="Three days a week of heavy compound lifts, alternating two workouts.",
            level="beginner",
            days=(
                ProgramDay(
                    "Workout A",
                    0,
                    (
                        _ex("Barbell Full Squat", 5, 5, 180),
                        _ex("Barbell Bench Press", 5, 5, 180),
                        _ex("Barbell Bent Over Row", 5, 5, 180),
                    ),
                ),
                ProgramDay(
                    "Workout B",
                    2,
                    (
                        _ex("Barbell Full Squat", 5, 5, 180),
                        _ex("Barbell Seated Overhead Press", 5, 5, 180),
                        _ex("Barbell Deadlift", 1, 5, 240),
                    ),
                ),
                ProgramDay(
                    "Workout A",
                    4,
                    (
                        _ex("Barbell Full Squat", 5, 5, 180),
                        _ex("Barbell Bench Press", 5, 5, 180),
                        _ex("Barbell Bent Over Row", 5, 5, 180),
                    ),
                ),
            ),
        ),
        Program(
            slug="five-three-one",
            name="5/3/1 (simplified)",
            description="Four days a week, one main lift each day with accessory work.",
            level="intermediate",
            days=(
                ProgramDay(
                    "Overhead Press",
                    0,
                    (
                        _ex("Barbell Seated Overhead Press", 3, 5, 180),
                        _ex("Cable Pulldown", 3, 10),
                        _ex("Cable Pushdown", 3, 12, 60),
                    ),
                ),
                ProgramDay(
                    "Deadlift",
                    1,
                    (
                        _ex("Barbell Deadlift", 3, 5, 240),
                        _ex("Lever Seated Leg Curl", 3, 12, 60),
                        _ex("Hanging Leg Raise", 3, 10, 60),
                    ),
                ),
                ProgramDay(
                    "Bench Press",
                    3,
                    (
                        _ex("Barbell Bench Press", 3, 5, 180),
                        _ex("Barbell Bent Over Row", 3, 10),
                        _ex("Barbell Curl", 3, 12, 60),
                    ),
                ),
                ProgramDay(
                    "Squat",
                    4,
                    (
                        _ex("Barbell Full Squat", 3, 5, 240),
                        _ex("Lever Leg Extension", 3, 12, 60),
                        _ex("Barbell Standing Calf Raise", 3, 12, 60),
                    ),
                ),
            ),
        ),
        Program(
            slug="full-body",
            name="Full Body 3x",
            description="Three full-body sessions a week. A simple start that fits a busy schedule.",
            level="beginner",
            days=tuple(
                ProgramDay(
                    f"Full Body {label}",
                    offset,
                    (
                        _ex("Barbell Full Squat", 3, 8, 150),
                        _ex("Dumbbell Bench Press", 3, 10),
                        _ex("Cable Seated Row", 3, 10),
                        _ex("Dumbbell Seated Shoulder Press", 2, 10),
                        _ex("Hanging Leg Raise", 2, 10, 60),
                    ),
                )
                for label, offset in (("A", 0), ("B", 2), ("C", 4))
            ),
        ),
    )
}
