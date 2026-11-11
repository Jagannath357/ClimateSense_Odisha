# ClimateSense Odisha — Backend Documentation

**Framework:** FastAPI (Python 3.14 / 3.10+)  
**Server:** Uvicorn ASGI  
**Validation:** Pydantic v2  
**Core Services Location:** `backend/app/services/`  

---

## 1. Architecture & Service Layer Design

The backend uses a service-oriented architecture:

### 1.1 `ModelService` (`backend/app/services/model_service.py`)
- **Pattern:** Thread-safe singleton (`get_instance()`).
- **Startup Ingestion:**
  - Loads 6 multi-target model pipelines from `ml/models/multi_target/{T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR}.joblib`.
  - Loads baseline model `ml/models/baseline_hist_gradient_boosting.joblib`.
  - Parses metadata JSON files (`model_metadata.json`, `*_metadata.json`).
  - Caches validation and held-out test evaluation metrics from `multi_target_metrics.json` and `final_test_metrics.json`.
- **In-Memory Cache:** Models remain resident in RAM, enabling instant inference execution.

### 1.2 `ClimateService` (`backend/app/services/climate_service.py`)
- **Dataset Storage:** Loads `ml/data/processed/climate_daily_cleaned.csv` into an indexed Pandas DataFrame.
- **District Metadata:** Maps district identifiers to physical names, coordinates (latitude, longitude), elevation, and geographic region.
- **Historical Query Engine:** Supports paginated daily climate record queries with optional start and end date filtering.
- **Aggregation Engine:** Provides monthly and annual means, totals, and observation counts.
- **Trends & Anomalies Provider:** Exposes Theil–Sen slope statistics, Kendall tau correlation, annual baseline departures (vs 2001–2010 normal), and daily extreme Z-score excursions.

### 1.3 `PredictionService` (`backend/app/services/prediction_service.py`)
- **Primary Function:** Implements the user-selected date-based next-day prediction algorithm ($T_{\text{pred}} = T_{\text{input}} + 1\text{ day}$).
- **Feature Pipeline:**
  - Categorical district encoding.
  - Target-specific lags ($t-1, t-2, t-3, t-7, t-14$).
  - 7-day rolling mean ending at $T_{\text{input}}$ (strictly avoiding future leakage).
  - Target forecast date calendar encodings (month, day of year, trigonometric sine/cosine).
- **Hurdle Rainfall Engine:** Executes occurrence classification followed by log-transformed positive amount regression.
- **Situation Router:**
  - **Situation A (Historical Date):** Generates ML prediction and performs post-hoc ground truth verification with error delta.
  - **Situation B (Latest Date 2025-12-31):** Generates forward forecast for 2026-01-01.
  - **Situation C (Future Date > 2025-12-31):** Provides honest stale-source notification and 25-year calendar-day climatological estimate.
- **History Logger:** Appends prediction events to `backend/data/prediction_history.json`.

---

## 2. API Endpoints Reference

| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/` | Root service status and API documentation URL |
| `GET` | `/api/health` | System health, dataset readiness, and model registry status |
| `GET` | `/api/districts` | List all 15 supported Odisha districts with coordinates |
| `GET` | `/api/dataset/info` | Dataset provenance, date boundaries, and data policies |
| `GET` | `/api/dataset/date-range`| Date boundaries (2001-01-01 to 2025-12-31) |
| `POST` | `/api/predictions/next-day` | User-selected date-based next-day climate prediction |
| `GET` | `/api/predictions/history` | Recent prediction history log (limit parameterized) |
| `GET` | `/api/climate/historical` | Paged daily climate records with district/date filters |
| `GET` | `/api/climate/aggregated` | Monthly or annual aggregated time series |
| `GET` | `/api/climate/summary` | Descriptive statistical summary per district |
| `GET` | `/api/climate/trends` | Statistical climate trends (Theil–Sen slope & Kendall tau) |
| `GET` | `/api/climate/anomalies` | Annual departures vs 2001–2010 baseline & extreme Z-scores |
| `GET` | `/api/models` | List all trained ML models, parameters, and metadata |
| `GET` | `/api/models/performance`| Recorded test metrics, baseline contrast, and district breakdown |
| `GET` | `/api/dashboard/summary` | High-level state overview, latest readings, and key findings |

---

## 3. Running & Testing

```powershell
# Activate project virtual environment
.\ml\.venv\Scripts\Activate.ps1

# Start FastAPI development server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Run comprehensive test suite (19 test cases)
python -m pytest backend/tests -v
```

