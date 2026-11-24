from fastapi import HTTPException, status


def parse_id_list(raw: str, param_name: str) -> list[int]:
    """Parse a comma separated query value such as "1,2,3" into integers.

    Blank entries are skipped, so "" gives an empty list. Anything that is
    not an integer is a 422 that names the query parameter.
    """
    exercise_ids: list[int] = []
    for raw_part in raw.split(","):
        part = raw_part.strip()
        if not part:
            continue
        try:
            exercise_ids.append(int(part))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"{param_name} must be a comma-separated list of integers.",
            ) from None
    return exercise_ids
