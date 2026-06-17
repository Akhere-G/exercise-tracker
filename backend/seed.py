import json
from typing import Any, Dict, List, Set
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models.exercise import Exercise
from app.models.muscle import Muscle
from app.models.exercise_muscle import ExerciseMuscle


def infer_metrics(item: Dict[str, Any]) -> str:
    """Infers the metric type based on names, categories, and equipment."""
    name = item.get("name", "").lower()
    equipment = item.get("equipment", "").lower()
    category = item.get("category", "").lower()
    body_part = item.get("body_part", "").lower()

    distance_keywords = [
        "run",
        "walk",
        "stepmill",
        "treadmill",
        "cross trainer",
        "cycle",
        "elliptical",
    ]
    if (category == "cardio" or body_part == "cardio") and any(
        k in name for k in distance_keywords
    ):
        return "duration+distance"

    duration_keywords = ["plank", "hold", "stretch", "static", "hang"]
    if (
        category == "cardio"
        or body_part == "cardio"
        or any(k in name for k in duration_keywords)
    ):
        return "duration"

    return "reps" if equipment in ["body weight", "bodyweight"] else "reps+weight"


def seed_all_muscles(session: Session, data: List[Dict[str, Any]]) -> Dict[str, int]:
    """Pass 1: Extracts every unique muscle string and ensures it exists in the DB."""
    db_muscles_stmt = select(Muscle)
    db_muscles = session.execute(db_muscles_stmt).scalars().all()
    muscle_mapping = {m.name: m.id for m in db_muscles}

    json_muscles: Set[str] = set()
    for item in data:
        json_muscles.add(item["muscle_group"].strip().title())
        for secondary in item.get("secondary_muscles", []):
            json_muscles.add(secondary.strip().title())

    for muscle_name in json_muscles:
        if muscle_name not in muscle_mapping:
            new_muscle = Muscle(name=muscle_name)
            session.add(new_muscle)
            session.flush()
            muscle_mapping[muscle_name] = new_muscle.id

    return muscle_mapping


def seed_exercises_and_junctions(
    session: Session, data: List[Dict[str, Any]], muscle_mapping: Dict[str, int]
) -> None:
    """Pass 2: Safely inserts unique exercises and links their junction rows."""
    existing_exercises_stmt = select(Exercise.name)
    existing_exercises = set(session.execute(existing_exercises_stmt).scalars().all())

    seen_names: Set[str] = set()

    for item in data:
        ex_name = item["name"].strip().title()

        if ex_name in existing_exercises or ex_name in seen_names:
            continue

        seen_names.add(ex_name)
        ex_id = int(item["id"])

        new_exercise = Exercise(
            id=ex_id,
            name=ex_name,
            instructions=item["instructions"]["en"],
            image_url=item["image"],
            video_url=item["gif_url"],
            equipment=item["equipment"].replace(" ", ""),
            metrics=infer_metrics(item),
        )
        session.add(new_exercise)

        primary_name = item["muscle_group"].strip().title()

        if primary_name in muscle_mapping:
            m_id = muscle_mapping[primary_name]
            session.add(
                ExerciseMuscle(
                    exercise_id=ex_id, muscle_id=m_id, contribution_type="primary"
                )
            )

        for secondary_raw in item.get("secondary_muscles", []):
            secondary_name = secondary_raw.strip().title()

            if secondary_name == primary_name:
                continue

            m_id = muscle_mapping[secondary_name]
            session.add(
                ExerciseMuscle(
                    exercise_id=ex_id,
                    muscle_id=m_id,
                    contribution_type="secondary",
                )
            )


def seed_database(filepath: str = "./exercises.json") -> None:
    with open(filepath, "r", encoding="utf-8") as jsonfile:
        data = json.load(jsonfile)

    session = next(get_db())

    try:
        muscle_mapping = seed_all_muscles(session, data)

        seed_exercises_and_junctions(session, data, muscle_mapping)

        session.commit()
        print("Database successfully seeded!")

    except Exception as e:
        print(f"Seeding pipeline failed: {e}")
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
