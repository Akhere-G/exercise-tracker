from sqlalchemy import func, select
from sqlalchemy.orm import sessionmaker

from app.models import UserProfile
from app.services import profile as profile_service


def test_creates_a_profile_on_first_access(db, user):
    profile = profile_service.get_or_create_profile(db, user.id)

    assert profile.user_id == user.id
    assert profile.onboarded_at is None


def test_returns_the_existing_profile(db, user):
    first = profile_service.get_or_create_profile(db, user.id)
    second = profile_service.get_or_create_profile(db, user.id)

    assert first is second


def test_concurrent_first_access_returns_the_profile_another_request_created(
    db, engine, user, monkeypatch
):
    # Another request creates the profile after this one has looked for it.
    with sessionmaker(bind=engine)() as other_request:
        other_request.add(UserProfile(user_id=user.id, weight_unit="lb"))
        other_request.commit()

    original_get = db.get
    lookups = []

    def stale_first_lookup(model, key):
        lookups.append(key)
        if len(lookups) == 1:
            return None
        return original_get(model, key)

    monkeypatch.setattr(db, "get", stale_first_lookup)

    profile = profile_service.get_or_create_profile(db, user.id)

    assert profile.weight_unit == "lb"
    count_profiles = select(func.count()).where(UserProfile.user_id == user.id)
    assert db.scalar(count_profiles) == 1
