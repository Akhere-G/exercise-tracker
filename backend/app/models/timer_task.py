from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint, Boolean
from .audit_mixin import AuditMixin

class TimerTask(Base, AuditMixin):
    __tablename__ = "timer_tasks"
    __table_args__ = (
        UniqueConstraint('user_id', name='uq_timer_tasks_user_id'),
    )
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    celery_task_id: Mapped[str] = mapped_column(String(255), unique=True)
    duration_seconds: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
