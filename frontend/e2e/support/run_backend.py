"""Starts an isolated backend for the Playwright suite.

Builds a throwaway SQLite database (tables, exercise catalogue, achievements) and
serves the real FastAPI app on top of it. Configuration comes from the
environment set up in playwright.config.ts; the developer's backend/.env is
neutralised so the run can never reach Redis, a real database or demo mode.
"""

import json
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[3] / "backend"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

db_url = os.environ["DATABASE_URL"]
if not db_url.startswith("sqlite:///") or "e2e" not in db_url:
    sys.exit(f"Refusing to run E2E against {db_url!r}: expected an e2e SQLite file")

from app.config import settings  # noqa: E402

# backend/.env may enable the rate limiter, Redis or demo mode; none of that is wanted here.
settings.trusted_proxy_count = None
settings.redis_url = None
settings.demo_mode_enabled = False

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.services.achievement import seed_achievements  # noqa: E402
from seed import seed_all_muscles, seed_exercises_and_junctions  # noqa: E402

db_file = Path(db_url.removeprefix("sqlite:///"))
db_file.parent.mkdir(parents=True, exist_ok=True)
db_file.unlink(missing_ok=True)

Base.metadata.create_all(engine)
with open(BACKEND / "exercises.json", encoding="utf-8") as f:
    catalogue = json.load(f)
with SessionLocal() as session:
    muscles = seed_all_muscles(session, catalogue)
    seed_exercises_and_junctions(session, catalogue, muscles)
    session.commit()
    seed_achievements(session)

import uvicorn  # noqa: E402
from app.main import app  # noqa: E402

uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("E2E_BACKEND_PORT", "8765")))
