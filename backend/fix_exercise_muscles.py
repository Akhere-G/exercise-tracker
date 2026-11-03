import json
import re
import sys
from collections import Counter
from typing import Any, Dict, List, Set, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.exercise import Exercise
from app.models.exercise_muscle import ExerciseMuscle
from app.models.muscle import Muscle

Contribution = Tuple[str, str]  # (muscle name, "primary" | "secondary")

# exercises.json `muscle_group` / `secondary_muscles` are unreliable, but `target` is correct.
TARGET_TO_MUSCLE: Dict[str, str] = {
    "abs": "Abdominals",
    "pectorals": "Chest",
    "biceps": "Biceps",
    "triceps": "Triceps",
    "delts": "Deltoids",
    "glutes": "Glutes",
    "lats": "Lats",
    "upper back": "Upper Back",
    "traps": "Traps",
    "quads": "Quadriceps",
    "hamstrings": "Hamstrings",
    "calves": "Calves",
    "forearms": "Forearms",
    "spine": "Lower Back",
    "adductors": "Inner Thighs",
    "abductors": "Glutes",
    "serratus anterior": "Core",
    "levator scapulae": "Traps",
}

# (name regex, name exclude regex, targets the rule applies to (empty = any), secondary muscles)
KeywordRule = Tuple[str, str, Set[str], List[str]]

KEYWORD_RULES: List[KeywordRule] = [
    # Arms
    (r"\bcurl", r"\bleg\b|wrist|hamstring|nordic", {"biceps", "forearms"},
     ["Biceps", "Brachialis", "Forearms"]),
    (r"wrist curl", r"reverse", set(), ["Wrist Flexors", "Forearms"]),
    (r"reverse wrist curl|wrist extension", "", set(), ["Wrist Extensors", "Forearms"]),
    (r"pushdown|push-down|kickback|skull|overhead extension", "", {"triceps"},
     ["Triceps"]),
    (r"close-grip|close grip|\bdip\b|\bdips\b", "", {"triceps", "pectorals"},
     ["Triceps", "Chest", "Shoulders"]),
    # Back
    (r"pull-up|pullup|chin-up|chinup|pulldown|pull-down|pull down", "", {"lats"},
     ["Lats", "Biceps", "Brachialis", "Rhomboids", "Rear Deltoids", "Forearms", "Grip Muscles"]),
    (r"\brow\b|\brows\b", "", {"upper back", "lats"},
     ["Lats", "Biceps", "Rhomboids", "Rear Deltoids", "Forearms", "Traps"]),
    (r"shrug", "", set(), ["Traps", "Upper Back", "Forearms", "Grip Muscles"]),
    # Chest
    (r".*", "", {"pectorals"}, ["Triceps", "Shoulders"]),
    (r"incline", "", {"pectorals"}, ["Upper Chest"]),
    # Shoulders
    (r".*", "", {"delts"}, ["Shoulders"]),
    (r"press", "", {"delts"}, ["Triceps", "Upper Chest", "Traps"]),
    (r"raise|shrug", "press", {"delts"}, ["Traps"]),
    (r"reverse fly|rear delt|reverse flye|face pull", "", set(),
     ["Rear Deltoids", "Rhomboids", "Traps"]),
    # Legs / glutes
    (r"squat|leg press|lunge|step-up|step up|hack", "", {"glutes", "quads", "hamstrings"},
     ["Quadriceps", "Glutes", "Hamstrings", "Calves"]),
    (r"deadlift|good morning|hip thrust|bridge|hip extension|romanian", "",
     {"glutes", "hamstrings", "spine"}, ["Glutes", "Hamstrings", "Lower Back"]),
    (r"deadlift", "", set(), ["Quadriceps", "Traps", "Forearms", "Grip Muscles", "Core"]),
    (r"leg curl|hamstring curl", "", set(), ["Hamstrings", "Calves"]),
    (r"abduction", "", set(), ["Glutes"]),
    (r"adduction", "", set(), ["Inner Thighs"]),
    (r"calf|calves", "", {"calves"}, ["Calves", "Soleus"]),
    # Core
    (r".*", "", {"abs"}, ["Core"]),
    (r"leg raise|knee raise|hip raise|knee tuck|reverse crunch", "", {"abs"},
     ["Lower Abs", "Hip Flexors"]),
    (r"oblique|twist|side bend|side crunch|woodchop|wood chop", "", {"abs"},
     ["Obliques"]),
    (r"plank", "", {"abs"}, ["Obliques", "Shoulders"]),
    (r"back extension|hyperextension", "", {"spine"}, ["Glutes", "Hamstrings"]),
]

# Exercises that need more than the rules infer. Applied first, so these win on contribution type.
MANUAL_FIXES: Dict[int, List[Contribution]] = {
    32: [("Glutes", "primary"), ("Quadriceps", "secondary"), ("Traps", "secondary"),
         ("Forearms", "secondary"), ("Grip Muscles", "secondary"), ("Core", "secondary")],
    43: [("Glutes", "primary"), ("Lower Back", "secondary")],
    50: [("Shoulders", "secondary"), ("Upper Chest", "secondary"), ("Core", "secondary")],
    58: [("Glutes", "primary"), ("Lower Back", "secondary")],
    586: [("Hamstrings", "primary"), ("Glutes", "secondary")],
    597: [("Hip Flexors", "secondary")],
    602: [("Rear Deltoids", "primary"), ("Deltoids", "secondary")],
    2311: [("Core", "secondary"), ("Soleus", "secondary")],
    3666: [("Glutes", "secondary"), ("Core", "secondary"), ("Soleus", "secondary")],
}


def matching_keyword_muscles(name: str, target: str) -> List[str]:
    muscles: List[str] = []
    for pattern, exclude, targets, rule_muscles in KEYWORD_RULES:
        if targets and target not in targets:
            continue
        if not re.search(pattern, name):
            continue
        if exclude and re.search(exclude, name):
            continue
        muscles.extend(rule_muscles)
    return muscles


def planned_contributions(item: Dict[str, Any]) -> List[Contribution]:
    ex_id = int(item["id"])
    name = item["name"].strip().lower()
    target = item.get("target", "").strip().lower()

    planned: List[Contribution] = list(MANUAL_FIXES.get(ex_id, []))

    target_muscle = TARGET_TO_MUSCLE.get(target)
    if target_muscle:
        planned.append((target_muscle, "primary"))

    planned.extend((m, "secondary") for m in matching_keyword_muscles(name, target))
    return planned


def fix_exercise_muscles(
    session: Session, data: List[Dict[str, Any]], dry_run: bool
) -> None:
    muscle_ids = {m.name: m.id for m in session.execute(select(Muscle)).scalars()}
    exercise_ids = set(session.execute(select(Exercise.id)).scalars())
    existing = {
        (em.exercise_id, em.muscle_id)
        for em in session.execute(select(ExerciseMuscle)).scalars()
    }

    inserted: Counter = Counter()
    for item in data:
        ex_id = int(item["id"])
        if ex_id not in exercise_ids:
            continue

        for muscle_name, contribution_type in planned_contributions(item):
            if muscle_name not in muscle_ids:
                raise ValueError(f"Muscle '{muscle_name}' does not exist in the database")

            key = (ex_id, muscle_ids[muscle_name])
            if key in existing:
                continue

            existing.add(key)
            inserted[contribution_type] += 1
            if dry_run:
                print(f"{ex_id:>5} {item['name']}: + {muscle_name} ({contribution_type})")
            else:
                session.add(
                    ExerciseMuscle(
                        exercise_id=ex_id,
                        muscle_id=muscle_ids[muscle_name],
                        contribution_type=contribution_type,
                    )
                )

    print(
        f"{'Would add' if dry_run else 'Added'} {sum(inserted.values())} exercise_muscles "
        f"({inserted['primary']} primary, {inserted['secondary']} secondary)"
    )


def main(filepath: str = "./exercises.json") -> None:
    dry_run = "--dry-run" in sys.argv

    with open(filepath, "r", encoding="utf-8") as jsonfile:
        data = json.load(jsonfile)

    session = SessionLocal()
    try:
        fix_exercise_muscles(session, data, dry_run)
        if dry_run:
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        print(f"Fixing exercise muscles failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
