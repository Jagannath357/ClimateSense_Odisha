from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    district: str = Field(..., description="District identifier (e.g. 'cuttack', 'angul', 'puri')")
    selected_date: str = Field(..., description="Reference date in YYYY-MM-DD format (e.g. '2025-12-30')")

class VariablePrediction(BaseModel):
    target: str
    display_name: str
    value: Optional[float]
    unit: str
    status: str
    model_name: str
    rainfall_probability: Optional[float] = None
    rainfall_category: Optional[Dict[str, str]] = None

class HistoricalContextPoint(BaseModel):
    date: str
    T2M: Optional[float] = None
    T2M_MAX: Optional[float] = None
    T2M_MIN: Optional[float] = None
    RH2M: Optional[float] = None
    PRECTOTCORR: Optional[float] = None
    WS2M: Optional[float] = None

class GroundTruthComparison(BaseModel):
    has_ground_truth: bool
    date: str
    note: str
    actual_values: Dict[str, Optional[float]]
    absolute_errors: Dict[str, Optional[float]]

class PredictionResponse(BaseModel):
    success: bool
    district: str
    district_display_name: str
    input_date: str
    prediction_date: str
    prediction_type: str = "next_day"
    data_status: str
    is_climatological_estimate: bool = False
    data_gap_days: int
    latest_available_date: str
    predictions: Dict[str, VariablePrediction]
    recent_7d_context: Optional[List[HistoricalContextPoint]] = None
    ground_truth_comparison: Optional[GroundTruthComparison] = None
    disclaimer: str
    generated_at: str
    model_information: Dict[str, str]

class PredictionHistoryRecord(BaseModel):
    id: str
    timestamp: str
    district: str
    district_display_name: str
    input_date: str
    prediction_date: str
    data_status: str
    is_climatological_estimate: bool
    predictions: Dict[str, Any]

class GeospatialDistrictPrediction(BaseModel):
    district: str
    district_display_name: str
    latitude: float
    longitude: float
    elevation_m: float
    region: str
    grid_note: Optional[str] = None
    T2M: Optional[float] = None
    T2M_MAX: Optional[float] = None
    T2M_MIN: Optional[float] = None
    RH2M: Optional[float] = None
    PRECTOTCORR: Optional[float] = None
    WS2M: Optional[float] = None
    rainfall_probability: Optional[float] = None
    rainfall_category: Optional[Dict[str, str]] = None
    status: str
    data_quality_status: str
    model_source: str
    last_observed_date: Optional[str] = None
    ground_truth: Optional[Dict[str, Optional[float]]] = None

class GeospatialPredictionResponse(BaseModel):
    success: bool
    prediction_date: str
    input_reference_date: str
    prediction_type: str
    data_status: str
    is_climatological_estimate: bool
    latest_available_date: str
    data_gap_days: int
    available_districts: int
    total_districts: int
    disclaimer: str
    generated_at: str
    districts: List[GeospatialDistrictPrediction]


