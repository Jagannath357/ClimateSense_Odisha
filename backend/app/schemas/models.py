from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ModelInfo(BaseModel):
    target: str
    display_name: str
    unit: str
    model_type: str
    feature_columns: List[str]
    model_parameters: Dict[str, Any]
    train_rows: int
    validation_rows: int
    test_rows: int
    date_ranges: Dict[str, str]
    model_version: str

class TargetEvaluationMetric(BaseModel):
    target: str
    display_name: str
    stage: str  # "validation" or "test"
    unit: str
    rows: int
    MAE: float
    RMSE: float
    R2: Optional[float] = None
    rain_occurrence_accuracy: Optional[float] = None
    rain_occurrence_precision: Optional[float] = None
    rain_occurrence_recall: Optional[float] = None
    rain_occurrence_f1: Optional[float] = None
    rain_occurrence_roc_auc: Optional[float] = None

class BaselineEvaluation(BaseModel):
    target: str
    stage: str
    features_used: List[str]
    MAE: float
    RMSE: float
    R2: float
    rows: int
    scientific_role: str

class DistrictEvaluationMetric(BaseModel):
    district: str
    rows: int
    MAE: float
    RMSE: float
    bias: float

class ModelPerformanceResponse(BaseModel):
    models: List[TargetEvaluationMetric]
    baseline_comparison: BaselineEvaluation
    district_test_breakdown: List[DistrictEvaluationMetric]
    metrics_explanation: Dict[str, str]
    limitations: List[str]

