"""Interactively generate next-day predictions for one Odisha district."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from datetime import datetime, timedelta, timezone
import numpy as np
import pandas as pd
from joblib import load

from climatesense.formatting import format_forecast_date, format_rainfall, format_temperature, rainfall_description

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data/processed/climate_daily_cleaned.csv"
MODEL_DIR = ROOT / "models/multi_target"
TARGETS = {"T2M": ("Temperature", "deg C"), "PRECTOTCORR": ("Rainfall", "mm/day"), "RH2M": ("Humidity", "%"), "WS2M": ("Wind speed", "m/s")}

def parse_date(value: str) -> datetime:
    for pattern in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value.strip(), pattern)
        except ValueError:
            continue
    raise ValueError("Use a date such as 2026-10-29 or 29-10-2026.")

def add_target_features(frame: pd.DataFrame, target: str) -> tuple[pd.DataFrame, list[str]]:
    result = frame.copy().sort_values(["district", "date"]).reset_index(drop=True)
    group = result.groupby("district", sort=False)[target]
    lag_columns = []
    for lag in [1, 2, 3, 7, 14]:
        name = f"{target}_lag_{lag}"; result[name] = group.shift(lag); lag_columns.append(name)
    rolling = f"{target}_rolling_7d"
    result[rolling] = group.transform(lambda values: values.shift(1).rolling(7, min_periods=5).mean())
    result["month"] = result.date.dt.month; result["day_of_year"] = result.date.dt.day_of_year
    result["month_sin"] = np.sin(2 * np.pi * result.month / 12); result["month_cos"] = np.cos(2 * np.pi * result.month / 12)
    return result, ["district", "month", "day_of_year", "month_sin", "month_cos", *lag_columns, rolling]

def main() -> None:
    if not DATA_FILE.exists():
        raise SystemExit("Processed data not found. Run: python scripts/run_preprocessing.py")
    data = pd.read_csv(DATA_FILE, parse_dates=["date"])
    districts = sorted(data["district"].dropna().astype(str).unique())
    print("\nClimateSense Odisha - Four-Variable Next-Day Prediction\n")
    print("Available districts:")
    print(", ".join(districts))
    try:
        reference_date = parse_date(input("\nEnter reference date (YYYY-MM-DD): "))
    except ValueError as error:
        raise SystemExit(f"Invalid date: {error}")
    district_input = input("Enter district name: ").strip().lower()
    district_map = {district.lower(): district for district in districts}
    if district_input not in district_map:
        raise SystemExit(f"District not found. Choose one of: {', '.join(districts)}")
    district = district_map[district_input]
    forecast_date = reference_date + timedelta(days=1)
    district_data = data[(data["district"] == district) & (data["date"] <= pd.Timestamp(reference_date))].copy()
    if district_data.empty:
        raise SystemExit(f"No observations are available for {district} on or before {reference_date.date()}.")
    latest_observation = district_data["date"].max()
    data_gap_days = (pd.Timestamp(reference_date.date()) - latest_observation).days
    fresh = data_gap_days <= 7
    values = {}; statuses = {}; model_names = {}; rainfall_probability = None
    district_data["month_day"] = district_data["date"].dt.strftime("%m-%d")
    historical = district_data[district_data["month_day"] == forecast_date.strftime("%m-%d")]
    for target in TARGETS:
        model_path = MODEL_DIR / f"{target}.joblib"
        if fresh and model_path.exists():
            prepared, _ = add_target_features(district_data.drop(columns=["month_day"]), target)
            prediction_row = prepared[prepared["district"] == district].tail(1).copy()
            prediction_row["month"] = forecast_date.month; prediction_row["day_of_year"] = forecast_date.timetuple().tm_yday
            prediction_row["month_sin"] = np.sin(2 * np.pi * forecast_date.month / 12); prediction_row["month_cos"] = np.cos(2 * np.pi * forecast_date.month / 12)
            artifact = load(model_path); feature_columns = artifact["feature_columns"]
            if prediction_row[feature_columns].isna().any(axis=None):
                values[target] = None; statuses[target] = "unavailable_missing_lag_features"; model_names[target] = "none"; continue
            if target == "PRECTOTCORR":
                rainfall_probability = float(artifact["occurrence"].predict_proba(prediction_row[feature_columns])[:, 1][0])
                amount = max(0.0, float(np.expm1(artifact["amount"].predict(prediction_row[feature_columns])[0])))
                values[target] = amount if rainfall_probability >= 0.5 else 0.0; model_names[target] = "rain_occurrence_plus_amount"
            else:
                values[target] = float(artifact["model"].predict(prediction_row[feature_columns])[0]); model_names[target] = f"lag_{target.lower()}_hist_gradient_boosting"
            statuses[target] = "available"
        elif not historical.empty and pd.notna(historical[target].mean()):
            values[target] = float(historical[target].mean()); statuses[target] = "climatological_estimate"; model_names[target] = "same_calendar_day_mean"
        else:
            values[target] = None; statuses[target] = "unavailable_missing_data"; model_names[target] = "none"
    print("\n" + "=" * 72)
    print("ClimateSense Odisha - Prediction Result")
    print("=" * 72)
    print(f"District                  : {district.title()}")
    print(f"Reference date            : {format_forecast_date(reference_date)}")
    print(f"Prediction date           : {format_forecast_date(forecast_date)}")
    print(f"Latest usable observation : {latest_observation.date().isoformat()}")
    print(f"Data gap at reference     : {data_gap_days} day(s)")
    print("-" * 72)
    print(f"Predicted Temperature     : {format_temperature(values['T2M'])} [{statuses['T2M']}]")
    print(f"Predicted Rainfall        : {format_rainfall(values['PRECTOTCORR'])} [{statuses['PRECTOTCORR']}]")
    print(f"Rainfall description      : {rainfall_description(values['PRECTOTCORR'])}")
    print(f"Predicted Humidity        : {values['RH2M']:.1f}% [{statuses['RH2M']}]" if values['RH2M'] is not None else "Predicted Humidity        : Unavailable")
    print(f"Predicted Wind speed      : {values['WS2M']:.1f} m/s [{statuses['WS2M']}]" if values['WS2M'] is not None else "Predicted Wind speed      : Unavailable")
    if rainfall_probability is not None:
        print(f"Rainfall occurrence probability: {rainfall_probability:.3f}")
    print("-" * 72)
    print(f"Temperature model         : {model_names['T2M']}")
    print(f"Rainfall model            : {model_names['PRECTOTCORR']}")
    print(f"Humidity model            : {model_names['RH2M']}")
    print(f"Wind-speed model          : {model_names['WS2M']}")
    print(f"Generated at              : {datetime.now(timezone.utc).isoformat()}")
    print(f"Data quality status       : {'fresh_for_model_forecast' if fresh else 'stale_source_climatology_only'}")
    if not fresh:
        print("Note                      : Historical estimate, not a live weather forecast.")
    print("=" * 72)

if __name__ == "__main__":
    main()
