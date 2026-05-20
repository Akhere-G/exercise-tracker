from app.database import Base
from .audit_mixin import AuditMixin
from sqlalchemy import Integer, String, Time, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import time
from typing import Optional, List
from .exercise import Exercise


class Routine(Base, AuditMixin):
    __tablename__ = "routines"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE")
    )
    day: Mapped[int] = mapped_column(Integer)
    start_time: Mapped[Optional[time]] = mapped_column(Time)

    routine_items: Mapped[List["RoutineItem"]] = relationship(
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
    target_reps: Mapped[int] = mapped_column(Integer)
    order: Mapped[int] = mapped_column(Integer)
    exercise: Mapped[Exercise] = relationship(Exercise)
    routine: Mapped[Routine] = relationship(Routine, back_populates="routine_items")
