from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import make_pipeline
from joblib import dump
from climatesense.pipeline import write_json
root = Path(__file__).resolve().parents[1]; split_dir = root / "data/splits"
if not (split_dir / "train.csv").exists(): raise SystemExit("Run scripts/prepare_splits.py first.")
train, val, test = [pd.read_csv(split_dir / f"{n}.csv") for n in ["train", "validation", "test"]]
target = "T2M"; excluded = {target, "date", "district", "source_file"}; features = [c for c in train.select_dtypes("number") if c not in excluded and not c.startswith("T2M_lag") and not c.startswith("T2M_rolling")]; features = [c for c in features if c in val and c in test]
model = make_pipeline(SimpleImputer(strategy="median"), HistGradientBoostingRegressor(random_state=42)); model.fit(train[features], train[target]); metrics = {}
for name, data in [("validation", val), ("test", test)]:
    valid = data[target].notna(); pred = model.predict(data.loc[valid, features]); actual = data.loc[valid, target]; metrics[name] = {"MAE": mean_absolute_error(actual, pred), "RMSE": mean_squared_error(actual, pred) ** .5, "R2": r2_score(actual, pred), "rows": int(valid.sum())}
(root / "models").mkdir(exist_ok=True); dump(model, root / "models/baseline_hist_gradient_boosting.joblib"); write_json({"target": target, "features": features, "metrics": metrics}, root / "outputs/metrics/baseline_metrics.json"); print(metrics)
