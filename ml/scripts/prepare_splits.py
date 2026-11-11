from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import pandas as pd
from climatesense.pipeline import add_features, chronological_split, write_json
root = Path(__file__).resolve().parents[1]; src = root / "data/processed/climate_daily_cleaned.csv"
if not src.exists(): raise SystemExit("Run scripts/run_preprocessing.py first.")
df = add_features(pd.read_csv(src, parse_dates=["date"])); splits, summary = chronological_split(df)
out = root / "data/splits"; out.mkdir(parents=True, exist_ok=True)
for name, part in splits.items(): part.to_csv(out / f"{name}.csv", index=False)
write_json(summary, root / "outputs/reports/split_summary.json")
pd.DataFrame([{ "split": k, "rows": v["rows"], "date_min": v["date_min"], "date_max": v["date_max"] } for k,v in summary["splits"].items()]).to_csv(root / "outputs/reports/split_summary.csv", index=False)
print("; ".join(f"{k}: {len(v):,} rows ({v.date.min().date()} to {v.date.max().date()})" for k,v in splits.items()))
