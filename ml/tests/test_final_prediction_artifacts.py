from pathlib import Path
import json
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]

def test_final_prediction_artifacts_exist_and_are_complete():
    prediction_path = ROOT / "outputs/metrics/final_test_predictions.csv"
    metrics_path = ROOT / "outputs/metrics/final_test_metrics.json"
    assert prediction_path.exists()
    assert metrics_path.exists()
    predictions = pd.read_csv(prediction_path)
    metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    assert len(predictions) == metrics["rows"]
    assert predictions[["actual_T2M", "predicted_T2M", "residual_T2M"]].notna().all().all()
