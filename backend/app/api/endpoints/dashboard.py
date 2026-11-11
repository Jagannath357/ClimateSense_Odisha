from fastapi import APIRouter
from backend.app.services.climate_service import climate_service

router = APIRouter()

@router.get("/dashboard/summary", summary="Complete Overview Dashboard State Summary")
def get_dashboard_summary():
    return climate_service.get_dashboard_summary()

