import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, time, timedelta

from pywebpush import WebPushException, webpush
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import Notification, NotificationSubscription, Routine, User

logger = logging.getLogger(__name__)

# How far ahead of a routine's start time its reminder goes out.
REMINDER_LEAD = timedelta(hours=1)
# A routine is weekly, so one reminder per routine within this period is enough.
# It also stops an hourly job and a manual re-run from sending the same one twice.
REMINDER_COOLDOWN = timedelta(hours=12)

# Push services answer 404 or 410 when a subscription has been revoked.
GONE_STATUS_CODES = (404, 410)

START_OF_DAY = time.min.replace(tzinfo=UTC)
END_OF_DAY = time.max.replace(tzinfo=UTC)


@dataclass(frozen=True)
class ReminderWindow:
    """Routines on this weekday starting between these two UTC times get a reminder."""

    weekday: int
    earliest: time
    latest: time


def find_reminder_windows(now: datetime) -> list[ReminderWindow]:
    """The span from now to one lead time ahead, split where it crosses midnight."""
    window_end = now + REMINDER_LEAD
    if window_end.date() == now.date():
        return [ReminderWindow(now.weekday(), now.timetz(), window_end.timetz())]
    return [
        ReminderWindow(now.weekday(), now.timetz(), END_OF_DAY),
        ReminderWindow(window_end.weekday(), START_OF_DAY, window_end.timetz()),
    ]


def build_vapid_claims() -> dict[str, str] | None:
    if not settings.vapid_private_key or not settings.vapid_contact:
        return None
    contact = settings.vapid_contact
    if contact.startswith(("mailto:", "https://")):
        return {"sub": contact}
    return {"sub": f"mailto:{contact}"}


def send_push_to_user_subscriptions(
    db: Session,
    user_id: int,
    title: str,
    message: str,
) -> int:
    """Push a reminder to every device the user subscribed. Returns how many got it."""
    vapid_claims = build_vapid_claims()
    if vapid_claims is None:
        logger.warning("VAPID_PRIVATE_KEY or VAPID_CONTACT is not set; not sending.")
        return 0

    statement = select(NotificationSubscription).where(
        NotificationSubscription.user_id == user_id,
    )
    subscriptions = db.execute(statement).scalars().all()
    if not subscriptions:
        return 0

    db.add(Notification(user_id=user_id, title=title, message=message))
    db.commit()

    payload = json.dumps({"title": title, "message": message})
    delivered = 0
    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims=vapid_claims,
            )
            delivered += 1
        except WebPushException as error:
            logger.warning(
                "Could not push to subscription %s: %s", subscription.id, error
            )
            if (
                error.response is not None
                and error.response.status_code in GONE_STATUS_CODES
            ):
                db.delete(subscription)
                db.commit()
    return delivered


def find_routines_to_remind(db: Session, now: datetime):
    window_filters = [
        and_(
            Routine.day == window.weekday,
            Routine.start_time >= window.earliest,
            Routine.start_time <= window.latest,
        )
        for window in find_reminder_windows(now)
    ]
    reminded_before = now.replace(tzinfo=None) - REMINDER_COOLDOWN
    statement = (
        select(Routine)
        .join(User, User.id == Routine.user_id)
        .where(
            User.is_demo.is_(False),
            or_(*window_filters),
            or_(
                Routine.last_reminded_at.is_(None),
                Routine.last_reminded_at < reminded_before,
            ),
        )
    )
    return db.execute(statement).scalars().all()


def check_routine_reminders() -> None:
    db = SessionLocal()
    try:
        now = datetime.now(UTC)
        routines = find_routines_to_remind(db, now)
        logger.info("%s routine(s) due a reminder at %s UTC", len(routines), now)

        delivered_total = 0
        for routine in routines:
            delivered = send_push_to_user_subscriptions(
                db=db,
                user_id=routine.user_id,
                title="Time for Gains",
                message=f"It is time to start {routine.name}",
            )
            if delivered > 0:
                routine.last_reminded_at = now.replace(tzinfo=None)
                db.commit()
            delivered_total += delivered
        logger.info("Sent %s notification(s)", delivered_total)
    finally:
        db.close()
