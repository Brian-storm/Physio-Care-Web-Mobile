"""PhysioCare — FastAPI application entry point. CORS, routes, startup initialization."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.endpoints import router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def on_startup():
    """Create all database tables on application startup."""
    init_db()


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.app_name}