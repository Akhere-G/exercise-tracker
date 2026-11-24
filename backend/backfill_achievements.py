from logging import getLogger

from sqlalchemy import select

from app.database import SessionLocal
from app.models import (
    User,
)
from app.services.achievement import backfill_user_achievements

logger = getLogger(__name__)


def backfill_all_user_achievements():
    with SessionLocal() as db:
        try:
            stmt = select(User.id)
            user_ids = db.execute(stmt).scalars().all()

            for user_id in user_ids:
                with db.begin_nested():
                    created = backfill_user_achievements(db, user_id)
                    db.commit()
                    logger.info(
                        f"Created {len(created)} achievements for user {user_id}"
                    )
        except Exception:
            db.rollback()
            logger.exception("Could not backfill user achievements.")
            raise


if __name__ == "__main__":
    backfill_all_user_achievements()
