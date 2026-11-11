from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from climatesense.pipeline import load_all, preprocess, write_json
root = Path(__file__).resolve().parents[1]
frame, _ = load_all(root / "data/raw")
cleaned, summary = preprocess(frame)
(root / "data/processed").mkdir(parents=True, exist_ok=True)
cleaned.to_csv(root / "data/processed/climate_daily_cleaned.csv", index=False)
write_json(summary, root / "outputs/reports/preprocessing_summary.json")
print(f"Saved {len(cleaned):,} cleaned rows; raw files were not modified.")
