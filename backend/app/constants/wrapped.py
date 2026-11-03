# Largest first, so the first unit a volume reaches is the most impressive one.
EQUIVALENCES: tuple[tuple[str, float], ...] = (
    ("elephants", 6_000),
    ("cars", 1_500),
    ("grand pianos", 300),
)

# (label, first local hour of the bucket); the last bucket wraps past midnight.
TIMES_OF_DAY: tuple[tuple[str, int], ...] = (
    ("night", 0),
    ("morning", 5),
    ("afternoon", 12),
    ("evening", 17),
    ("night", 21),
)
