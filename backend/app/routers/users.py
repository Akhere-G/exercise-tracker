from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.schemas.user import User, UserCreate, UserLogin
from app.database import get_db
from sqlalchemy.orm import Session
from app.services import user as user_service
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/api/auth", tags=["Users"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    exisiting_user = user_service.get_user_by_email(db, email=user_in.email)
    if exisiting_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = user_service.create_user(db, user_in)
    return user_service.get_access_token(user.email)


@router.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = user_service.get_user_by_email(db, email=form_data.username)

    if not user or not user_service.check_password_hash(
        form_data.password, user.password_hash
    ):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    return user_service.get_access_token(user.email)


@router.post("/login", status_code=status.HTTP_200_OK)
def login_user(user_in: UserLogin, db: Session = Depends(get_db)):
    exisiting_user = user_service.get_user_by_email(db, email=user_in.email)
    if not exisiting_user or not user_service.check_password_hash(
        user_in.password, exisiting_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password or email",
        )
    return user_service.get_access_token(exisiting_user.email)


@router.get("/me")
def check_auth(user: Annotated[User, Depends(user_service.get_current_user)]):
    return user
