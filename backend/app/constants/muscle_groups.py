"""Groups the 40 or so muscle names in the exercise data into the usual training groups."""

MUSCLE_GROUPS: dict[str, str] = {
    "chest": "chest",
    "upper chest": "chest",
    "back": "back",
    "latissimus dorsi": "back",
    "lats": "back",
    "rhomboids": "back",
    "trapezius": "back",
    "traps": "back",
    "upper back": "back",
    "lower back": "back",
    "deltoids": "shoulders",
    "shoulders": "shoulders",
    "rear deltoids": "shoulders",
    "rotator cuff": "shoulders",
    "biceps": "biceps",
    "brachialis": "biceps",
    "triceps": "triceps",
    "forearms": "forearms",
    "wrist extensors": "forearms",
    "wrist flexors": "forearms",
    "wrists": "forearms",
    "grip muscles": "forearms",
    "quadriceps": "quads",
    "hamstrings": "hamstrings",
    "glutes": "glutes",
    "calves": "calves",
    "soleus": "calves",
    "shins": "calves",
    "abdominals": "core",
    "core": "core",
    "lower abs": "core",
    "obliques": "core",
}

GROUPS = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "forearms",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "core",
]

# Hours for fatigue from a hard set to halve: bigger muscles recover more slowly.
RECOVERY_HALF_LIFE_HOURS: dict[str, float] = {
    "chest": 48,
    "back": 48,
    "quads": 48,
    "hamstrings": 48,
    "glutes": 48,
    "shoulders": 36,
    "biceps": 36,
    "triceps": 36,
    "forearms": 24,
    "calves": 24,
    "core": 24,
}


def group_for_muscle(name: str) -> str | None:
    return MUSCLE_GROUPS.get(name.lower().strip())
