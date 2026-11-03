from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.exercise import Exercise, RankedExercise
from app.schemas.profile import ExerciseSetting, ExerciseSettingUpdate
from app.schemas.workout import WorkoutSetWithDate
from app.services import exercise as exercise_service
from app.services import profile as profile_service
from app.services import user as user_service


router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


@router.get("", response_model=list[RankedExercise])
def get_exercises(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    equipment: Optional[str] = None,
    muscle: Optional[str] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    return exercise_service.get_exercises(
        db, user.id, search, equipment, muscle, page, limit
    )


@router.get("/settings", response_model=list[ExerciseSetting])
def get_exercise_settings(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Session = Depends(get_db),
):
    return profile_service.get_exercise_settings(db, user.id)


@router.put("/{exercise_id}/settings", response_model=ExerciseSetting)
def update_exercise_setting(
    user: Annotated[User, Depends(user_service.get_current_user)],
    exercise_id: int,
    setting_in: ExerciseSettingUpdate,
    db: Session = Depends(get_db),
):
    exercise_service.ensure_exercises_exist(db, [exercise_id])
    return profile_service.upsert_exercise_setting(
        db, user.id, exercise_id, setting_in
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
