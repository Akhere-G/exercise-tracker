from fastapi import APIRouter, Depends, HTTPException, status
from app.models import User
from app.schemas.workout import Workout, WorkoutCreate, WorkoutUpdate, WorkoutSet
from typing import Annotated
from app.database import get_db
from app.services import (
    user as user_service,
    workout as workout_service,
    routine as routine_service,
    demo as demo_service,
    exercise as exercise_service,
)
from sqlalchemy.orm import Session
from typing import Optional, List

router = APIRouter(prefix="/api/workouts", tags=["Workout"])


@router.get("/stats")
def get_workouts_stats(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    routineId: Optional[int] = None,
):
    return workout_service.get_stats(db, user.id, routineId)


@router.get("", response_model=List[Workout])
def get_workouts(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    routineId: Optional[int] = None,
):
    return workout_service.get_workouts(db, user.id, routineId)


@router.get("/previous/{exercise_id}", response_model=List[WorkoutSet])
def get_previous_workout(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    exercise_id: int,
):
    return workout_service.get_previous_workouts(db, user.id, exercise_id)


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
    if demo_service.is_quota_exceeded(db, user)["workouts"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts are limited in size. Create an account to log more.",
        )

    if workout_in.routine_id:
        routine = routine_service.get_routine(db, user.id, workout_in.routine_id)

        if not routine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found."
            )

    exercise_service.ensure_exercises_exist(db, (s.exercise_id for s in workout_in.sets))

    workout = workout_service.create_workout(db, user.id, workout_in)
    return workout


@router.patch("/{workout_id}", response_model=Workout)
def update_workout(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    workout_in: WorkoutUpdate,
    workout_id: int,
):
    if workout_in.sets is not None:
        exercise_service.ensure_exercises_exist(
            db, (s.exercise_id for s in workout_in.sets)
        )

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
