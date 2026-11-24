from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.routers.params import parse_id_list
from app.schemas.progression import DeloadAssessment, ProgressionSuggestion
from app.services import deload as deload_service
from app.services import progression as progression_service
from app.services import user as user_service

router = APIRouter(prefix="/api/progression", tags=["Progression"])


@router.get("", response_model=list[ProgressionSuggestion])
def get_progression(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    exerciseIds: Annotated[str, Query(max_length=1000)] = "",  # noqa: N803
):
    exercise_ids = parse_id_list(exerciseIds, "exerciseIds")
    return progression_service.get_suggestions(db, user.id, exercise_ids)


@router.get("/deload", response_model=DeloadAssessment)
def get_deload_assessment(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return deload_service.assess_deload(db, user.id)


@router.post("/deload/ack", status_code=status.HTTP_204_NO_CONTENT)
def acknowledge_deload(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    deload_service.acknowledge_deload(db, user.id)
