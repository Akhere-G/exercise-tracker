import argparse

from app.database import SessionLocal, engine
from app.services.demo import DEFAULT_FIXTURE_PATH, DemoSeedError, load_fixture, reset_demo_user


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset the public demo user's data.")
    parser.add_argument("--fixture", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument(
        "--dry-run", action="store_true", help="Run everything, then roll back."
    )
    parser.add_argument(
        "--yes", action="store_true", help="Required for non-SQLite databases."
    )
    args = parser.parse_args()

    target = engine.url.render_as_string(hide_password=True)
    print(f"Database: {target}")
    if engine.dialect.name != "sqlite" and not args.yes and not args.dry_run:
        raise SystemExit("Refusing to write to a non-SQLite database without --yes.")

    fixture = load_fixture(args.fixture)
    with SessionLocal() as db:
        try:
            summary = reset_demo_user(db, fixture, commit=not args.dry_run)
        except DemoSeedError as error:
            raise SystemExit(f"Demo seed aborted: {error}")

    print(("Dry run (rolled back): " if args.dry_run else "Reset complete: ") + str(summary))


if __name__ == "__main__":
    main()
