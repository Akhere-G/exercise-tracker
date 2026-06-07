from fastapi import APIRouter, Depends, HTTPException, status
from app.services import exercise as exercise_service
from app.services import user as user_service
from app.models import User
from app.database import get_db
from sqlalchemy.orm import Session
from typing import Optional, Annotated
from app.schemas.exercise import Exercise
from app.schemas.workout import WorkoutSetWithDate
from typing import List

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


@router.get("", response_model=List[Exercise])
def get_exercises(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    equipment: Optional[str] = None,
    muscle: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    return exercise_service.get_exercises(db, search, equipment, muscle, page, limit)


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


@router.get("/{exercise_id}/workouts", response_model=List[WorkoutSetWithDate])
def get_exercise_workouts(
    user: Annotated[User, Depends(user_service.get_current_user)],
    exercise_id: int,
    db: Session = Depends(get_db),
):
    workouts = exercise_service.get_workouts(db, user.id, exercise_id)

    print(workouts)
    print(workouts[0])

    return workouts
