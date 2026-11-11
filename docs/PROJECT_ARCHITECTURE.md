# ClimateSense Odisha — System Architecture

**Project Name:** ClimateSense Odisha  
**Sub-title:** Intelligent Climate Monitoring, Analytics & Next-Day Weather Prediction for Odisha  
**Architecture Document Version:** 1.0.0  
**Last Updated:** November 2026  

---

## 1. Architectural Blueprint & Topology

ClimateSense Odisha is architected as an academic, decoupled three-tier system:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER (Frontend)                    │
│   React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons + Recharts│
│   ├── Overview Dashboard (State-wide KPIs, 30-Day Series, District Cards│
│   ├── Next-Day Prediction (Interactive Form, Presets, Error Deltas)    │
│   ├── Historical Climate (Daily, Monthly & Annual Exploration, CSV)    │
│   ├── Climate Trends (Theil–Sen Slopes & Kendall Tau Rank Tests)       │
│   ├── Anomaly Detection (2001–2010 Baseline Departures & Extremes)     │
│   ├── Model Performance (Validation vs Test Metrics, Baseline Contrast)│
│   └── About Project (Data Provenance & MERRA-2 Grid Mesh Findings)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / JSON (CORS Enabled)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION TIER (Backend API)                  │
│   FastAPI (Python 3.14) + Pydantic v2 + Uvicorn Async Server           │
│   ├── Centralized Lifespan Loader (In-memory Caching on Startup)       │
│   ├── ModelService (Loads Joblib Artifacts, Parameters, Metrics)       │
│   ├── ClimateService (Data Indexing, Historical Paging, Aggregations)  │
│   ├── PredictionService (Situation A/B/C Router, Lags, Hurdle Rain)    │
│   └── Prediction History Storage (Lightweight Append-only JSON)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Direct Filesystem & Artifact Links
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATA & MODEL TIER (Primary Source of Truth)        │
│   Existing `ml/` Directory (Unmodified Source Artifacts)               │
│   ├── Raw Datasets: `ml/data/raw/*.csv` (15 NASA POWER local exports)  │
│   ├── Cleaned Data: `ml/data/processed/climate_daily_cleaned.csv`      │
│   ├── Partitions: `ml/data/splits/{train,validation,test}.csv`         │
│   ├── Trained Models: `ml/models/multi_target/{T2M,RH2M,WS2M,...}.joblib│
│   ├── Metric Reports: `ml/outputs/metrics/{multi_target,trends,...}.csv│
│   └── Feature Logic: `ml/src/climatesense/{pipeline,formatting}.py`    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```text
ClimateSense_Odisha/
├── ml/                                 # Primary source of truth (ML codebase)
│   ├── configs/config.yaml             # Pipeline hyperparameters & split ratios
│   ├── data/
│   │   ├── raw/                        # 15 NASA POWER district CSV files
│   │   ├── processed/                  # climate_daily_cleaned.csv (136,965 rows)
│   │   └── splits/                     # train.csv, validation.csv, test.csv
│   ├── models/
│   │   ├── baseline_hist_gradient_boosting.joblib
│   │   ├── tomorrow_lag_model.joblib
│   │   └── multi_target/               # 6 joblib models & metadata JSONs
│   ├── outputs/
│   │   ├── figures/                    # PNG correlation & time series charts
│   │   ├── metrics/                    # Performance JSONs & CSVs
│   │   └── reports/                    # Inventory & split summaries
│   ├── scripts/                        # Pipelines for ingestion, EDA, train, trends
│   ├── src/climatesense/               # Reusable Python modules
│   └── tests/                          # ML test suite
│
├── backend/                            # FastAPI backend application
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/              # health, dataset, predictions, climate, models, dashboard
│   │   │   └── router.py               # Combined API route aggregator
│   │   ├── core/                       # config.py, constants.py
│   │   ├── schemas/                    # Pydantic v2 schemas for all payloads
│   │   ├── services/                   # model_service, climate_service, prediction_service
│   │   └── main.py                     # FastAPI application entry point
│   ├── data/                           # prediction_history.json
│   ├── tests/                          # 19 comprehensive pytest tests
│   ├── requirements.txt                # Python backend dependencies
│   ├── .env.example
│   └── README.md
│
├── frontend/                           # React 18 + Vite + TypeScript application
│   ├── src/
│   │   ├── components/                 # Navbar, Sidebar, Footer
│   │   ├── context/                    # ThemeContext (Dark/Light mode)
│   │   ├── pages/                      # 7 comprehensive responsive views
│   │   ├── services/                   # Centralized API client (api.ts)
│   │   ├── types/                      # Comprehensive TypeScript definitions
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
└── docs/                               # Complete project documentation
    ├── ML_FOLDER_ANALYSIS.md
    ├── PROJECT_ARCHITECTURE.md
    ├── BACKEND_DOCUMENTATION.md
    ├── FRONTEND_DOCUMENTATION.md
    ├── API_DOCUMENTATION.md
    ├── MODEL_INTEGRATION.md
    ├── PREDICTION_METHODOLOGY.md
    ├── TESTING_REPORT.md
    ├── DATASET_DOCUMENTATION.md
    └── PROJECT_STATUS.md
```

---

## 3. Communication Patterns & Boundaries

1. **In-Memory Loading Strategy:** Rather than reloading multi-megabyte CSV files or deserializing scikit-learn tree ensembles per HTTP request, the FastAPI application loads all 136,965 rows and 6 trained models into memory once during application startup.
2. **Stateless REST Operations:** All endpoints are stateless and idempotent, ensuring fast sub-millisecond response times.
3. **Data Integrity Boundary:** The raw CSV datasets (`ml/data/raw/`) and model files (`ml/models/`) are treated as read-only.
4. **Zero Data Leakage:** Lag features use strictly prior-day observations ($t \le T_{\text{input}}$). Post-hoc ground truth verification on the prediction date is performed strictly after model inference.

