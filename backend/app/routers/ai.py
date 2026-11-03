from typing import Annotated

from fastapi import APIRouter, Depends

from app.constants.personas import PERSONAS
from app.models import User
from app.schemas.progression import PersonaOut
from app.services import user as user_service

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.get("/personas", response_model=list[PersonaOut])
def list_personas(_: Annotated[User, Depends(user_service.get_current_user)]):
    return list(PERSONAS.values())
