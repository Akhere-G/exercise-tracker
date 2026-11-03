"""Analytics calculations behind the stats endpoints."""

from .common import estimate_one_rep_max
from .compare import compare_exercises, compare_periods
from .consistency import get_consistency
from .muscles import get_muscle_volume, get_recovery
from .strength import get_strength_standards

__all__ = [
    "compare_exercises",
    "compare_periods",
    "estimate_one_rep_max",
    "get_consistency",
    "get_muscle_volume",
    "get_recovery",
    "get_strength_standards",
]
