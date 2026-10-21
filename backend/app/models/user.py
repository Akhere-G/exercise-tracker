from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, Index, Integer, String, false, text
from .audit_mixin import AuditMixin
from typing import List


class User(Base, AuditMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    is_demo: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false()
    )
    user_achievements: Mapped[List["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="user"
    )

    __table_args__ = (
        Index(
            "uq_users_single_demo",
            "is_demo",
            unique=True,
            postgresql_where=text("is_demo"),
            sqlite_where=text("is_demo"),
        ),
    )
