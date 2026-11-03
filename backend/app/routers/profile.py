from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.profile import Profile, ProfileUpdate
from app.services import profile as profile_service
from app.services import user as user_service

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", response_model=Profile)
def get_profile(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return profile_service.get_or_create_profile(db, user.id)


@router.patch("", response_model=Profile)
def update_profile(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    profile_in: ProfileUpdate,
):
    return profile_service.update_profile(db, user.id, profile_in)
