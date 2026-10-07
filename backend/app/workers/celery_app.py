from app.database import SessionLocal
from app.workers.scheduler import send_push_to_user_subscriptions
from celery import Celery

celery_app = Celery("gains", broker="memory://", backend="rpc://")


@celery_app.task(name="send_timer_notification")
def send_timer_notification(user_id: int):
    db = SessionLocal()
    try:
        send_push_to_user_subscriptions(
            db=db,
            user_id=user_id,
            title="Rest Time Complete!",
            message="Your rest period is over. Time to continue your workout!",
        )
    finally:
        db.close()


__all__ = ["celery_app", "send_timer_notification"]
