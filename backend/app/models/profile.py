from app.database import Base
from .audit_mixin import AuditMixin
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from datetime import datetime
from typing import Optional


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
    sex: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    experience: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    goal: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    workouts_per_week_target: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    target_body_weight_kg: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    target_lift_exercise_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="SET NULL"), nullable=True
    )
    target_lift_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coach_persona: Mapped[str] = mapped_column(
        String(20), default="hype", server_default="hype"
    )
    wrapped_theme: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    timezone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    onboarded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_deload_recommended_at: Mapped[Optional[datetime]] = mapped_column(
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
    rest_secs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
