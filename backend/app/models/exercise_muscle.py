from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey
from .audit_mixin import AuditMixin


class ExerciseMuscle(Base, AuditMixin):
    __tablename__ = "exercise_muscles"
    exercise_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("exercises.id", ondelete="cascade"),
        primary_key=True,
    )
    muscle_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("muscles.id", ondelete="cascade"), primary_key=True
    )
    contribution_type: Mapped[str] = mapped_column(String(10))
