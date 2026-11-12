"""Starts an isolated backend for the Playwright suite.

Builds a throwaway SQLite database (tables, exercise catalogue, achievements and
the demo account) and serves the real FastAPI app on top of it. Configuration
comes from the environment set in playwright.config.ts. Settings the developer's
backend/.env may add (rate limiting, Redis, AI keys) are switched off in-process
so a run can never reach a real database or service.
"""

import json
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[3] / "backend"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

database_url = os.environ["DATABASE_URL"]
if not database_url.startswith("sqlite:///") or "e2e" not in database_url:
    sys.exit(f"Refusing to run E2E against {database_url!r}: expected an e2e SQLite DB")

from app.config import settings  # noqa: E402

# Must happen before app.limiter and the AI services are imported.
settings.trusted_proxy_count = None
settings.redis_url = None
settings.demo_mode_enabled = True
settings.gemini_api_key = None
settings.groq_api_key = None

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.services.achievement import seed_achievements  # noqa: E402
from app.services.demo import load_fixture, reset_demo_user  # noqa: E402
from seed import seed_all_muscles, seed_exercises_and_junctions  # noqa: E402

database_file = Path(database_url.removeprefix("sqlite:///"))
database_file.parent.mkdir(parents=True, exist_ok=True)
database_file.unlink(missing_ok=True)

Base.metadata.create_all(engine)
with open(BACKEND / "exercises.json", encoding="utf-8") as catalogue_file:
    catalogue = json.load(catalogue_file)
with SessionLocal() as session:
    muscles = seed_all_muscles(session, catalogue)
    seed_exercises_and_junctions(session, catalogue, muscles)
    session.commit()
    seed_achievements(session)
    reset_demo_user(session, load_fixture())

import uvicorn  # noqa: E402

from app.main import app  # noqa: E402

uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("E2E_BACKEND_PORT", "8765")))
