from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.progression import ProgressionSuggestion
from app.services import progression as progression_service
from app.services import user as user_service

router = APIRouter(prefix="/api/progression", tags=["Progression"])


@router.get("", response_model=list[ProgressionSuggestion])
def get_progression(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    exerciseIds: Annotated[str, Query(max_length=1000)] = "",
):
    try:
        exercise_ids = [int(i) for i in exerciseIds.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="exerciseIds must be a comma-separated list of integers.",
        )
    return progression_service.get_suggestions(db, user.id, exercise_ids)
