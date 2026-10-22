from fastapi import APIRouter, Depends, HTTPException, Request, status
from app import rate_limit
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
def register_user(
    user_in: UserCreate, request: Request, db: Session = Depends(get_db)
):
    rate_limit.hit_ip_limit(
        rate_limit.REGISTER_BY_IP,
        request,
        "Too many sign-ups from this address. Try again later.",
    )

    already_registered = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="A user with this email address already exists.",
    )
    if user_service.get_user_by_email(db, email=user_in.email):
        raise already_registered

    try:
        user = user_service.create_user(db, user_in)
    except user_service.EmailAlreadyRegisteredError:
        raise already_registered
    return user_service.get_access_token(user.email)


def _authenticate_or_401(request: Request, db: Session, email: str, password: str):
    ip = rate_limit.client_ip(request)
    by_pair = rate_limit.LOGIN_FAILURES_BY_IP_AND_EMAIL
    by_ip = rate_limit.LOGIN_FAILURES_BY_IP
    pair_key = f"{ip}|{email.strip().lower()}"

    checks = [(by_pair, pair_key)]
    if rate_limit.ip_limits_enabled():
        checks.append((by_ip, ip))
    for counter, key in checks:
        if counter.is_limited(key):
            raise rate_limit.too_many_requests(
                counter.retry_after(key),
                "Too many failed login attempts. Try again later.",
            )

    user = user_service.authenticate_user(db, email, password)
    if user is None:
        by_pair.record(pair_key)
        if rate_limit.ip_limits_enabled():
            by_ip.record(ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    by_pair.reset(pair_key)
    return user


@router.post("/token")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 password flow, used by the Swagger "Authorize" button."""
    user = _authenticate_or_401(request, db, form_data.username, form_data.password)
    return user_service.get_access_token(user.email)


@router.post("/login", status_code=status.HTTP_200_OK)
def login_user(user_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    """JSON login, used by the frontend."""
    user = _authenticate_or_401(request, db, user_in.email, user_in.password)
    return user_service.get_access_token(user.email)


@router.get("/me")
def check_auth(user: Annotated[User, Depends(user_service.get_current_user)]):
    return user


@router.post("/demo", status_code=status.HTTP_200_OK)
def demo_login(request: Request, db: Annotated[Session, Depends(get_db)]):
    if os.getenv("DEMO_MODE_ENABLED", "").lower() != "true":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    rate_limit.hit_ip_limit(
        rate_limit.DEMO_BY_IP,
        request,
        "Too many demo requests. Try again shortly.",
    )

    demo_user = demo_service.get_demo_user(db)
    if demo_user is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demo is temporarily unavailable.",
        )
    return user_service.get_demo_access_token(demo_user)
