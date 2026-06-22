import os
import sys

sys.path.append(os.getcwd())

from app.workers.scheduler import check_routine_reminders

if __name__ == "__main__":
    try:
        print("Starting routine reminder check job...")
        check_routine_reminders()
        print("Job completed successfully.")
    except Exception as e:
        import traceback

        print("CRITICAL ERROR IN RUN_REMINDER:")
        print(traceback.format_exc())
        raise e
