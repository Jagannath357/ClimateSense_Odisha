from pathlib import Path
import os
from typing import List
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "ClimateSense Odisha")
    PROJECT_DESCRIPTION: str = "Intelligent Climate Monitoring, Analytics & Next-Day Weather Prediction for Odisha"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "t")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Path resolution
    ROOT_DIR: Path = Path(__file__).resolve().parents[3]
    ML_DIR: Path = ROOT_DIR / "ml"
    DATA_CLEANED_PATH: Path = ML_DIR / "data" / "processed" / "climate_daily_cleaned.csv"
    MODELS_DIR: Path = ML_DIR / "models" / "multi_target"
    BASELINE_MODEL_PATH: Path = ML_DIR / "models" / "baseline_hist_gradient_boosting.joblib"
    METRICS_DIR: Path = ML_DIR / "outputs" / "metrics"
    REPORTS_DIR: Path = ML_DIR / "outputs" / "reports"
    DATA_SPLITS_DIR: Path = ML_DIR / "data" / "splits"

    # Prediction History file
    PREDICTION_HISTORY_FILE: Path = ROOT_DIR / "backend" / "data" / "prediction_history.json"

settings = Settings()
