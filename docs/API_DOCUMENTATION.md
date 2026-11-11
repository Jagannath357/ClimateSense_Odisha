# ClimateSense Odisha — API Documentation

**API Version:** 1.0.0  
**Base URL:** `http://127.0.0.1:8000/api`  
**Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`  
**ReDoc Documentation:** `http://127.0.0.1:8000/redoc`  

---

## 1. System Endpoints

### 1.1 Health Check
- **Route:** `GET /health`
- **Description:** Verifies service health, dataset readiness, and active model count.
- **Response Example:**
```json
{
  "status": "healthy",
  "service": "ClimateSense Odisha",
  "version": "1.0.0",
  "timestamp": "2026-11-05T10:45:00Z",
  "components": {
    "dataset": {
      "status": "ready",
      "total_rows": 136965,
      "districts_count": 15,
      "date_range": "2001-01-01 to 2025-12-31"
    },
    "models": {
      "status": "ready",
      "active_models_count": 6,
      "supported_targets": ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "PRECTOTCORR"]
    }
  }
}
```

---

## 2. Dataset Endpoints

### 2.1 List Monitored Districts
- **Route:** `GET /districts`
- **Description:** Returns all 15 supported Odisha districts with coordinates, elevation, and region.

### 2.2 Dataset Information
- **Route:** `GET /dataset/info`
- **Description:** Dataset metadata, source, time basis, and MERRA-2 spatial resolution documentation.

### 2.3 Date Range
- **Route:** `GET /dataset/date-range`
- **Description:** Temporal boundaries (`2001-01-01` to `2025-12-31`, 25 years).

---

## 3. Prediction Endpoints

### 3.1 Next-Day Climate Prediction
- **Route:** `POST /predictions/next-day`
- **Request Body:**
```json
{
  "district": "cuttack",
  "selected_date": "2025-12-30"
}
```
- **Response Structure (Situation A Example):**
```json
{
  "success": true,
  "district": "cuttack",
  "district_display_name": "Cuttack",
  "input_date": "2025-12-30",
  "prediction_date": "2025-12-31",
  "prediction_type": "next_day",
  "data_status": "historical_observation_available",
  "is_climatological_estimate": false,
  "data_gap_days": 0,
  "latest_available_date": "2025-12-31",
  "predictions": {
    "T2M": {
      "target": "T2M",
      "display_name": "Average Temperature",
      "value": 17.03,
      "unit": "°C",
      "status": "available",
      "model_name": "HistGradientBoostingRegressor (1-Day Lag Pipeline)"
    },
    "PRECTOTCORR": {
      "target": "PRECTOTCORR",
      "display_name": "Precipitation",
      "value": 0.0,
      "unit": "mm/day",
      "status": "available",
      "model_name": "Two-Stage Hurdle (HistGradientBoosting Classifier + Regressor)",
      "rainfall_probability": 0.0385,
      "rainfall_category": {
        "category": "No Rainfall",
        "description": "No measurable precipitation (0 mm)",
        "badge_color": "emerald"
      }
    },
    "RH2M": { "value": 72.85, "unit": "%", "status": "available" },
    "WS2M": { "value": 1.25, "unit": "m/s", "status": "available" }
  },
  "ground_truth_comparison": {
    "has_ground_truth": true,
    "date": "2025-12-31",
    "note": "Historical actual observation retrieved post-hoc for verification; was strictly withheld from model input features.",
    "actual_values": { "T2M": 17.07, "PRECTOTCORR": 0.0, "RH2M": 73.1, "WS2M": 1.3 },
    "absolute_errors": { "T2M": 0.04, "PRECTOTCORR": 0.0, "RH2M": 0.25, "WS2M": 0.05 }
  },
  "disclaimer": "Forecast generated from historical observations on the selected date using the trained multi-target lag models."
}
```

### 3.2 Prediction History
- **Route:** `GET /predictions/history?limit=20`
- **Description:** Returns the recent prediction log.

---

## 4. Climate Data Endpoints

### 4.1 Historical Records
- **Route:** `GET /climate/historical?district=cuttack&page=1&page_size=50&start_date=2024-01-01&end_date=2024-12-31`
- **Description:** Paginated daily records with district and date filtering.

### 4.2 Aggregated Series
- **Route:** `GET /climate/aggregated?district=cuttack&aggregation_type=monthly`
- **Description:** Monthly or annual aggregated means and precipitation totals.

### 4.3 Statistical Climate Trends
- **Route:** `GET /climate/trends?district=cuttack&variable=T2M`
- **Description:** Theil–Sen slope per year, confidence intervals, Kendall tau, and $p$-values.

### 4.4 Climate Anomalies & Extremes
- **Route:** `GET /climate/anomalies?district=cuttack`
- **Description:** Annual departures from 2001–2010 baseline & daily extreme excursions ($|Z| \ge 2.5$).

---

## 5. Model Endpoints

### 5.1 Model Registry
- **Route:** `GET /models`
- **Description:** Hyperparameters, feature columns, and version metadata for all trained models.

### 5.2 Model Performance
- **Route:** `GET /models/performance`
- **Description:** Recorded validation and test metrics (MAE, RMSE, $R^2$, Hurdle F1/ROC-AUC), baseline comparisons, and district test breakdowns.

