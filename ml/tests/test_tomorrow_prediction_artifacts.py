from pathlib import Path
import json
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

def test_tomorrow_prediction_artifacts_exist():
    candidates = list((ROOT / "outputs/metrics").glob("tomorrow_predictions_current*.csv"))
    prediction_path = max(candidates, key=lambda path: path.stat().st_mtime)
    summary_path = ROOT / "outputs/metrics/tomorrow_prediction_summary.json"
    assert prediction_path.exists()
    assert summary_path.exists()
    predictions = pd.read_csv(prediction_path)
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    required = {
        "district", "last_observed_date", "forecast_date",
        "predicted_temperature_C", "predicted_temperature_C_status",
        "predicted_rainfall_mm_day", "predicted_rainfall_mm_day_status",
        "predicted_humidity_pct", "predicted_humidity_pct_status",
        "predicted_wind_speed_m_s", "predicted_wind_speed_m_s_status",
        "temperature_model", "rainfall_model", "humidity_model", "wind_speed_model",
        "generated_at", "data_quality_status", "data_gap_days",
    }
    assert len(predictions) == summary["districts"]
    assert required.issubset(predictions.columns)
    for column in ["predicted_temperature_C", "predicted_rainfall_mm_day", "predicted_humidity_pct", "predicted_wind_speed_m_s"]:
        assert predictions[column].notna().all()
    for column in ["predicted_temperature_C_status", "predicted_rainfall_mm_day_status", "predicted_humidity_pct_status", "predicted_wind_speed_m_s_status"]:
        assert (predictions[column] == "climatological_estimate").all()
    assert (predictions["data_quality_status"] == "stale_source_climatology_only").all()
