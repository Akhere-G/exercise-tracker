from datetime import date
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BodyWeight
from app.schemas.body import BodyWeightUpsert


def get_body_weights(
    db: Session,
    user_id: int,
    start: Optional[date] = None,
    end: Optional[date] = None,
) -> list[BodyWeight]:
    stmt = select(BodyWeight).where(BodyWeight.user_id == user_id)
    if start is not None:
        stmt = stmt.where(BodyWeight.measured_on >= start)
    if end is not None:
        stmt = stmt.where(BodyWeight.measured_on <= end)
    return list(db.execute(stmt.order_by(BodyWeight.measured_on)).scalars())


def get_latest_body_weight(db: Session, user_id: int) -> Optional[BodyWeight]:
    stmt = (
        select(BodyWeight)
        .where(BodyWeight.user_id == user_id)
        .order_by(BodyWeight.measured_on.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def upsert_body_weight(
    db: Session, user_id: int, weight_in: BodyWeightUpsert
) -> BodyWeight:
    try:
        stmt = select(BodyWeight).where(
            BodyWeight.user_id == user_id,
            BodyWeight.measured_on == weight_in.measured_on,
        )
        entry = db.execute(stmt).scalar_one_or_none()
        if entry is None:
            entry = BodyWeight(user_id=user_id, measured_on=weight_in.measured_on)
            db.add(entry)
        entry.weight_kg = weight_in.weight_kg
        db.commit()
        db.refresh(entry)
        return entry
    except Exception:
        db.rollback()
        raise


def delete_body_weight(db: Session, user_id: int, entry_id: int) -> Optional[int]:
    try:
        entry = db.execute(
            select(BodyWeight).where(
                BodyWeight.id == entry_id, BodyWeight.user_id == user_id
            )
        ).scalar_one_or_none()
        if entry is None:
            return None
        db.delete(entry)
        db.commit()
        return entry_id
    except Exception:
        db.rollback()
        raise
