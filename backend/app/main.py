from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, exercises, routines
from app.database import engine, Base
from app.models.user import User
import os

Base.metadata.create_all(bind=engine)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Exercise Tracker API",
        description="A professional backend for tracking fitness progress.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:8000",
            os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(users.router)
    app.include_router(exercises.router)
    app.include_router(routines.router)

    @app.get("/", tags=["Health"])
    async def health_check():
        return {"status": "running", "version": "1.0.0"}

    return app


app = create_app()
