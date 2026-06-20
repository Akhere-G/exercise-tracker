from sqlalchemy.orm import Session
from sqlalchemy import select
from ..models import Notification, NotificationSubscription


def get_notifications(db: Session, user_id: int):
    stmt = select(Notification).where(Notification.user_id == user_id)
    return db.execute(stmt).scalars()


def read_notifications(db: Session, user_id: int, notification_id: int):
    stmt = select(Notification).where(
        Notification.id == notification_id, Notification.user_id == user_id
    )
    notificaiton = db.execute(stmt).scalar_one_or_none()

    if not notificaiton:
        return None

    notificaiton.is_read = True

    db.commit()

    return notificaiton


def save_subscription(db: Session, user_id: int, endpoint: str, p256dh: str, auth: str):
    stmt = select(NotificationSubscription).where(
        NotificationSubscription.endpoint == endpoint
    )
    existing_sub = db.execute(stmt).scalar_one_or_none()

    if existing_sub:
        return existing_sub

    new_sub = NotificationSubscription(
        user_id=user_id, endpoint=endpoint, p256dh=p256dh, auth=auth
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return new_sub
