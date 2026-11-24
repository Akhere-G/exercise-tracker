from datetime import UTC, datetime, time, timedelta

import pytest
from sqlalchemy.orm import sessionmaker

from app.models import Notification, NotificationSubscription, Routine
from app.workers import scheduler


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
        (datetime(2026, 10, 19, 6, 30, tzinfo=UTC), 1),
        (datetime(2026, 10, 19, 5, 30, tzinfo=UTC), 0),
        (datetime(2026, 10, 20, 6, 30, tzinfo=UTC), 0),
    ],
)
def test_reminders_use_utc_time_and_weekday(
    db, user, notified, monkeypatch, now_utc, expected
):
    db.add(
        Routine(name="Push", user_id=user.id, day=0, start_time=time(7, 0, tzinfo=UTC))
    )
    db.commit()
    monkeypatch.setattr(scheduler, "datetime", _frozen(now_utc))

    scheduler.check_routine_reminders()

    assert len(notified) == expected


def _add_routine(db, user, day, start):
    routine = Routine(
        name="Push",
        user_id=user.id,
        day=day,
        start_time=time(*start, tzinfo=UTC),
    )
    db.add(routine)
    db.commit()
    return routine


def test_a_late_evening_routine_is_reminded_before_midnight(
    db, user, notified, monkeypatch
):
    _add_routine(db, user, day=0, start=(23, 45))
    monkeypatch.setattr(
        scheduler, "datetime", _frozen(datetime(2026, 10, 19, 23, 30, tzinfo=UTC))
    )

    scheduler.check_routine_reminders()

    assert len(notified) == 1


def test_an_early_morning_routine_is_reminded_just_before_midnight(
    db, user, notified, monkeypatch
):
    _add_routine(db, user, day=1, start=(0, 15))
    monkeypatch.setattr(
        scheduler, "datetime", _frozen(datetime(2026, 10, 19, 23, 30, tzinfo=UTC))
    )

    scheduler.check_routine_reminders()

    assert len(notified) == 1


def test_a_routine_the_next_day_at_the_same_clock_time_is_not_reminded(
    db, user, notified, monkeypatch
):
    _add_routine(db, user, day=1, start=(23, 45))
    monkeypatch.setattr(
        scheduler, "datetime", _frozen(datetime(2026, 10, 19, 23, 30, tzinfo=UTC))
    )

    scheduler.check_routine_reminders()

    assert notified == []


def test_running_the_job_twice_sends_one_reminder(db, user, notified, monkeypatch):
    _add_routine(db, user, day=0, start=(7, 0))
    monkeypatch.setattr(
        scheduler, "datetime", _frozen(datetime(2026, 10, 19, 6, 30, tzinfo=UTC))
    )

    scheduler.check_routine_reminders()
    scheduler.check_routine_reminders()

    assert len(notified) == 1


def test_a_routine_is_reminded_again_the_next_week(db, user, notified, monkeypatch):
    _add_routine(db, user, day=0, start=(7, 0))
    first_week = datetime(2026, 10, 19, 6, 30, tzinfo=UTC)
    monkeypatch.setattr(scheduler, "datetime", _frozen(first_week))
    scheduler.check_routine_reminders()

    monkeypatch.setattr(scheduler, "datetime", _frozen(first_week + timedelta(days=7)))
    scheduler.check_routine_reminders()

    assert len(notified) == 2


def test_a_routine_is_retried_when_nobody_received_the_reminder(
    db, user, monkeypatch, engine
):
    attempts = []
    monkeypatch.setattr(scheduler, "SessionLocal", sessionmaker(bind=engine))
    monkeypatch.setattr(
        scheduler,
        "send_push_to_user_subscriptions",
        lambda db, user_id, title, message: attempts.append(message) or 0,
    )
    _add_routine(db, user, day=0, start=(7, 0))
    monkeypatch.setattr(
        scheduler, "datetime", _frozen(datetime(2026, 10, 19, 6, 30, tzinfo=UTC))
    )

    scheduler.check_routine_reminders()
    scheduler.check_routine_reminders()

    assert len(attempts) == 2


def test_no_notification_is_stored_for_a_user_with_no_subscription(
    db, user, monkeypatch
):
    monkeypatch.setattr(scheduler.settings, "vapid_private_key", "key")
    monkeypatch.setattr(scheduler.settings, "vapid_contact", "me@example.com")

    delivered = scheduler.send_push_to_user_subscriptions(db, user.id, "Hi", "There")

    assert delivered == 0
    assert db.query(Notification).count() == 0


def test_nothing_is_sent_without_vapid_settings(db, user, monkeypatch):
    monkeypatch.setattr(scheduler.settings, "vapid_private_key", None)
    db.add(
        NotificationSubscription(
            user_id=user.id,
            endpoint="https://fcm.googleapis.com/fcm/send/abc",
            p256dh="p",
            auth="a",
        )
    )
    db.commit()

    delivered = scheduler.send_push_to_user_subscriptions(db, user.id, "Hi", "There")

    assert delivered == 0
    assert db.query(Notification).count() == 0
