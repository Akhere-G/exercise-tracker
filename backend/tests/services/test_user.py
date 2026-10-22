from app.models import User
from app.services import user as user_service


def test_get_user_by_email_ignores_case(db, user):
    assert user_service.get_user_by_email(db, "TEST@Example.com").id == user.id


def test_get_user_by_email_finds_accounts_stored_with_a_mixed_case_email(db):
    db.add(User(username="Old", email="Old.User@Example.com", password_hash="x"))
    db.commit()

    assert user_service.get_user_by_email(db, "old.user@example.com") is not None
