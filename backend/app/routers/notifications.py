from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas.notification import NotificationBase as Notification
from ..schemas.notification import SubscriptionCreate
from ..services import notification as notification_service
from ..services import user as user_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[Notification])
def get_notifications_route(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return notification_service.get_notifications(db, user.id)


@router.patch("/{notification_id}/read", response_model=Notification)
def read_notification(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    notification_id: int,
):
    notification = notification_service.read_notifications(db, user.id, notification_id)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found."
        )

    return notification


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
def save_subscription_route(
    sub: SubscriptionCreate,
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    if user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Notifications are disabled in demo mode.",
        )

    notification_service.save_subscription(
        db=db,
        user_id=user.id,
        endpoint=sub.endpoint,
        p256dh=sub.keys.p256dh,
        auth=sub.keys.auth,
    )

    return {"status": "ok"}
