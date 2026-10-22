from datetime import datetime, time, timezone

import pytest
from app.models import Routine
from app.workers import scheduler
from sqlalchemy.orm import sessionmaker


def _frozen(moment):
    class FrozenDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return moment.astimezone(tz) if tz else moment.replace(tzinfo=None)

    return FrozenDatetime


@pytest.fixture
def notified(engine, monkeypatch):
    sent = []
    monkeypatch.setattr(scheduler, "SessionLocal", sessionmaker(bind=engine))
    monkeypatch.setattr(
        scheduler,
        "send_push_to_user_subscriptions",
        lambda db, user_id, title, message: sent.append(message) or 1,
    )
    return sent


@pytest.mark.parametrize(
    "now_utc, expected",
    [
        (datetime(2026, 10, 19, 6, 30, tzinfo=timezone.utc), 1),
        (datetime(2026, 10, 19, 5, 30, tzinfo=timezone.utc), 0),
        (datetime(2026, 10, 20, 6, 30, tzinfo=timezone.utc), 0),
    ],
)
def test_reminders_use_utc_time_and_weekday(db, user, notified, monkeypatch, now_utc, expected):
    db.add(Routine(name="Push", user_id=user.id, day=0, start_time=time(7, 0, tzinfo=timezone.utc)))
    db.commit()
    monkeypatch.setattr(scheduler, "datetime", _frozen(now_utc))

    scheduler.check_routine_reminders()

    assert len(notified) == expected
