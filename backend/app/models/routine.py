from datetime import datetime, time

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from .audit_mixin import AuditMixin
from .exercise import Exercise


class Routine(Base, AuditMixin):
    __tablename__ = "routines"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    day: Mapped[int] = mapped_column(Integer)
    start_time: Mapped[time | None] = mapped_column(Time(timezone=True))
    # When a start-time reminder last went out (naive UTC), to avoid sending twice.
    last_reminded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    routine_items: Mapped[list["RoutineItem"]] = relationship(
        "RoutineItem",
        back_populates="routine",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class RoutineItem(Base, AuditMixin):
    __tablename__ = "routine_items"
    routine_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("routines.id", ondelete="cascade"), primary_key=True
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id", ondelete="cascade"), primary_key=True
    )
    target_sets: Mapped[int] = mapped_column(Integer)
    target_reps: Mapped[int | None] = mapped_column(Integer)
    target_weight: Mapped[float | None] = mapped_column(Float)
    target_duration_secs: Mapped[int | None] = mapped_column(Integer)
    target_distance_meters: Mapped[float | None] = mapped_column(Float)
    order: Mapped[int] = mapped_column(Integer)
    rest_secs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    superset_group: Mapped[int | None] = mapped_column(Integer, nullable=True)
    exercise: Mapped[Exercise] = relationship(Exercise)
    routine: Mapped[Routine] = relationship(Routine, back_populates="routine_items")
