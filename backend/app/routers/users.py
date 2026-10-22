from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import User, UserCreate, UserLogin
from app.database import get_db
from sqlalchemy.orm import Session
from app.services import demo as demo_service
from app.services import user as user_service
import os
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/api/auth", tags=["Users"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = user_service.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = user_service.create_user(db, user_in)
    return user_service.get_access_token(user.email)


def _authenticate_or_401(db: Session, email: str, password: str):
    user = user_service.authenticate_user(db, email, password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """OAuth2 password flow, used by the Swagger "Authorize" button."""
    user = _authenticate_or_401(db, form_data.username, form_data.password)
    return user_service.get_access_token(user.email)


@router.post("/login", status_code=status.HTTP_200_OK)
def login_user(user_in: UserLogin, db: Session = Depends(get_db)):
    """JSON login, used by the frontend."""
    user = _authenticate_or_401(db, user_in.email, user_in.password)
    return user_service.get_access_token(user.email)


@router.get("/me")
def check_auth(user: Annotated[User, Depends(user_service.get_current_user)]):
    return user


@router.post("/demo", status_code=status.HTTP_200_OK)
def demo_login(db: Annotated[Session, Depends(get_db)]):
    if os.getenv("DEMO_MODE_ENABLED", "").lower() != "true":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    demo_user = demo_service.get_demo_user(db)
    if demo_user is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demo is temporarily unavailable.",
        )
    return user_service.get_demo_access_token(demo_user)
