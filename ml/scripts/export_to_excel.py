"""Export ClimateSense Odisha prediction outputs and evaluation metrics to an Excel (.xlsx) file."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
METRICS_DIR = ROOT / "outputs/metrics"
EXCEL_OUTPUT = METRICS_DIR / "ClimateSense_Odisha_Predictions.xlsx"

def main() -> None:
    METRICS_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Predictions Display (Formatted)
    display_csv = METRICS_DIR / "tomorrow_predictions_display.csv"
    current_csv = METRICS_DIR / "tomorrow_predictions_current.csv"
    
    if not display_csv.exists() and not current_csv.exists():
        print("Predictions not found. Please run 'python scripts/predict_tomorrow.py' and 'python scripts/format_prediction_outputs.py' first.")
        return

    with pd.ExcelWriter(EXCEL_OUTPUT, engine="openpyxl") as writer:
        # Sheet 1: Human-readable display predictions
        if display_csv.exists():
            df_display = pd.read_csv(display_csv)
            # Reorder columns for optimal readability in Excel
            lead_cols = [
                "district", "forecast_date", "forecast_date_display",
                "predicted_temperature_display", "predicted_rainfall_display", "rainfall_description",
                "predicted_humidity_display", "predicted_wind_speed_display",
                "data_quality_status", "forecast_note"
            ]
            ordered = [c for c in lead_cols if c in df_display.columns] + [c for c in df_display.columns if c not in lead_cols]
            df_display[ordered].to_excel(writer, sheet_name="Next_Day_Predictions", index=False)
            print("  Added sheet: Next_Day_Predictions")

        # Sheet 2: Raw numeric model predictions
        if current_csv.exists():
            df_raw = pd.read_csv(current_csv)
            df_raw.to_excel(writer, sheet_name="Raw_Predictions", index=False)
            print("  Added sheet: Raw_Predictions")

        # Sheet 3: Multi-target test metrics
        multi_metrics_csv = METRICS_DIR / "multi_target_metrics.csv"
        if multi_metrics_csv.exists():
            df_metrics = pd.read_csv(multi_metrics_csv)
            df_metrics.to_excel(writer, sheet_name="Model_Evaluation_Metrics", index=False)
            print("  Added sheet: Model_Evaluation_Metrics")

        # Sheet 4: District-level test metrics
        district_metrics_csv = METRICS_DIR / "final_test_metrics_by_district.csv"
        if district_metrics_csv.exists():
            df_district = pd.read_csv(district_metrics_csv)
            df_district.to_excel(writer, sheet_name="District_Test_Metrics", index=False)
            print("  Added sheet: District_Test_Metrics")

    print(f"\nExcel workbook created successfully at:\n  {EXCEL_OUTPUT}")

if __name__ == "__main__":
    main()

