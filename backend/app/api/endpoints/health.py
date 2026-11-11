from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.services.model_service import model_service
from backend.app.services.climate_service import climate_service

router = APIRouter()

@router.get("/health", summary="System Health & Operational Status")
def get_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "dataset": {
                "status": "ready" if climate_service._is_loaded else "not_loaded",
                "total_rows": climate_service.total_rows,
                "districts_count": len(climate_service.districts),
                "date_range": f"{climate_service.date_min} to {climate_service.date_max}"
            },
            "models": {
                "status": "ready" if model_service._is_loaded else "not_loaded",
                "active_models_count": len(model_service.models),
                "supported_targets": model_service.get_supported_targets()
            }
        }
    }

