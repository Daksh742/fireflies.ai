import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.api.v1.router import api_router
from app.services.meeting_service import MeetingService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure static audio directory exists
    os.makedirs(settings.STATIC_AUDIO_DIR, exist_ok=True)
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Ensure example highlights exist for sample meetings
    db = SessionLocal()
    try:
        MeetingService.ensure_example_highlights(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static audio files
os.makedirs(settings.STATIC_AUDIO_DIR, exist_ok=True)
app.mount("/static/audio", StaticFiles(directory=settings.STATIC_AUDIO_DIR), name="static_audio")

# Include central v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to Fireflies Meeting Intelligence API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
