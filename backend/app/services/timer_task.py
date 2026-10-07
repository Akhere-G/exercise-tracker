import logging

from app.models import TimerTask
from app.workers.celery_app import celery_app
from celery import current_app
from sqlalchemy import select
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

MIN_DURATION = 10
MAX_DURATION = 3600


def _validate_duration(duration_seconds: int):
    if duration_seconds < MIN_DURATION or duration_seconds > MAX_DURATION:
        raise ValueError(
            f"Duration must be between {MIN_DURATION} and {MAX_DURATION} seconds"
        )


def get_active_task(db: Session, user_id: int):
    stmt = select(TimerTask).where(TimerTask.user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def cancel_timer_task(db: Session, user_id: int):
    task = get_active_task(db, user_id)

    if not task:
        logger.info(f"No active timer task found for user {user_id}")
        return 0

    task.is_active = False
    db.commit()

    try:
        current_app.control.revoke(task.celery_task_id, terminate=True)
        logger.info(
            f"Successfully revoked Celery task {task.celery_task_id} for user {user_id}"
        )
    except Exception as e:
        logger.error(
            f"Failed to revoke Celery task {task.celery_task_id} for user {user_id}: {e}"
        )

    return 1


def _create_or_update_task_record(
    db: Session, user_id: int, duration_seconds: int, task_id: str
):
    existing = get_active_task(db, user_id)
    if existing:
        existing.celery_task_id = task_id
        existing.duration_seconds = duration_seconds
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    task = TimerTask(
        user_id=user_id,
        celery_task_id=task_id,
        duration_seconds=duration_seconds,
        is_active=True,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def create_timer(db: Session, user_id: int, duration_seconds: int):
    _validate_duration(duration_seconds)

    try:
        cancel_timer_task(db, user_id)

        task = celery_app.send_task(
            "send_timer_notification", args=[user_id], countdown=duration_seconds
        )

        task_record = _create_or_update_task_record(
            db, user_id, duration_seconds, task.id
        )

        print("here", task, task_record)

        return {"task_id": task.id, "duration_seconds": duration_seconds}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create timer for user {user_id}: {e}")
        raise


def modify_timer(db: Session, user_id: int, duration_seconds: int):
    _validate_duration(duration_seconds)

    try:
        cancel_timer_task(db, user_id)

        task = celery_app.send_task(
            "send_timer_notification", args=[user_id], countdown=duration_seconds
        )

        task_record = _create_or_update_task_record(
            db, user_id, duration_seconds, task.id
        )

        return {"task_id": task.id, "duration_seconds": duration_seconds}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to modify timer for user {user_id}: {e}")
        raise
