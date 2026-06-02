from fastapi import APIRouter, Depends, HTTPException, status
from app.models import User
from app.schemas.workout import Workout, WorkoutCreate, WorkoutUpdate
from typing import Annotated
from app.database import get_db
from app.services import (
    user as user_service,
    workout as workout_service,
    routine as routine_service,
)
from sqlalchemy.orm import Session
from typing import Optional, List

router = APIRouter(prefix="/api/workouts", tags=["Workout"])


@router.get("/stats")
def get_workouts_stats(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    routine_id: Optional[int] = None,
):
    return workout_service.get_stats(db, user.id, routine_id)


@router.get("", response_model=List[Workout])
def get_workouts(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    routine_id: Optional[int] = None,
):
    return workout_service.get_workouts(db, user.id, routine_id)


@router.get("/{workout_id}", response_model=Workout)
def get_workout(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    workout_id: int,
):
    workout = workout_service.get_workout(db, user.id, workout_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found."
        )
    return workout


@router.post("", status_code=status.HTTP_201_CREATED, response_model=Workout)
def create_workout(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    workout_in: WorkoutCreate,
):
    routine = routine_service.get_routine(db, user.id, workout_in.routine_id)

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found."
        )

    workout = workout_service.create_workout(db, workout_in)
    return workout


@router.patch("/{workout_id}", response_model=Workout)
def update_workout(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    workout_in: WorkoutUpdate,
    workout_id: int,
):
    workout = workout_service.update_workout(db, user.id, workout_id, workout_in)

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found."
        )

    return workout


@router.delete("/{workout_id}")
def delete_workout(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    workout_id: int,
):
    deleted_id = workout_service.delete_workout(db, user.id, workout_id)

    if not deleted_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found."
        )

    return deleted_id
