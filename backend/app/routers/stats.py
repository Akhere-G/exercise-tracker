from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.stats import Stats
from app.services import stats as stats_service
from app.services import user as user_service

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("", response_model=Stats)
def get_stats(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    start: Optional[date] = None,
    end: Optional[date] = None,
):
    if start and end and end < start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="end must not be before start.",
        )
    return stats_service.get_stats(db, user.id, start, end)
