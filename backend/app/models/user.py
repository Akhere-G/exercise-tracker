from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer
from .audit_mixin import AuditMixin


class User(Base, AuditMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(256))
