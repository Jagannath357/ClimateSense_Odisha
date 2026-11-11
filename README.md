# ClimateSense Odisha

**Intelligent Climate Monitoring, Analytics & Next-Day Weather Prediction for Odisha**

ClimateSense Odisha is a comprehensive, production-grade meteorological analytics and machine learning web application. It ingests 25 years (2001–2025) of NASA POWER daily agro-climatological observations across 15 districts in the State of Odisha, India, and provides leakage-safe, next-day weather predictions across 6 physical targets: Mean Temperature (`T2M`), Max Temperature (`T2M_MAX`), Min Temperature (`T2M_MIN`), Relative Humidity (`RH2M`), Wind Speed (`WS2M`), and Corrected Precipitation (`PRECTOTCORR`) via a dual-stage hurdle architecture.

---

## Repository Structure

```
ClimateSense_Odisha/
├── ml/            # Machine learning pipeline, datasets, models, metrics, and reports
├── backend/       # FastAPI REST API with in-memory model registry and inference services
├── frontend/      # React 18 + Vite + TypeScript ClimateTech responsive dashboard
└── docs/          # Complete architectural, API, ML analysis, and testing documentation
```

---

## Quick Start (Windows PowerShell)

### Terminal 1 — Backend API

```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
..\ml\.venv\Scripts\Activate.ps1

# Install backend dependencies (if not already installed)
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Base:** [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### Terminal 2 — Frontend Application

```powershell
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

- **Frontend Application URL:** [http://localhost:5173](http://localhost:5173)

---

## Running the Automated Test Suites

### Backend Tests (19 Test Cases)
```powershell
.\ml\.venv\Scripts\python.exe -m pytest backend/tests -v
```

### ML Pipeline Tests (7 Test Cases)
```powershell
cd ml
.\.venv\Scripts\python.exe -m pytest tests -v
```

### Frontend Production Build & Type Verification
```powershell
cd frontend
npm run build
```

---

## Documentation

Full technical documentation is located in the [`docs/`](file:///d:/HackathonProjects/ClimateSense_Odisha/docs) folder:
- [ML Folder Analysis](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/ML_FOLDER_ANALYSIS.md)
- [Project Architecture](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/PROJECT_ARCHITECTURE.md)
- [Backend Documentation](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/BACKEND_DOCUMENTATION.md)
- [Frontend Documentation](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/FRONTEND_DOCUMENTATION.md)
- [API Documentation](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/API_DOCUMENTATION.md)
- [Model Integration](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/MODEL_INTEGRATION.md)
- [Prediction Methodology](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/PREDICTION_METHODOLOGY.md)
- [Testing Report](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/TESTING_REPORT.md)
- [Dataset Documentation](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/DATASET_DOCUMENTATION.md)
- [Project Status & Verification Checklist](file:///d:/HackathonProjects/ClimateSense_Odisha/docs/PROJECT_STATUS.md)

