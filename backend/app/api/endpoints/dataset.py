from fastapi import APIRouter
from backend.app.services.climate_service import climate_service

router = APIRouter()

@router.get("/districts", summary="List All Supported Odisha Districts")
def get_districts():
    districts = climate_service.get_districts()
    return {
        "total": len(districts),
        "districts": districts
    }

@router.get("/dataset/info", summary="Dataset Provenance & Quality Overview")
def get_dataset_info():
    return climate_service.get_dataset_info()

@router.get("/dataset/date-range", summary="Dataset Temporal Boundaries")
def get_date_range():
    return {
        "start_date": climate_service.date_min,
        "end_date": climate_service.date_max,
        "latest_available_date": climate_service.date_max,
        "total_days_per_district": 9131,
        "years_covered": 25,
        "start_year": 2001,
        "end_year": 2025
    }

