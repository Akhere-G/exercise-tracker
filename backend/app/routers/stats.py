from datetime import date
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.stats import (
    Consistency,
    ExerciseSeries,
    MuscleRecovery,
    MuscleVolume,
    PeriodComparison,
    Stats,
    StrengthStandards,
)
from app.services import analytics as analytics_service
from app.services import stats as stats_service
from app.services import user as user_service

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("", response_model=Stats)
def get_stats(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    start: Optional[date] = None,
    end: Optional[date] = None,
    granularity: Literal["week", "month"] = "week",
):
    if start and end and end < start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end must not be before start.",
        )
    return stats_service.get_stats(db, user.id, start, end, granularity)


@router.get("/muscle-volume", response_model=MuscleVolume)
def get_muscle_volume(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    weeks: Annotated[int, Query(ge=1, le=26)] = 8,
):
    return analytics_service.get_muscle_volume(db, user.id, weeks)


@router.get("/recovery", response_model=list[MuscleRecovery])
def get_recovery(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return analytics_service.get_recovery(db, user.id)


@router.get("/strength-standards", response_model=StrengthStandards)
def get_strength_standards(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return analytics_service.get_strength_standards(db, user.id)


@router.get("/consistency", response_model=Consistency)
def get_consistency(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    year: Annotated[Optional[int], Query(ge=2000, le=2100)] = None,
):
    return analytics_service.get_consistency(db, user.id, year or date.today().year)


@router.get("/compare/periods", response_model=PeriodComparison)
def compare_periods(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    start: date,
    end: date,
):
    if end < start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end must not be before start.",
        )
    return analytics_service.compare_periods(db, user.id, start, end)


@router.get("/compare/exercises", response_model=list[ExerciseSeries])
def compare_exercises(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    ids: Annotated[str, Query(description="Comma separated exercise ids, up to 3.")],
    start: Optional[date] = None,
    end: Optional[date] = None,
):
    try:
        exercise_ids = [int(i) for i in ids.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="ids must be comma separated numbers.",
        )
    if not exercise_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Provide at least one exercise id.",
        )
    return analytics_service.compare_exercises(db, user.id, exercise_ids, start, end)
