"""Train leakage-safe, target-specific one-day-ahead models."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import json
import hashlib
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, mean_squared_error, precision_score, r2_score, recall_score, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import OneHotEncoder

root = Path(__file__).resolve().parents[1]
source = root / "data/processed/climate_daily_cleaned.csv"
split_summary = root / "outputs/reports/split_summary.json"
if not source.exists() or not split_summary.exists():
    raise SystemExit("Run preprocessing and prepare_splits before multi-target training.")
df = pd.read_csv(source, parse_dates=["date"]).sort_values(["district", "date"]).reset_index(drop=True)
boundaries = json.loads(split_summary.read_text(encoding="utf-8"))["splits"]
train_end = pd.Timestamp(boundaries["train"]["date_max"]); validation_end = pd.Timestamp(boundaries["validation"]["date_max"])
targets = ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "PRECTOTCORR"]
units = {"T2M": "deg C", "T2M_MAX": "deg C", "T2M_MIN": "deg C", "RH2M": "%", "WS2M": "m/s", "PRECTOTCORR": "mm/day"}
metrics = []
metadata = {}
(root / "models/multi_target").mkdir(parents=True, exist_ok=True)

def features_for(frame: pd.DataFrame, target: str) -> tuple[pd.DataFrame, list[str]]:
    result = frame.copy(); group = result.groupby("district", sort=False)[target]; lag_columns = []
    for lag in [1, 2, 3, 7, 14]:
        name = f"{target}_lag_{lag}"; result[name] = group.shift(lag); lag_columns.append(name)
    rolling = f"{target}_rolling_7d"; result[rolling] = group.transform(lambda values: values.shift(1).rolling(7, min_periods=5).mean())
    result["month"] = result.date.dt.month; result["day_of_year"] = result.date.dt.day_of_year; result["month_sin"] = np.sin(2 * np.pi * result.month / 12); result["month_cos"] = np.cos(2 * np.pi * result.month / 12)
    return result, ["district", "month", "day_of_year", "month_sin", "month_cos", *lag_columns, rolling]

for target in targets:
    prepared, feature_columns = features_for(df, target); prepared = prepared.dropna(subset=[target] + feature_columns)
    train = prepared[prepared.date <= train_end]; validation = prepared[(prepared.date > train_end) & (prepared.date <= validation_end)]; test = prepared[prepared.date > validation_end]
    categorical = ["district"]; numeric = [column for column in feature_columns if column not in categorical]
    def transformer():
        return ColumnTransformer([("district", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical), ("numeric", SimpleImputer(strategy="median"), numeric)])
    if target == "PRECTOTCORR":
        occurrence = make_pipeline(transformer(), HistGradientBoostingClassifier(max_iter=180, learning_rate=0.06, random_state=42)); occurrence.fit(train[feature_columns], (train[target] > 0).astype(int))
        amount_train = train[train[target] > 0]; amount = make_pipeline(transformer(), HistGradientBoostingRegressor(max_iter=180, learning_rate=0.06, random_state=42)); amount.fit(amount_train[feature_columns], np.log1p(amount_train[target]))
        dump({"occurrence": occurrence, "amount": amount, "feature_columns": feature_columns}, root / "models/multi_target/PRECTOTCORR.joblib")
        model_parameters = {"occurrence": {"max_iter": 180, "learning_rate": 0.06}, "amount": {"max_iter": 180, "learning_rate": 0.06}}
        for name, part in [("validation", validation), ("test", test)]:
            probability = occurrence.predict_proba(part[feature_columns])[:, 1]; positive = probability >= 0.5; predicted_amount = np.maximum(0, np.expm1(amount.predict(part[feature_columns]))); predicted = np.where(positive, predicted_amount, 0.0); actual = part[target]
            row = {"target": target, "stage": name, "unit": units[target], "rows": len(part), "MAE": mean_absolute_error(actual, predicted), "RMSE": mean_squared_error(actual, predicted) ** .5, "rain_occurrence_accuracy": accuracy_score(actual > 0, positive), "rain_occurrence_precision": precision_score(actual > 0, positive, zero_division=0), "rain_occurrence_recall": recall_score(actual > 0, positive, zero_division=0), "rain_occurrence_f1": f1_score(actual > 0, positive, zero_division=0)}
            if (actual > 0).nunique() == 2: row["rain_occurrence_roc_auc"] = roc_auc_score(actual > 0, probability)
            metrics.append(row)
    else:
        model = make_pipeline(transformer(), HistGradientBoostingRegressor(max_iter=180, learning_rate=0.06, random_state=42)); model.fit(train[feature_columns], train[target]); dump({"model": model, "feature_columns": feature_columns, "target": target, "unit": units[target]}, root / f"models/multi_target/{target}.joblib")
        model_parameters = {"max_iter": 180, "learning_rate": 0.06, "random_state": 42}
        for name, part in [("validation", validation), ("test", test)]:
            actual = part[target]; predicted = model.predict(part[feature_columns]); metrics.append({"target": target, "stage": name, "unit": units[target], "rows": len(part), "MAE": mean_absolute_error(actual, predicted), "RMSE": mean_squared_error(actual, predicted) ** .5, "R2": r2_score(actual, predicted)})

    metadata[target] = {
        "target": target,
        "unit": units[target],
        "feature_columns": feature_columns,
        "model_type": "rainfall_occurrence_plus_log_amount" if target == "PRECTOTCORR" else "hist_gradient_boosting_regressor",
        "model_parameters": model_parameters,
        "train": {"rows": len(train), "date_min": train.date.min().date().isoformat(), "date_max": train.date.max().date().isoformat()},
        "validation": {"rows": len(validation), "date_min": validation.date.min().date().isoformat(), "date_max": validation.date.max().date().isoformat()},
        "test": {"rows": len(test), "date_min": test.date.min().date().isoformat(), "date_max": test.date.max().date().isoformat()},
        "data_fingerprint_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "model_version": "0.3.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

(root / "outputs/metrics/multi_target_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
pd.DataFrame(metrics).to_csv(root / "outputs/metrics/multi_target_metrics.csv", index=False)
for target, details in metadata.items():
    (root / "models/multi_target" / f"{target}_metadata.json").write_text(json.dumps(details, indent=2), encoding="utf-8")
(root / "models/multi_target" / "model_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
print(pd.DataFrame(metrics).to_string(index=False))
