from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services import export as export_service
from app.services import user as user_service

router = APIRouter(prefix="/api/export", tags=["Export"])


def _csv_response(content: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/workouts.csv")
def export_workouts(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return _csv_response(export_service.workouts_csv(db, user.id), "gains-workouts.csv")


@router.get("/body-weight.csv")
def export_body_weights(
    user: Annotated[User, Depends(user_service.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return _csv_response(
        export_service.body_weights_csv(db, user.id), "gains-body-weight.csv"
    )
