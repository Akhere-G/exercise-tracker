from datetime import datetime, timedelta, timezone
from app.models import Notification
from app.services import notification as notification_service


def test_get_notifications_returns_the_newest_within_the_limit(db, user):
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    total = notification_service.NOTIFICATION_LIMIT + 5
    db.add_all(
        Notification(
            user_id=user.id,
            title=str(i),
            message="m",
            created_at=start + timedelta(minutes=i),
        )
        for i in range(total)
    )
    db.commit()

    notifications = notification_service.get_notifications(db, user.id)

    assert len(notifications) == notification_service.NOTIFICATION_LIMIT
    assert notifications[0].title == str(total - 1)
    assert notifications[-1].title == str(total - notification_service.NOTIFICATION_LIMIT)
