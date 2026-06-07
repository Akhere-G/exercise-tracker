from app.database import Base
from .audit_mixin import AuditMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Float, DateTime, ForeignKey
from datetime import datetime
from typing import Optional, List
from .exercise import Exercise


class Workout(Base, AuditMixin):
    __tablename__ = "workouts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    routine_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("routines.id", ondelete="SET NULL")
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE")
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime)
    duration: Mapped[int] = mapped_column(Integer)
    sets: Mapped[List["WorkoutSet"]] = relationship(
        "WorkoutSet", back_populates="workout", cascade="all, delete-orphan"
    )


class WorkoutSet(Base, AuditMixin):
    __tablename__ = "workout_sets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    workout_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workouts.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="CASCADE")
    )
    set_index: Mapped[int] = mapped_column(Integer, default=1)
    reps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duration_secs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    workout: Mapped[Workout] = relationship(Workout, back_populates="sets")
    exercise: Mapped[Exercise] = relationship(Exercise)
