from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.constants.programs import PROGRAMS
from app.database import get_db
from app.models import User
from app.schemas.program import ProgramApply, ProgramOut
from app.schemas.routine import Routine
from app.services import program as program_service
from app.services import user as user_service

router = APIRouter(prefix="/api/programs", tags=["Programs"])


@router.get("", response_model=list[ProgramOut])
def list_programs(_: Annotated[User, Depends(user_service.get_current_user)]):
    return list(PROGRAMS.values())


@router.post(
    "/{slug}/apply",
    status_code=status.HTTP_201_CREATED,
    response_model=list[Routine],
)
def apply_program(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    slug: str,
    apply: ProgramApply,
):
    if user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts cannot add programs. Create an account to continue.",
        )
    program = program_service.get_program(slug)
    return program_service.apply_program(db, user.id, program, apply)
