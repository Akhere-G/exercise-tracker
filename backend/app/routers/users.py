from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.schemas.user import User, UserCreate, UserLogin
from app.database import get_db
from app.limiter import limiter
from sqlalchemy.orm import Session
from app.services import demo as demo_service
from app.services import user as user_service
import os
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/api/auth", tags=["Users"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
def register_user(
    request: Request, user_in: UserCreate, db: Session = Depends(get_db)
):
    existing_user = user_service.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = user_service.create_user(db, user_in)
    return user_service.get_access_token(user.email)


@router.post("/token")
@limiter.limit("10/15 minutes")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = user_service.get_user_by_email(db, email=form_data.username)

    if not user or not user_service.check_password_hash(
        form_data.password, user.password_hash
    ):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    return user_service.get_access_token(user.email)


@router.post("/login", status_code=status.HTTP_200_OK)
@limiter.limit("10/15 minutes")
def login_user(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    existing_user = user_service.get_user_by_email(db, email=user_in.email)
    if not existing_user or not user_service.check_password_hash(
        user_in.password, existing_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password or email",
        )
    return user_service.get_access_token(existing_user.email)


@router.get("/me")
def check_auth(user: Annotated[User, Depends(user_service.get_current_user)]):
    return user


@router.post("/demo", status_code=status.HTTP_200_OK)
@limiter.limit("30/minute")
def demo_login(request: Request, db: Annotated[Session, Depends(get_db)]):
    if os.getenv("DEMO_MODE_ENABLED", "").lower() != "true":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    demo_user = demo_service.get_demo_user(db)
    if demo_user is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demo is temporarily unavailable.",
        )
    return user_service.get_demo_access_token(demo_user)
