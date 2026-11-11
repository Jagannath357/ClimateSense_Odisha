"""Create human-readable forecast fields without changing raw numeric values."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import pandas as pd
from climatesense.formatting import format_forecast_date, format_rainfall, format_temperature, rainfall_description
root = Path(__file__).resolve().parents[1]; output_dir = root / "outputs/metrics"
candidate_outputs = sorted(output_dir.glob("tomorrow_predictions_current*.csv"), key=lambda path: path.stat().st_mtime, reverse=True)
if not candidate_outputs: raise SystemExit("Run scripts/predict_tomorrow.py first.")
source = candidate_outputs[0]
df = pd.read_csv(source)
if "district" not in df.columns or "predicted_temperature_C" not in df.columns:
    raise SystemExit("The forecast file is not the current four-variable wide schema. Run scripts/predict_tomorrow.py first.")
df["forecast_date_display"] = df["forecast_date"].map(format_forecast_date)
df["predicted_temperature_display"] = df["predicted_temperature_C"].map(format_temperature)
df["predicted_rainfall_display"] = df["predicted_rainfall_mm_day"].map(format_rainfall)
df["predicted_humidity_display"] = df["predicted_humidity_pct"].map(lambda value: f"{value:.1f}%" if pd.notna(value) else "Unavailable")
df["predicted_wind_speed_display"] = df["predicted_wind_speed_m_s"].map(lambda value: f"{value:.1f} m/s" if pd.notna(value) else "Unavailable")
df["rainfall_description"] = df["predicted_rainfall_mm_day"].map(rainfall_description)
csv_path = root / "outputs/metrics/tomorrow_predictions_display.csv"
excel_path = root / "outputs/metrics/tomorrow_predictions_display.xlsx"
df.to_csv(csv_path, index=False)
try:
    df.to_excel(excel_path, index=False, engine="openpyxl")
    print(f"Saved presentation-formatted output for {len(df):,} rows to CSV and Excel ({excel_path.name}).")
except Exception as e:
    print(f"Saved presentation-formatted output for {len(df):,} rows to CSV. (Excel export note: {e})")

