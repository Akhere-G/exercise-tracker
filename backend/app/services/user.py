from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.user import Token, UserCreate

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
DEMO_TOKEN_TTL = timedelta(hours=2)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError as error:
        raise credentials_exception from error

    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def check_password_hash(password: str, hash: str) -> bool:
    return pwd_context.verify(password, hash)


def get_user(db: Session, user_id: int):
    query = select(User).where(User.id == user_id)
    return db.execute(query).scalars().first()


def get_user_by_email(db: Session, email: str):
    query = select(User).where(func.lower(User.email) == email.strip().lower())
    return db.execute(query).scalars().first()


def create_user(db: Session, user_in: UserCreate):
    try:
        hashed_password = get_password_hash(user_in.password)

        user = User(
            username=user_in.username,
            email=user_in.email,
            password_hash=hashed_password,
        )

        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception:
        db.rollback()
        raise


def get_access_token(email: str):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": email}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


def get_demo_access_token(user: User):
    access_token = create_access_token(
        data={"sub": user.email, "demo": True}, expires_delta=DEMO_TOKEN_TTL
    )
    return Token(access_token=access_token, token_type="bearer")
