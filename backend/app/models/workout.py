from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .audit_mixin import AuditMixin
from .exercise import Exercise


class Workout(Base, AuditMixin):
    __tablename__ = "workouts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    routine_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("routines.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE")
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime)
    duration: Mapped[int] = mapped_column(Integer)
    sets: Mapped[list["WorkoutSet"]] = relationship(
        "WorkoutSet",
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="WorkoutSet.position, WorkoutSet.id",
    )

    __table_args__ = (
        Index("ix_workouts_user_id_completed_at", "user_id", "completed_at"),
    )


class WorkoutSet(Base, AuditMixin):
    __tablename__ = "workout_sets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    workout_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workouts.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="CASCADE"), index=True
    )
    set_index: Mapped[int] = mapped_column(Integer, default=1)
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_meters: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_secs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    set_type: Mapped[str] = mapped_column(
        String(10), default="normal", server_default="normal"
    )
    rpe: Mapped[float | None] = mapped_column(Float, nullable=True)
    rir: Mapped[int | None] = mapped_column(Integer, nullable=True)
    superset_group: Mapped[int | None] = mapped_column(Integer, nullable=True)

    workout: Mapped[Workout] = relationship(Workout, back_populates="sets")
    exercise: Mapped[Exercise] = relationship(Exercise)
