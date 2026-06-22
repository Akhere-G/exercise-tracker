import json
from datetime import datetime, timedelta
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import SessionLocal
from app.models import Routine, NotificationSubscription, Notification
from dotenv import load_dotenv
import os
from typing import Dict


load_dotenv()

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIMS: Dict[str, str | int] = {"sub": "mailto:101akhere5@gmail.com"}


def send_push_to_user_subscriptions(
    db: Session, user_id: int, title: str, message: str
):
    db_notif = Notification(user_id=user_id, title=title, message=message)
    db.add(db_notif)
    db.commit()

    stmt = select(NotificationSubscription).where(
        NotificationSubscription.user_id == user_id
    )
    subscriptions = db.execute(stmt).scalars().all()

    payload = json.dumps({"title": title, "message": message})

    print(f"{len(subscriptions)} (s) subscriptions")

    total_subscriptions = 0
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
            )
            print("Sucessfully pushed notification")
            total_subscriptions += 1
        except WebPushException as ex:
            import traceback

            print("CRITICAL ERROR IN SCHEDULER, could not push notifications:")
            print(traceback.format_exc())
            if ex.response is not None and ex.response.status_code in [404, 410]:
                db.delete(sub)
                db.commit()
            raise ex
    return total_subscriptions


def check_routine_reminders():
    db = SessionLocal()
    try:
        now = datetime.now()
        current_time = now.time()
        one_hour_ahead = (now + timedelta(hours=1)).time()
        current_day = now.weekday()

        print(f"Server time: {datetime.now().time()}")
        print(f"Querying for day: {current_day}")

        stmt = select(Routine).where(
            Routine.start_time >= current_time,
            Routine.start_time <= one_hour_ahead,
            Routine.day == current_day,
        )
        active_routines = db.execute(stmt).scalars().all()

        print(f"{len(active_routines)} (s) upcoming routines")

        total_notifications = 0
        for routine in active_routines:
            notifications = send_push_to_user_subscriptions(
                db=db,
                user_id=routine.user_id,
                title="Time for Gains",
                message=f"It is time to start {routine.name}",
            )
            total_notifications += notifications
        print(f"Sent {total_notifications} notification(s)")
    finally:
        db.close()
