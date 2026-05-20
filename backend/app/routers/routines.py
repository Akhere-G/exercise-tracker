from fastapi import APIRouter, Depends, HTTPException, status
from ..services import routine as routine_service, user as user_service
from typing import Annotated
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.routine import RoutineCreate, Routine, RoutineUpdate
from ..models import User
from typing import List


router = APIRouter(prefix="/api/routines", tags=["Routines"])


@router.get("", response_model=List[Routine])
def get_routines(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Session = Depends(get_db),
):
    return routine_service.get_routines(db, user.id)


@router.get("/{routine_id}", response_model=Routine)
def get_routine(
    user: Annotated[User, Depends(user_service.get_current_user)],
    routine_id: int,
    db: Session = Depends(get_db),
):
    routine = routine_service.get_routine(db, user.id, routine_id)
    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found"
        )
    return routine


@router.post("", status_code=status.HTTP_201_CREATED, response_model=Routine)
def create_routine(
    user: Annotated[User, Depends(user_service.get_current_user)],
    routine: RoutineCreate,
    db: Session = Depends(get_db),
):
    new_routine = routine_service.create_routine(
        db,
        user.id,
        routine,
    )

    return new_routine


@router.patch("/{routine_id}", response_model=Routine)
def update_routine(
    user: Annotated[User, Depends(user_service.get_current_user)],
    routine: RoutineUpdate,
    routine_id: int,
    db: Session = Depends(get_db),
):
    new_routine = routine_service.update_routine(
        db,
        user.id,
        routine_id,
        routine,
    )

    if not new_routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found."
        )

    return new_routine


@router.delete("/{routine_id}")
def delete_routine(
    user: Annotated[User, Depends(user_service.get_current_user)],
    routine_id: int,
    db: Session = Depends(get_db),
):
    deleted_id = routine_service.delete_routine(
        db,
        user.id,
        routine_id,
    )

    if not deleted_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found."
        )

    return deleted_id
