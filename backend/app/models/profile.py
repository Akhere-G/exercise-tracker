from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

from .audit_mixin import AuditMixin


class UserProfile(Base, AuditMixin):
    __tablename__ = "user_profiles"
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    weight_unit: Mapped[str] = mapped_column(
        String(2), default="kg", server_default="kg"
    )
    effort_metric: Mapped[str] = mapped_column(
        String(3), default="off", server_default="off"
    )
    sex: Mapped[str | None] = mapped_column(String(10), nullable=True)
    experience: Mapped[str | None] = mapped_column(String(20), nullable=True)
    goal: Mapped[str | None] = mapped_column(String(20), nullable=True)
    workouts_per_week_target: Mapped[int | None] = mapped_column(Integer, nullable=True)
    target_body_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_lift_exercise_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="SET NULL"), nullable=True
    )
    target_lift_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    coach_persona: Mapped[str] = mapped_column(
        String(20), default="hype", server_default="hype"
    )
    wrapped_theme: Mapped[str | None] = mapped_column(String(20), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    onboarded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_deload_recommended_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )


class UserExerciseSetting(Base, AuditMixin):
    __tablename__ = "user_exercise_settings"
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    rest_secs: Mapped[int | None] = mapped_column(Integer, nullable=True)
