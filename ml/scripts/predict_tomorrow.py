"""Generate the four-variable next-day ClimateSense Odisha output."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import json
from datetime import date, datetime, timedelta, timezone
import numpy as np
import pandas as pd
from joblib import load

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/processed/climate_daily_cleaned.csv"
MODEL_DIR = ROOT / "models/multi_target"
OUTPUT_DIR = ROOT / "outputs/metrics"
TARGETS = {"T2M": ("predicted_temperature_C", "deg C"), "PRECTOTCORR": ("predicted_rainfall_mm_day", "mm/day"), "RH2M": ("predicted_humidity_pct", "%"), "WS2M": ("predicted_wind_speed_m_s", "m/s")}

def add_target_features(frame: pd.DataFrame, target: str) -> tuple[pd.DataFrame, list[str]]:
    result = frame.copy().sort_values(["district", "date"]).reset_index(drop=True); group = result.groupby("district", sort=False)[target]; lag_columns = []
    for lag in [1, 2, 3, 7, 14]:
        name = f"{target}_lag_{lag}"; result[name] = group.shift(lag); lag_columns.append(name)
    rolling = f"{target}_rolling_7d"; result[rolling] = group.transform(lambda values: values.shift(1).rolling(7, min_periods=5).mean())
    result["month"] = result.date.dt.month; result["day_of_year"] = result.date.dt.day_of_year; result["month_sin"] = np.sin(2 * np.pi * result.month / 12); result["month_cos"] = np.cos(2 * np.pi * result.month / 12)
    return result, ["district", "month", "day_of_year", "month_sin", "month_cos", *lag_columns, rolling]

def main() -> None:
    if not SOURCE.exists(): raise SystemExit("Processed data not found. Run scripts/run_preprocessing.py first.")
    data = pd.read_csv(SOURCE, parse_dates=["date"]).sort_values(["district", "date"]).reset_index(drop=True); requested_date = date.today() + timedelta(days=1); generated_at = datetime.now(timezone.utc).isoformat()
    latest = data.groupby("district", as_index=False).tail(1).copy(); latest["data_gap_days"] = (pd.Timestamp(requested_date) - latest["date"]).dt.days; max_gap_days = 7; requested_month_day = requested_date.strftime("%m-%d")
    climatology_data = data.assign(month_day=data.date.dt.strftime("%m-%d")); climatology = climatology_data[climatology_data.month_day == requested_month_day].groupby("district")[list(TARGETS)].agg(["mean", "count"])
    rows = []; model_names = {target: set() for target in TARGETS}
    for _, observation in latest.iterrows():
        district = observation.district; fresh = int(observation.data_gap_days) <= max_gap_days
        row = {"district": district, "last_observed_date": observation.date.date().isoformat(), "forecast_date": requested_date.isoformat(), "forecast_horizon_days": 1, "data_gap_days": int(observation.data_gap_days), "data_source": "NASA POWER daily local export", "generated_at": generated_at, "data_quality_status": "fresh_for_model_forecast" if fresh else "stale_source_climatology_only", "rainfall_occurrence_probability": np.nan}
        for target, (output_name, unit) in TARGETS.items():
            value = None; status = "unavailable_missing_model"; model_name = "none"; observations_used = 0
            if district in climatology.index: climatology_value = climatology.loc[district, (target, "mean")]; observations_used = int(climatology.loc[district, (target, "count")])
            else: climatology_value = np.nan
            model_path = MODEL_DIR / f"{target}.joblib"
            if fresh and model_path.exists():
                prepared, _ = add_target_features(data, target); prediction_row = prepared[prepared.district == district].tail(1).copy(); prediction_row["month"] = requested_date.month; prediction_row["day_of_year"] = requested_date.timetuple().tm_yday; prediction_row["month_sin"] = np.sin(2 * np.pi * requested_date.month / 12); prediction_row["month_cos"] = np.cos(2 * np.pi * requested_date.month / 12); artifact = load(model_path); feature_columns = artifact["feature_columns"]
                if target == "PRECTOTCORR":
                    probability = artifact["occurrence"].predict_proba(prediction_row[feature_columns])[:, 1][0]; positive = probability >= 0.5; amount = max(0.0, float(np.expm1(artifact["amount"].predict(prediction_row[feature_columns])[0]))); value = amount if positive else 0.0; model_name = "rain_occurrence_plus_amount"; row["rainfall_occurrence_probability"] = float(probability)
                else: value = float(artifact["model"].predict(prediction_row[feature_columns])[0]); model_name = f"lag_{target.lower()}_hist_gradient_boosting"
                status = "available"; model_names[target].add(model_name)
            elif pd.notna(climatology_value): value = float(climatology_value); status = "climatological_estimate"; model_name = "same_calendar_day_mean"; model_names[target].add(model_name)
            row[output_name] = value; row[f"{output_name}_status"] = status; row[f"{target.lower()}_unit"] = unit; row[f"{target.lower()}_model"] = model_name; row[f"{target.lower()}_climatology_observations"] = observations_used
        row["forecast_note"] = "One-day model forecast using recent lag features" if fresh else "Historical same-calendar-day estimate; not a live weather forecast"; rows.append(row)
    result = pd.DataFrame(rows).sort_values("district"); result["temperature_model"] = result["t2m_model"]; result["rainfall_model"] = result["prectotcorr_model"]; result["humidity_model"] = result["rh2m_model"]; result["wind_speed_model"] = result["ws2m_model"]
    columns = ["district", "last_observed_date", "forecast_date", "predicted_temperature_C", "predicted_temperature_C_status", "predicted_rainfall_mm_day", "predicted_rainfall_mm_day_status", "predicted_humidity_pct", "predicted_humidity_pct_status", "predicted_wind_speed_m_s", "predicted_wind_speed_m_s_status", "temperature_model", "rainfall_model", "humidity_model", "wind_speed_model", "generated_at", "data_quality_status", "forecast_horizon_days", "data_gap_days", "data_source", "forecast_note", "rainfall_occurrence_probability"]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True); prediction_output = OUTPUT_DIR / "tomorrow_predictions_current.csv"
    try: result[columns].to_csv(prediction_output, index=False)
    except PermissionError:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"); prediction_output = OUTPUT_DIR / f"tomorrow_predictions_current_{stamp}.csv"; result[columns].to_csv(prediction_output, index=False)
    summary = {"forecast_date": requested_date.isoformat(), "latest_source_date": data.date.max().date().isoformat(), "districts": len(result), "rows": len(result), "targets": list(TARGETS), "model_names": {key: sorted(value) for key, value in model_names.items()}, "max_allowed_data_gap_days": max_gap_days, "available_model_forecasts": int((result.data_quality_status == "fresh_for_model_forecast").sum()), "climatological_estimates": int((result.data_quality_status == "stale_source_climatology_only").sum()), "output_file": str(prediction_output)}
    (OUTPUT_DIR / "tomorrow_prediction_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8"); print(json.dumps(summary, indent=2)); print(f"Saved {len(result):,} four-variable district predictions to {prediction_output}")

if __name__ == "__main__": main()
