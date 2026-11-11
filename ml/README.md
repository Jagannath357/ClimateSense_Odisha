# ClimateSense Odisha

Reproducible inspection, preprocessing, EDA, feature engineering, chronological splitting, and baseline regression for district-wise NASA POWER daily climate CSV exports.

## Dataset

Place district CSVs in `data/raw/`. The current 15 files are NASA POWER exports covering 2001–2025. The loader parses their metadata block, records coordinates and UTC/LST time basis, converts `-999` to missing, and preserves `source_file` and `district`.

## Windows PowerShell commands

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/inspect_datasets.py
python scripts/run_preprocessing.py
python scripts/run_eda.py
python scripts/prepare_splits.py
python -m pytest
python scripts/run_training.py
python scripts/generate_final_predictions.py
```

Training is separate from preprocessing and EDA. Artifacts are written under `outputs/`; cleaned data and splits are under `data/processed/` and `data/splits/`.

After training, `generate_final_predictions.py` evaluates the saved model once on the untouched test period and writes row-level predictions, residuals, final metrics, district-level metrics, plots, and `outputs/reports/FINAL_TEST_REPORT.md`.

For a one-day-ahead result, run `python scripts/predict_tomorrow.py`. It writes one row per district to `outputs/metrics/tomorrow_predictions_current.csv` (or a timestamped `tomorrow_predictions_current_*.csv` replacement if Windows has the current file open). The row contains separate predictions and status fields for temperature (`T2M`), rainfall (`PRECTOTCORR`), humidity (`RH2M`), and wind speed (`WS2M`). With fresh data, target-specific lag models are used; when the local source is stale, numeric values are historical same-calendar-day estimates labeled `climatological_estimate`, not current weather forecasts.

Run `python scripts/run_multi_target_training.py` for separate temperature, humidity, wind, and rainfall models. Rainfall uses separate occurrence and positive-amount models. Run `python scripts/run_climate_trends.py` for observed annual anomalies and district-wise Theil–Sen/Kendall trend statistics. Run `python scripts/validate_data_freshness.py` to inspect source coverage and freshness.

Run `python scripts/format_prediction_outputs.py` for presentation-ready temperature/rainfall labels while retaining the raw numeric prediction fields. See `docs/OUTPUT_FORMATTING.md` and `docs/RAINFALL_MODEL_FINDINGS.md`.

For an interactive district prediction, run `python scripts/interactive_next_day_prediction.py`, enter a reference date such as `2026-10-29`, and enter a district such as `angul`. The script automatically predicts the next calendar date and prints temperature and rainfall in the console.

## Safeguards

Raw inputs are never modified. Missing values are retained rather than filled blindly. District identifiers and source files are preserved. Splitting is chronological and the test period is not used for fitting. The current model is a baseline; the final target and forecast design require a domain decision.
