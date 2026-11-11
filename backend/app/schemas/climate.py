from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ClimateRecord(BaseModel):
    date: str
    district: str
    T2M: Optional[float] = None
    T2M_MAX: Optional[float] = None
    T2M_MIN: Optional[float] = None
    RH2M: Optional[float] = None
    PRECTOTCORR: Optional[float] = None
    WS2M: Optional[float] = None
    ALLSKY_SFC_SW_DWN: Optional[float] = None
    PS: Optional[float] = None

class HistoricalQueryResponse(BaseModel):
    district: str
    start_date: str
    end_date: str
    total_records: int
    page: int
    page_size: int
    total_pages: int
    data: List[ClimateRecord]

class AggregationRecord(BaseModel):
    period: str  # e.g. "2024-05" for monthly or "2024" for annual
    district: str
    T2M_mean: Optional[float] = None
    T2M_MAX_mean: Optional[float] = None
    T2M_MIN_mean: Optional[float] = None
    RH2M_mean: Optional[float] = None
    PRECTOTCORR_total: Optional[float] = None
    PRECTOTCORR_mean: Optional[float] = None
    WS2M_mean: Optional[float] = None
    records_count: int

class AggregatedClimateResponse(BaseModel):
    district: str
    aggregation_type: str  # "monthly" or "annual"
    total_periods: int
    data: List[AggregationRecord]

class VariableSummary(BaseModel):
    mean: float
    min: float
    max: float
    std: float
    median: float
    p25: float
    p75: float
    missing_count: int

class ClimateSummaryResponse(BaseModel):
    district: str
    start_date: str
    end_date: str
    total_days: int
    variables: Dict[str, VariableSummary]

class TrendRecord(BaseModel):
    district: str
    variable: str
    unit: str
    years: int
    first_year: int
    last_year: int
    sen_slope_per_year: float
    sen_slope_ci_low: float
    sen_slope_ci_high: float
    kendall_tau: float
    kendall_p_value: float
    is_statistically_significant: bool
    trend_direction: str  # "warming", "cooling", "increasing", "decreasing", "stable"
    interpretation: str

class TrendResponse(BaseModel):
    total_trends: int
    district_filter: Optional[str] = None
    variable_filter: Optional[str] = None
    baseline_period: List[int]
    trends: List[TrendRecord]

class AnnualAnomalyRecord(BaseModel):
    district: str
    year: int
    T2M: float
    T2M_MAX: float
    T2M_MIN: float
    PRECTOTCORR: float
    RH2M: float
    WS2M: float
    T2M_baseline: float
    T2M_MAX_baseline: float
    T2M_MIN_baseline: float
    PRECTOTCORR_baseline: float
    RH2M_baseline: float
    WS2M_baseline: float
    T2M_anomaly: float
    T2M_MAX_anomaly: float
    T2M_MIN_anomaly: float
    PRECTOTCORR_anomaly: float
    RH2M_anomaly: float
    WS2M_anomaly: float

class DailyExtremeAnomalyRecord(BaseModel):
    date: str
    district: str
    variable: str
    unit: str
    observed_value: float
    historical_day_mean: float
    historical_day_std: float
    z_score: float
    anomaly_category: str  # "Extreme High", "High", "Normal", "Low", "Extreme Low"
    detection_method: str = "Daily Climatological Z-Score (vs 25-Year Day-of-Year Mean)"

class AnomalyResponse(BaseModel):
    district: Optional[str]
    baseline_period: str = "2001-2010"
    method_disclaimer: str
    annual_anomalies: List[AnnualAnomalyRecord]
    recent_extremes: List[DailyExtremeAnomalyRecord]

