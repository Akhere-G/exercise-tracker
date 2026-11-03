from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import UserExerciseSetting, UserProfile
from app.schemas.profile import ExerciseSettingUpdate, ProfileUpdate


def get_or_create_profile(db: Session, user_id: int) -> UserProfile:
    profile = db.get(UserProfile, user_id)
    if profile is not None:
        return profile

    try:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    except Exception:
        db.rollback()
        raise


def update_profile(db: Session, user_id: int, profile_in: ProfileUpdate) -> UserProfile:
    profile = get_or_create_profile(db, user_id)
    try:
        for field, value in profile_in.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
        db.commit()
        db.refresh(profile)
        return profile
    except Exception:
        db.rollback()
        raise


def get_exercise_settings(db: Session, user_id: int) -> list[UserExerciseSetting]:
    stmt = select(UserExerciseSetting).where(UserExerciseSetting.user_id == user_id)
    return list(db.execute(stmt).scalars())


def upsert_exercise_setting(
    db: Session, user_id: int, exercise_id: int, setting_in: ExerciseSettingUpdate
) -> UserExerciseSetting:
    try:
        setting = db.get(UserExerciseSetting, (user_id, exercise_id))
        if setting is None:
            setting = UserExerciseSetting(user_id=user_id, exercise_id=exercise_id)
            db.add(setting)
        setting.rest_secs = setting_in.rest_secs
        db.commit()
        db.refresh(setting)
        return setting
    except Exception:
        db.rollback()
        raise
