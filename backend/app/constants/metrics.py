"""The ways an exercise can be logged, and the routine targets each one allows."""

from dataclasses import dataclass

REPS = "reps"
REPS_WEIGHT = "reps+weight"
DURATION = "duration"
DURATION_DISTANCE = "duration+distance"

TARGET_REPS = "target_reps"
TARGET_WEIGHT = "target_weight"
TARGET_DURATION_SECS = "target_duration_secs"
TARGET_DISTANCE_METERS = "target_distance_meters"

TARGET_FIELDS = (
    TARGET_REPS,
    TARGET_WEIGHT,
    TARGET_DURATION_SECS,
    TARGET_DISTANCE_METERS,
)


@dataclass(frozen=True)
class TargetRules:
    required: tuple[str, ...]
    optional: tuple[str, ...] = ()

    @property
    def allowed(self) -> tuple[str, ...]:
        return self.required + self.optional


TARGET_RULES: dict[str, TargetRules] = {
    REPS: TargetRules(required=(TARGET_REPS,)),
    REPS_WEIGHT: TargetRules(required=(TARGET_REPS,), optional=(TARGET_WEIGHT,)),
    DURATION: TargetRules(required=(TARGET_DURATION_SECS,)),
    DURATION_DISTANCE: TargetRules(
        required=(TARGET_DURATION_SECS,), optional=(TARGET_DISTANCE_METERS,)
    ),
}
