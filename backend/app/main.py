from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import SessionLocal
from app.limiter import limiter, rate_limit_exceeded_handler
from app.routers import (
    achievements,
    ai,
    body,
    exercises,
    export,
    notifications,
    profile,
    programs,
    progression,
    routines,
    stats,
    users,
    workouts,
    wrapped,
)
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
    app.include_router(stats.router)
    app.include_router(profile.router)
    app.include_router(body.router)
    app.include_router(export.router)
    app.include_router(ai.router)
    app.include_router(progression.router)
    app.include_router(programs.router)
    app.include_router(wrapped.router)

    @app.get("/", tags=["Health"])
    async def health_check():
        return {"status": "running", "version": "1.0.0"}

    return app


app = create_app()
