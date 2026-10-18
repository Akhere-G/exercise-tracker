from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.exercise import Exercise, RankedExercise
from app.schemas.workout import WorkoutSetWithDate
from app.services import exercise as exercise_service
from app.services import user as user_service
from pprint import pprint


router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


@router.get("", response_model=list[RankedExercise])
def get_exercises(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    equipment: Optional[str] = None,
    muscle: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    return exercise_service.get_exercises(
        db, user.id, search, equipment, muscle, page, limit
    )


@router.get("/{exercise_id}", response_model=Exercise)
def get_exercise(
    user: Annotated[User, Depends(user_service.get_current_user)],
    exercise_id: int,
    db: Session = Depends(get_db),
):
    exercise = exercise_service.get_exercise(db, exercise_id)

    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found."
        )

    return exercise


@router.get("/{exercise_id}/workouts", response_model=list[WorkoutSetWithDate])
def get_exercise_workouts(
    user: Annotated[User, Depends(user_service.get_current_user)],
    exercise_id: int,
    db: Session = Depends(get_db),
):
    workouts = exercise_service.get_workouts(db, user.id, exercise_id)

    return workouts
