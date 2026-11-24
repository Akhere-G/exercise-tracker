import logging

from app.workers.scheduler import check_routine_reminders

logger = logging.getLogger(__name__)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting routine reminder check job...")
    check_routine_reminders()
    logger.info("Job completed successfully.")


if __name__ == "__main__":
    main()
