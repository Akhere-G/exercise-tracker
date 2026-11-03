from app.database import Base
from .audit_mixin import AuditMixin
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Date, Float, ForeignKey, Integer, UniqueConstraint
from datetime import date


class BodyWeight(Base, AuditMixin):
    __tablename__ = "body_weights"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    measured_on: Mapped[date] = mapped_column(Date)
    weight_kg: Mapped[float] = mapped_column(Float)

    __table_args__ = (
        UniqueConstraint("user_id", "measured_on", name="uq_body_weights_user_day"),
    )
