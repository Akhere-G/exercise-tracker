"""User-facing equipment choices, mapped to the equipment values in the exercise data."""

EQUIPMENT: dict[str, tuple[str, ...]] = {
    "bodyweight": ("body weight",),
    "dumbbells": ("dumbbell",),
    "barbell": ("barbell", "ez barbell", "olympic barbell", "trap bar"),
    "cables": ("cable",),
    "machines": ("leverage machine", "smith machine", "sled machine"),
    "kettlebell": ("kettlebell",),
    "bands": ("band", "resistance band"),
}
