from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DistrictSummaryCard(BaseModel):
    id: str
    name: str
    region: str
    latitude: float
    longitude: float
    elevation_m: float
    latest_T2M: Optional[float] = None
    latest_PRECTOTCORR: Optional[float] = None
    latest_RH2M: Optional[float] = None
    latest_WS2M: Optional[float] = None

class DashboardSummaryResponse(BaseModel):
    project_name: str
    version: str
    total_districts: int
    dataset_start_date: str
    dataset_end_date: str
    total_observations: int
    latest_available_date: str
    supported_models_count: int
    models_status: str
    state_averages: Dict[str, float]
    districts: List[DistrictSummaryCard]
    recent_climate_series: List[Dict[str, Any]]
    key_findings: List[str]

