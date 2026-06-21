from app.workers.scheduler import check_routine_reminders

if __name__ == "__main__":
    print("Starting routine reminder check job...")
    check_routine_reminders()
    print("Job completed successfully.")
