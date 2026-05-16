from fastapi import APIRouter, Depends, HTTPException, status
from ..services import user as user_service, routines as routine_service
from typing import Annotated
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.routine import RoutineCreate, Routine, RoutineUpdate
from ..models import User

router = APIRouter(prefix="/api/routines", tags=["Routines"])


@router.get("")
def get_routines(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Session = Depends(get_db),
):
    return routine_service.get_routines(user.id, db)


@router.get("/{routine_id}")
def get_routine(
    user: Annotated[User, Depends(user_service.get_current_user)],
    routine_id: int,
    db: Session = Depends(get_db),
):
    routine = routine_service.get_routine(user.id, db, routine_id)
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
        user.id,
        db,
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
        user.id,
        routine_id,
        db,
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
        user.id,
        routine_id,
        db,
    )

    if not deleted_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found."
        )

    return deleted_id
