from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.body import BodyWeight, BodyWeightUpsert
from app.services import body as body_service
from app.services import user as user_service

router = APIRouter(prefix="/api/body", tags=["Body"])


@router.get("/weights", response_model=list[BodyWeight])
def get_body_weights(
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
    return body_service.get_body_weights(db, user.id, start, end)


@router.put("/weights", response_model=BodyWeight)
def upsert_body_weight(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    weight_in: BodyWeightUpsert,
):
    return body_service.upsert_body_weight(db, user.id, weight_in)


@router.delete("/weights/{entry_id}")
def delete_body_weight(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    entry_id: int,
):
    deleted_id = body_service.delete_body_weight(db, user.id, entry_id)
    if deleted_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found."
        )
    return deleted_id
