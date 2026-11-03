from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.wrapped import Wrapped
from app.services import user as user_service
from app.services import wrapped as wrapped_service

router = APIRouter(prefix="/api/wrapped", tags=["Wrapped"])


@router.get("", response_model=Wrapped)
def get_wrapped(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    period: Literal["month", "year"] = "month",
    year: Annotated[Optional[int], Query(ge=2000, le=2100)] = None,
    month: Annotated[Optional[int], Query(ge=1, le=12)] = None,
):
    return wrapped_service.get_wrapped(db, user.id, period, year, month)
