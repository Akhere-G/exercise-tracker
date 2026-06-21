import os

print(f"DEBUG: Environment variables present: {list(os.environ.keys())}")

from app.workers.scheduler import check_routine_reminders
from app.database import SessionLocal

if __name__ == "__main__":
    db = None
    try:
        db = SessionLocal()
        print("Starting routine reminder check job...")
        check_routine_reminders()
        print("Job completed successfully.")
    except Exception as e:
        import traceback

        print("CRITICAL ERROR IN SCHEDULER:")
        print(traceback.format_exc())
        raise e
    finally:
        if db:
            db.close()
