from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Text
from .audit_mixin import AuditMixin
from typing import List
from .exercise_muscle import ExerciseMuscle


class Exercise(Base, AuditMixin):
    __tablename__ = "exercises"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    instructions: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(255))
    video_url: Mapped[str] = mapped_column(String(255))
    equipment: Mapped[str] = mapped_column(String(100))
    metrics: Mapped[str] = mapped_column(String(100))
    priority: Mapped[int] = mapped_column(Integer, default=0, index=True)
    muscles: Mapped[List["ExerciseMuscle"]] = relationship(
        "ExerciseMuscle",
    )
