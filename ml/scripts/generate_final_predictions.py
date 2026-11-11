"""Generate the final untouched-test prediction and evaluation artifacts."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import json
import joblib
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

root = Path(__file__).resolve().parents[1]
model_path = root / "models/baseline_hist_gradient_boosting.joblib"
metrics_path = root / "outputs/metrics/baseline_metrics.json"
test_path = root / "data/splits/test.csv"
if not model_path.exists() or not metrics_path.exists() or not test_path.exists():
    raise SystemExit("Run prepare_splits.py and run_training.py before generating final predictions.")

model = joblib.load(model_path)
metadata = json.loads(metrics_path.read_text(encoding="utf-8"))
test = pd.read_csv(test_path, parse_dates=["date"])
target = metadata["target"]
features = metadata["features"]
valid = test[target].notna()
predictions = test.loc[valid].copy()
predictions["actual_T2M"] = predictions[target]
predictions["predicted_T2M"] = model.predict(predictions[features])
predictions["residual_T2M"] = predictions["actual_T2M"] - predictions["predicted_T2M"]
predictions["absolute_error_T2M"] = predictions["residual_T2M"].abs()
prediction_columns = ["date", "district", "source_file", "actual_T2M", "predicted_T2M", "residual_T2M", "absolute_error_T2M"]
predictions[prediction_columns].to_csv(root / "outputs/metrics/final_test_predictions.csv", index=False)

actual = predictions["actual_T2M"]
estimated = predictions["predicted_T2M"]
final_metrics = {
    "evaluation_stage": "final_test",
    "target": target,
    "rows": int(len(predictions)),
    "date_min": predictions.date.min().isoformat(),
    "date_max": predictions.date.max().isoformat(),
    "MAE": float(mean_absolute_error(actual, estimated)),
    "RMSE": float(mean_squared_error(actual, estimated) ** 0.5),
    "R2": float(r2_score(actual, estimated)),
    "mean_bias_error": float((estimated - actual).mean()),
    "max_absolute_error": float(predictions["absolute_error_T2M"].max()),
}
(root / "outputs/metrics/final_test_metrics.json").write_text(json.dumps(final_metrics, indent=2), encoding="utf-8")

district_metrics = predictions.groupby("district").apply(
    lambda group: pd.Series({
        "rows": len(group),
        "MAE": mean_absolute_error(group.actual_T2M, group.predicted_T2M),
        "RMSE": mean_squared_error(group.actual_T2M, group.predicted_T2M) ** 0.5,
        "bias": (group.predicted_T2M - group.actual_T2M).mean(),
    }), include_groups=False
)
district_metrics.to_csv(root / "outputs/metrics/final_test_metrics_by_district.csv")

figures = root / "outputs/figures"
sns.set_theme(style="whitegrid")
fig, ax = plt.subplots(figsize=(7, 7))
sns.scatterplot(x=actual, y=estimated, s=12, alpha=0.35, ax=ax)
limits = [min(actual.min(), estimated.min()), max(actual.max(), estimated.max())]
ax.plot(limits, limits, "r--", label="Perfect prediction")
ax.set(title="Final test set: actual vs predicted T2M", xlabel="Actual T2M (°C)", ylabel="Predicted T2M (°C)")
ax.legend(); fig.tight_layout(); fig.savefig(figures / "final_test_actual_vs_predicted.png", dpi=180); plt.close(fig)

fig, ax = plt.subplots(figsize=(10, 4))
sns.scatterplot(data=predictions, x="date", y="residual_T2M", s=10, alpha=0.35, ax=ax)
ax.axhline(0, color="red", linestyle="--"); ax.set(title="Final test residuals over time", xlabel="Date", ylabel="Actual - predicted T2M (°C)")
fig.tight_layout(); fig.savefig(figures / "final_test_residuals_over_time.png", dpi=180); plt.close(fig)

fig, ax = plt.subplots(figsize=(8, 4)); sns.histplot(predictions["residual_T2M"], kde=True, ax=ax)
ax.set(title="Final test residual distribution", xlabel="Residual (°C)", ylabel="Count"); fig.tight_layout(); fig.savefig(figures / "final_test_residual_distribution.png", dpi=180); plt.close(fig)

report = f"""# Final test prediction report

The saved baseline model was evaluated once on the untouched chronological test set.

- Target: `{target}`
- Test rows: {len(predictions):,}
- Test period: {predictions.date.min().date()} to {predictions.date.max().date()}
- MAE: {final_metrics['MAE']:.4f} °C
- RMSE: {final_metrics['RMSE']:.4f} °C
- R²: {final_metrics['R2']:.6f}
- Mean bias error (predicted − actual): {final_metrics['mean_bias_error']:.4f} °C

The row-level predictions are in `outputs/metrics/final_test_predictions.csv`. These results are baseline performance, not a claim of future operational accuracy.
"""
(root / "outputs/reports/FINAL_TEST_REPORT.md").write_text(report, encoding="utf-8")
print(json.dumps(final_metrics, indent=2))
