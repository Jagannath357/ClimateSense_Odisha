# ClimateSense Odisha — Testing & Validation Report

**Test Date:** November 2026  
**Execution Environment:** Windows PowerShell, Python 3.14.2, Node.js v22.11.0  
**Test Suites:**
1. ML Pipeline Suite (`ml/tests/`)
2. Backend API & Inference Suite (`backend/tests/`)
3. Frontend TypeScript & Production Build (`frontend/`)

---

## 1. Machine Learning Pipeline Test Suite

- **Command:** `python -m pytest tests` (inside `ml/`)
- **Status:** **7 PASSED** (0 failed) in 1.16s
- **Coverage:**
  - `test_final_prediction_artifacts.py`: Verified baseline evaluation artifacts, predictions CSV structure, and residual distributions.
  - `test_formatting.py`: Verified presentation formatting functions for temperature, precipitation amounts, and categories.
  - `test_pipeline.py`: Verified NASA POWER header parsing, metadata extraction, missing sentinel handling, and chronological splitting.
  - `test_tomorrow_prediction_artifacts.py`: Verified 4-variable output schema, status codes, and data gap calculations.

---

## 2. Backend API & Integration Test Suite

- **Command:** `python -m pytest backend/tests -v`
- **Status:** **19 PASSED** (0 failed) in 5.45s
- **Test Matrix:**

| Test Case | Method / Route | Scenario Tested | Result |
|---|---|---|---|
| `test_health_endpoint` | `GET /api/health` | Health status, dataset readiness, 6 models | **PASSED** |
| `test_districts_endpoint` | `GET /api/districts` | 15 districts with coordinates & elevation | **PASSED** |
| `test_dataset_info_endpoint` | `GET /api/dataset/info` | Dates, rows (136,965), MERRA-2 note | **PASSED** |
| `test_dataset_date_range_endpoint` | `GET /api/dataset/date-range` | 2001-01-01 to 2025-12-31 | **PASSED** |
| `test_prediction_historical_date_situation_a` | `POST /api/predictions/next-day` | Date `2025-12-30` -> `2025-12-31`, ground truth delta | **PASSED** |
| `test_prediction_latest_date_situation_b` | `POST /api/predictions/next-day` | Date `2025-12-31` -> `2026-01-01`, forward forecast | **PASSED** |
| `test_prediction_future_date_situation_c` | `POST /api/predictions/next-day` | Date `2026-10-29` -> `2026-10-30`, climatology fallback | **PASSED** |
| `test_prediction_invalid_district` | `POST /api/predictions/next-day` | Rejection of non-existent district (HTTP 400) | **PASSED** |
| `test_prediction_early_date_insufficient_lags` | `POST /api/predictions/next-day` | Rejection of date &lt; 14 days from start (HTTP 400) | **PASSED** |
| `test_prediction_history` | `GET /api/predictions/history` | Logging and retrieval of prediction events | **PASSED** |
| `test_climate_historical_pagination` | `GET /api/climate/historical` | Paged queries, total records (9,131/district) | **PASSED** |
| `test_climate_aggregation_monthly` | `GET /api/climate/aggregated` | 300 monthly periods (25 years × 12 months) | **PASSED** |
| `test_climate_aggregation_annual` | `GET /api/climate/aggregated` | 25 annual periods | **PASSED** |
| `test_climate_summary` | `GET /api/climate/summary` | Descriptive statistics (mean, std, min, max) | **PASSED** |
| `test_climate_trends` | `GET /api/climate/trends` | Theil–Sen slope and Kendall tau retrieval | **PASSED** |
| `test_climate_anomalies` | `GET /api/climate/anomalies` | 25 annual anomalies & daily extreme Z-scores | **PASSED** |
| `test_models_metadata` | `GET /api/models` | Metadata and hyperparameters for 6 targets | **PASSED** |
| `test_models_performance` | `GET /api/models/performance` | Validation vs Test metrics and baseline contrast | **PASSED** |
| `test_dashboard_summary` | `GET /api/dashboard/summary` | State averages, district cards, 30-day series | **PASSED** |

---

## 3. Frontend Production Build & Type Verification

- **Command:** `npm run build --prefix frontend`
- **Status:** **Clean Build (0 errors)** in 15.44s
- **Output:**
  - `dist/index.html`: 1.03 kB
  - `dist/assets/index-*.css`: 37.38 kB (Tailwind utility classes)
  - `dist/assets/index-*.js`: 645.28 kB (React + Recharts bundle)

---

## 4. End-to-End Prediction Verification

A direct numerical comparison between standalone model inference and the integrated FastAPI endpoint was executed:
- **Input:** Cuttack, 2025-12-30.
- **Model T2M Prediction:** 17.03 °C
- **Dataset Ground Truth (2025-12-31):** 17.07 °C
- **Observed Absolute Error:** 0.04 °C
- **Precipitation Prediction:** 0.00 mm/day ("No Rainfall", prob = 3.85%)
- **Dataset Ground Truth Precipitation:** 0.00 mm/day
The API output matches standalone model inference within numerical float precision.

