import sys
from pathlib import Path

# 1. Ensure project root is always in sys.path
_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# 2. Automatically link ml/.venv site-packages if running with global or conda interpreter
_venv_site_packages = _root / "ml" / ".venv" / "Lib" / "site-packages"
if _venv_site_packages.exists() and str(_venv_site_packages) not in sys.path:
    sys.path.insert(1, str(_venv_site_packages))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.router import api_router
from backend.app.services.climate_service import climate_service
from backend.app.services.model_service import model_service

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("climatesense")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup phase: Load dataset and ML models once into memory
    logger.info("Initializing ClimateSense Odisha Backend...")
    try:
        climate_service.load_data()
        logger.info("Climate dataset loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading climate dataset: {e}")

    try:
        model_service.load_artifacts()
        logger.info("Machine learning models and artifacts loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading ML artifacts: {e}")

    logger.info("ClimateSense Odisha Backend is operational.")
    yield
    # Shutdown phase
    logger.info("Shutting down ClimateSense Odisha Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", summary="Root Endpoint")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_DESCRIPTION,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR,
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
