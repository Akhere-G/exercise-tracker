from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer
from .audit_mixin import AuditMixin


class Muscle(Base, AuditMixin):
    __tablename__ = "muscles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
