# ClimateSense Odisha — Backend Service

FastAPI-powered REST API for meteorological data exploration, statistical climate trends, and machine learning next-day weather forecasting for 15 districts across Odisha, India.

## Features
- **Centralized Model Registry:** Loads 6 multi-target gradient-boosted decision tree models and the baseline physical regressor once at application startup.
- **Leakage-Safe Next-Day Forecasting:** Implements exact 1-day, 2-day, 3-day, 7-day, 14-day lags, rolling 7-day averages, and cyclic trigonometric calendar encodings.
- **Two-Stage Hurdle Rainfall Model:** Predicts rainfall occurrence via `HistGradientBoostingClassifier` and positive log-transformed amounts via `HistGradientBoostingRegressor`.
- **Situation A / B / C Routing:** Transparently distinguishes between historical predictions, latest observation forecasts, and stale-source climatological estimates.
- **Historical Climate API:** Paginated daily records, monthly and annual aggregations, and multi-variable statistical summaries.
- **Empirical Climate Trends:** Theil–Sen robust slopes and Mann–Kendall monotonic trend tests across 90 district-variable series.
- **Baseline Anomalies & Extremes:** 2001–2010 normal baseline departures and daily climatological Z-score extreme detections.

## Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Dependencies in `requirements.txt`

## Running the Backend

From the repository root or `backend/` directory:

```powershell
# Using the existing project virtual environment:
.\ml\.venv\Scripts\Activate.ps1

# Start the development server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Interactive API Documentation
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

## Running Backend Tests

```powershell
.\ml\.venv\Scripts\python.exe -m pytest backend/tests -v
```

