from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .audit_mixin import AuditMixin

if TYPE_CHECKING:
    from .user import User


class AchievementType:
    PR_WEIGHT = "pr_weight"
    PR_DISTANCE = "pr_distance"
    PR_REPS = "pr_reps"
    PR_DURATION = "pr_duration"
    FREQ_STREAK_1 = "freq_streak_1"
    FREQ_STREAK_2 = "freq_streak_2"
    FREQ_STREAK_3 = "freq_streak_3"
    FREQ_STREAK_4 = "freq_streak_4"
    FREQ_STREAK_5 = "freq_streak_5"


class Achievement(AuditMixin):
    __tablename__ = "achievements"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(50), index=True)
    icon: Mapped[str] = mapped_column(String(50))
    criteria: Mapped[str] = mapped_column(String(255))
    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="achievement"
    )


class UserAchievement(AuditMixin):
    __tablename__ = "user_achievements"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE")
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("achievements.id", ondelete="CASCADE")
    )
    value: Mapped[float] = mapped_column(Integer, nullable=True)
    exercise_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="SET NULL"), nullable=True
    )
    workout_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("workouts.id", ondelete="SET NULL"), nullable=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    achievement: Mapped[Achievement] = relationship(
        "Achievement", back_populates="user_achievements"
    )
    user: Mapped["User"] = relationship("User", back_populates="user_achievements")
