from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Annotated
from pydantic import BaseModel
from app.models import User
from app.database import get_db
from app.services import user as user_service
from app.services.timer_task import create_timer, cancel_timer_task, modify_timer

router = APIRouter(prefix="/api/timers", tags=["Timers"])

class TimerRequest(BaseModel):
    duration_seconds: int

@router.post("/start")
def start_timer(
    request: TimerRequest,
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        result = create_timer(db, user.id, request.duration_seconds)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create timer")

@router.delete("/cancel")
def cancel_timer(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    cancelled = cancel_timer_task(db, user.id)
    return {"cancelled": cancelled}

@router.post("/modify")
def modify_timer_endpoint(
    request: TimerRequest,
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        result = modify_timer(db, user.id, request.duration_seconds)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to modify timer")
