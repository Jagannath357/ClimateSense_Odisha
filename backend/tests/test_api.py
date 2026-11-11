import pytest
from backend.app.schemas.prediction import PredictionRequest
from backend.app.api.endpoints.health import get_health
from backend.app.api.endpoints.dataset import get_districts, get_dataset_info, get_date_range
from backend.app.api.endpoints.predictions import (
    predict_next_day,
    get_prediction_history,
    get_geospatial_predictions,
)
from backend.app.api.endpoints.climate import (
    get_historical_climate,
    get_aggregated_climate,
    get_climate_summary,
    get_climate_trends,
    get_climate_anomalies
)
from backend.app.api.endpoints.models import get_models, get_model_performance
from backend.app.api.endpoints.dashboard import get_dashboard_summary
from backend.app.services.climate_service import climate_service
from backend.app.services.model_service import model_service
from fastapi import HTTPException

# Pre-load services
climate_service.load_data()
model_service.load_artifacts()

def test_health_endpoint():
    data = get_health()
    assert data["status"] == "healthy"
    assert data["components"]["dataset"]["status"] == "ready"
    assert data["components"]["models"]["status"] == "ready"
    assert data["components"]["dataset"]["total_rows"] == 136965
    assert len(data["components"]["models"]["supported_targets"]) == 6

def test_districts_endpoint():
    data = get_districts()
    assert data["total"] == 15
    district_ids = [d["id"] for d in data["districts"]]
    assert "cuttack" in district_ids
    assert "bargarh" in district_ids
    assert "sambalpur" in district_ids
    assert "puri" in district_ids
    assert "khurda" in district_ids

def test_dataset_info_endpoint():
    data = get_dataset_info()
    assert data["start_date"] == "2001-01-01"
    assert data["end_date"] == "2025-12-31"
    assert data["total_records"] == 136965
    assert "merra2_grid_note" in data

def test_dataset_date_range_endpoint():
    data = get_date_range()
    assert data["start_date"] == "2001-01-01"
    assert data["end_date"] == "2025-12-31"
    assert data["years_covered"] == 25

def test_prediction_historical_date_situation_a():
    """Situation A: Historical date 2025-12-30 -> Predicts 2025-12-31 with ground truth comparison"""
    req = PredictionRequest(district="cuttack", selected_date="2025-12-30")
    res = predict_next_day(req)
    assert res.success is True
    assert res.district == "cuttack"
    assert res.input_date == "2025-12-30"
    assert res.prediction_date == "2025-12-31"
    assert res.data_status == "historical_observation_available"
    assert res.is_climatological_estimate is False
    assert "T2M" in res.predictions
    assert "PRECTOTCORR" in res.predictions
    assert res.predictions["T2M"].value is not None
    assert res.predictions["PRECTOTCORR"].value is not None
    assert res.predictions["PRECTOTCORR"].rainfall_category is not None
    assert res.ground_truth_comparison.has_ground_truth is True
    assert res.ground_truth_comparison.actual_values["T2M"] is not None
    assert res.ground_truth_comparison.absolute_errors["T2M"] is not None
    assert len(res.recent_7d_context) == 7

def test_prediction_latest_date_situation_b():
    """Situation B: Latest available date 2025-12-31 -> Predicts 2026-01-01"""
    req = PredictionRequest(district="cuttack", selected_date="2025-12-31")
    res = predict_next_day(req)
    assert res.success is True
    assert res.input_date == "2025-12-31"
    assert res.prediction_date == "2026-01-01"
    assert res.data_status == "latest_observation_forecast"
    assert res.is_climatological_estimate is False
    assert res.predictions["T2M"].value is not None

def test_prediction_future_date_situation_c():
    """Situation C: Future date beyond dataset (e.g. 2026-10-29) -> Explains and returns climatology"""
    req = PredictionRequest(district="cuttack", selected_date="2026-10-29")
    res = predict_next_day(req)
    assert res.success is True
    assert res.input_date == "2026-10-29"
    assert res.prediction_date == "2026-10-30"
    assert res.is_climatological_estimate is True
    assert res.data_status == "stale_source_climatology_only"
    assert "beyond the current NASA POWER dataset" in res.disclaimer
    assert res.predictions["T2M"].value is not None

def test_prediction_invalid_district():
    req = PredictionRequest(district="non_existent_district", selected_date="2025-12-30")
    with pytest.raises(HTTPException) as exc:
        predict_next_day(req)
    assert exc.value.status_code == 400
    assert "not recognized" in exc.value.detail

def test_prediction_early_date_insufficient_lags():
    req = PredictionRequest(district="cuttack", selected_date="2001-01-05")
    with pytest.raises(HTTPException) as exc:
        predict_next_day(req)
    assert exc.value.status_code == 400
    assert "too early" in exc.value.detail

def test_prediction_history():
    hist = get_prediction_history(limit=5)
    assert "total" in hist
    assert "history" in hist

def test_climate_historical_pagination():
    data = get_historical_climate(district="cuttack", page=1, page_size=20)
    assert data["district"] == "cuttack"
    assert len(data["data"]) == 20
    assert data["total_records"] == 9131

def test_climate_aggregation_monthly():
    data = get_aggregated_climate(district="cuttack", aggregation_type="monthly")
    assert data["aggregation_type"] == "monthly"
    assert data["total_periods"] == 300  # 25 years * 12 months

def test_climate_aggregation_annual():
    data = get_aggregated_climate(district="cuttack", aggregation_type="annual")
    assert data["aggregation_type"] == "annual"
    assert data["total_periods"] == 25  # 25 years

def test_climate_summary():
    data = get_climate_summary(district="cuttack")
    assert data["district"] == "cuttack"
    assert data["total_days"] == 9131
    assert "T2M" in data["variables"]
    assert "PRECTOTCORR" in data["variables"]

def test_climate_trends():
    data = get_climate_trends(district="cuttack")
    assert data["total_trends"] == 6  # 6 variables for cuttack
    first = data["trends"][0]
    assert first["district"] == "cuttack"
    assert "sen_slope_per_year" in first
    assert "kendall_tau" in first

def test_climate_anomalies():
    data = get_climate_anomalies(district="cuttack")
    assert len(data["annual_anomalies"]) == 25
    assert len(data["recent_extremes"]) > 0
    assert "method_disclaimer" in data

def test_models_metadata():
    data = get_models()
    assert data["total_models"] == 6

def test_models_performance():
    data = get_model_performance()
    assert len(data["multi_target_models"]) == 12  # 6 targets * 2 stages (val, test)
    assert data["baseline_model"] is not None
    assert len(data["district_test_breakdown"]) == 15
    assert len(data["limitations"]) > 0

def test_dashboard_summary():
    data = get_dashboard_summary()
    assert data["total_districts"] == 15
    assert len(data["districts"]) == 15
    assert len(data["recent_climate_series"]) == 30
    assert len(data["key_findings"]) >= 4


def test_geospatial_default_latest_ml_forecast():
    resp = get_geospatial_predictions()
    assert resp.success is True
    assert resp.prediction_date == "2026-01-01"
    assert resp.prediction_type == "ml_prediction"
    assert resp.data_status == "latest_observation_forecast"
    assert resp.is_climatological_estimate is False
    assert resp.total_districts == 15
    assert resp.available_districts == 15
    assert len(resp.districts) == 15
    for d in resp.districts:
        assert d.status == "available"
        assert d.T2M is not None
        assert d.RH2M is not None
        assert d.PRECTOTCORR is not None
        assert d.WS2M is not None
        assert d.rainfall_category is not None


def test_geospatial_historical_ml_with_ground_truth():
    resp = get_geospatial_predictions(prediction_date="2025-12-31", mode="prediction")
    assert resp.prediction_type == "ml_prediction"
    assert resp.available_districts == 15
    assert all(d.ground_truth is not None and "T2M" in d.ground_truth for d in resp.districts)


def test_geospatial_future_stale_climatology():
    resp = get_geospatial_predictions(prediction_date="2026-11-12", mode="prediction")
    assert resp.prediction_type == "climatological_estimate"
    assert resp.data_status == "stale_source_climatology_only"
    assert resp.is_climatological_estimate is True
    assert resp.available_districts == 15
    assert all(d.status == "climatological_estimate" for d in resp.districts)


def test_geospatial_observation_mode():
    resp = get_geospatial_predictions(prediction_date="2025-08-15", mode="observation")
    assert resp.prediction_type == "historical_observation"
    assert resp.available_districts == 15
    assert all(d.status == "available" and d.T2M is not None for d in resp.districts)


def test_geospatial_early_insufficient_lags_unavailable():
    resp = get_geospatial_predictions(prediction_date="2001-01-05", mode="prediction")
    assert resp.prediction_type == "unavailable"
    assert resp.available_districts == 0
    assert all(d.status == "unavailable" and d.T2M is None for d in resp.districts)


def test_geospatial_invalid_inputs():
    with pytest.raises(HTTPException) as exc_info:
        get_geospatial_predictions(prediction_date="invalid-date", mode="prediction")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info2:
        get_geospatial_predictions(prediction_date="2026-01-01", mode="invalid_mode")
    assert exc_info2.value.status_code == 400
