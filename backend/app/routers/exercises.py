from fastapi import APIRouter, Depends
from app.services import exercise as exercise_service
from app.services import user as user_service
from app.models import User
from app.database import get_db
from sqlalchemy.orm import Session
from typing import Optional, Annotated
from app.schemas.exercise import Exercise
from typing import List

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


@router.get("", response_model=List[Exercise])
def get_exercises(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    equipment: Optional[str] = None,
    muscle_group: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    return exercise_service.get_exercises(
        db, search, equipment, muscle_group, page, limit
    )
