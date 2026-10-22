from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, exercises, routines, workouts, notifications, achievements
from app.config import settings
from app.database import SessionLocal
from app.limiter import limiter, rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.services import achievement as achievement_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    with SessionLocal() as db:
        achievement_service.seed_achievements(db)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Exercise Tracker API",
        description="A professional backend for tracking fitness progress.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_origin,
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(users.router)
    app.include_router(workouts.router)
    app.include_router(exercises.router)
    app.include_router(routines.router)
    app.include_router(notifications.router)
    app.include_router(achievements.router)

    @app.get("/", tags=["Health"])
    async def health_check():
        return {"status": "running", "version": "1.0.0"}

    return app


app = create_app()
