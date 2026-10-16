from app.database import SessionLocal
from app.services.achievement import seed_achievements

if __name__ == "__main__":
    with SessionLocal() as db:
        seed_achievements(db)
