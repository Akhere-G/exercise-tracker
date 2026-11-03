from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.constants.personas import PERSONAS
from app.database import get_db
from app.exceptions import AIUnavailable
from app.limiter import limiter
from app.models import User
from app.schemas.ai import BuildRoutineRequest, RoutinePreview
from app.schemas.progression import PersonaOut
from app.services import ai_builder
from app.services import user as user_service

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.get("/personas", response_model=list[PersonaOut])
def list_personas(_: Annotated[User, Depends(user_service.get_current_user)]):
    return list(PERSONAS.values())


@router.post("/build-routine", response_model=RoutinePreview)
@limiter.limit("10/hour")
def build_routine(
    request: Request,
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    build_in: BuildRoutineRequest,
):
    if user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts cannot use the AI coach. Create an account to continue.",
        )
    try:
        return ai_builder.build_routines(db, user.id, build_in)
    except AIUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The coach is unavailable right now. Try again, or pick a prebuilt program.",
        )
