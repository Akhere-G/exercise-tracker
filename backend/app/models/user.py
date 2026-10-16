from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer
from .audit_mixin import AuditMixin
from typing import List


class User(Base, AuditMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    user_achievements: Mapped[List["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="user"
    )
