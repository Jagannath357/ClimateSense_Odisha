import sys
from pathlib import Path

# Ensure ml/.venv site-packages are linked if using an alternate interpreter
_root = Path(__file__).resolve().parents[3]
_venv_site = _root / "ml" / ".venv" / "Lib" / "site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.insert(1, str(_venv_site))

import json
import logging
from typing import Dict, Any, Optional
try:
    import joblib  # type: ignore
except ImportError:
    import joblib  # type: ignore
import pandas as pd
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class ModelService:
    _instance: Optional["ModelService"] = None

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.multi_target_metrics: list = []
        self.final_test_metrics: Dict[str, Any] = {}
        self.baseline_metrics: Dict[str, Any] = {}
        self.district_test_metrics: list = []
        self.baseline_model = None
        self._is_loaded = False

    @classmethod
    def get_instance(cls) -> "ModelService":
        if cls._instance is None:
            cls._instance = ModelService()
        return cls._instance

    def load_artifacts(self) -> None:
        if self._is_loaded:
            return

        logger.info("Initializing ModelService: Loading ML models and evaluation artifacts...")

        # 1. Load multi_target metadata
        metadata_file = settings.MODELS_DIR / "model_metadata.json"
        if metadata_file.exists():
            try:
                self.metadata = json.loads(metadata_file.read_text(encoding="utf-8"))
                logger.info(f"Loaded metadata for targets: {list(self.metadata.keys())}")
            except Exception as e:
                logger.error(f"Error loading model metadata: {e}")

        # 2. Load multi-target joblib models
        targets = ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "PRECTOTCORR"]
        for target in targets:
            model_path = settings.MODELS_DIR / f"{target}.joblib"
            if model_path.exists():
                try:
                    artifact = joblib.load(model_path)
                    self.models[target] = artifact
                    logger.info(f"Loaded model artifact for target: {target}")
                except Exception as e:
                    logger.error(f"Failed to load model {model_path}: {e}")
            else:
                logger.warning(f"Model file not found: {model_path}")

        # 3. Load baseline model
        if settings.BASELINE_MODEL_PATH.exists():
            try:
                self.baseline_model = joblib.load(settings.BASELINE_MODEL_PATH)
                logger.info("Loaded baseline contemporaneous model.")
            except Exception as e:
                logger.error(f"Failed to load baseline model: {e}")

        # 4. Load metric reports
        metrics_file = settings.METRICS_DIR / "multi_target_metrics.json"
        if metrics_file.exists():
            try:
                self.multi_target_metrics = json.loads(metrics_file.read_text(encoding="utf-8"))
            except Exception as e:
                logger.error(f"Error reading multi_target_metrics.json: {e}")

        final_test_file = settings.METRICS_DIR / "final_test_metrics.json"
        if final_test_file.exists():
            try:
                self.final_test_metrics = json.loads(final_test_file.read_text(encoding="utf-8"))
            except Exception as e:
                logger.error(f"Error reading final_test_metrics.json: {e}")

        baseline_metrics_file = settings.METRICS_DIR / "baseline_metrics.json"
        if baseline_metrics_file.exists():
            try:
                self.baseline_metrics = json.loads(baseline_metrics_file.read_text(encoding="utf-8"))
            except Exception as e:
                logger.error(f"Error reading baseline_metrics.json: {e}")

        dist_metrics_file = settings.METRICS_DIR / "final_test_metrics_by_district.csv"
        if dist_metrics_file.exists():
            try:
                df = pd.read_csv(dist_metrics_file)
                self.district_test_metrics = df.to_dict(orient="records")
            except Exception as e:
                logger.error(f"Error reading district metrics CSV: {e}")

        self._is_loaded = True
        logger.info(f"ModelService ready: {len(self.models)} active forecasting models loaded.")

    def get_model(self, target: str) -> Optional[Any]:
        return self.models.get(target)

    def get_target_metadata(self, target: str) -> Optional[Dict[str, Any]]:
        return self.metadata.get(target)

    def get_all_metadata(self) -> Dict[str, Any]:
        return self.metadata

    def get_supported_targets(self) -> list[str]:
        return list(self.models.keys())

model_service = ModelService.get_instance()
