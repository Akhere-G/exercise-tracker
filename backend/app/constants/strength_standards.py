"""One-rep-max targets as multiples of body weight, for men.

Thresholds are the lower bound of each level. They are rough population
guidelines, not measurements. Women use FEMALE_FACTOR and anyone who has not
said use the midpoint.
"""

LEVELS = ["beginner", "novice", "intermediate", "advanced", "elite"]

FEMALE_FACTOR = 0.65
OTHER_FACTOR = (1 + FEMALE_FACTOR) / 2

# Exercise names from the exercise data.
STANDARD_LIFTS: dict[str, dict] = {
    "bench": {
        "name": "Barbell Bench Press",
        "multiples": [0.5, 0.75, 1.25, 1.75, 2.0],
    },
    "squat": {
        "name": "Barbell Full Squat",
        "multiples": [0.75, 1.25, 1.5, 2.25, 2.75],
    },
    "deadlift": {
        "name": "Barbell Deadlift",
        "multiples": [1.0, 1.5, 2.0, 2.75, 3.5],
    },
    "overhead_press": {
        "name": "Barbell Seated Overhead Press",
        "multiples": [0.35, 0.55, 0.8, 1.1, 1.4],
    },
    "row": {
        "name": "Barbell Bent Over Row",
        "multiples": [0.5, 0.75, 1.0, 1.5, 1.75],
    },
}


def sex_factor(sex: str | None) -> float:
    if sex == "male":
        return 1.0
    if sex == "female":
        return FEMALE_FACTOR
    return OTHER_FACTOR
