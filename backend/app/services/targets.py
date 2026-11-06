from collections.abc import Mapping

from app.constants.metrics import TARGET_FIELDS, TARGET_RULES

TARGET_LABELS = {
    "target_reps": "reps",
    "target_weight": "weight",
    "target_duration_secs": "duration",
    "target_distance_meters": "distance",
}


def _is_set(value: float | None) -> bool:
    return value is not None and value > 0


def applicable_targets(
    metrics: str, targets: Mapping[str, float | None]
) -> dict[str, float | None]:
    """The targets with every field the exercise type does not track set to None."""
    rules = TARGET_RULES.get(metrics)
    allowed = rules.allowed if rules else ()
    return {
        field: (targets.get(field) if field in allowed else None)
        for field in TARGET_FIELDS
    }


def find_target_problems(
    metrics: str, targets: Mapping[str, float | None]
) -> list[str]:
    """Why the targets do not fit an exercise of this type; empty when they fit."""
    rules = TARGET_RULES.get(metrics)
    if rules is None:
        return [f"Unknown exercise type '{metrics}'."]

    problems = []
    for field in rules.required:
        if not _is_set(targets.get(field)):
            problems.append(f"needs a target {TARGET_LABELS[field]}")
    for field in TARGET_FIELDS:
        if field not in rules.allowed and _is_set(targets.get(field)):
            problems.append(f"cannot have a target {TARGET_LABELS[field]}")
    return problems
