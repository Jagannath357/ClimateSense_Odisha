from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from climatesense.pipeline import load_all, write_json
import pandas as pd
root = Path(__file__).resolve().parents[1]
frame, audits = load_all(root / "data" / "raw")
write_json({"project": "ClimateSense Odisha", "files_discovered": len(audits), "total_rows": len(frame), "audits": audits}, root / "outputs/reports/dataset_inventory.json")
pd.DataFrame(audits).drop(columns=["column_names", "dtypes", "missing_counts", "missing_percent", "numeric_summary"], errors="ignore").to_csv(root / "outputs/reports/dataset_inventory.csv", index=False)
print(f"Audited {len(audits)} files and {len(frame):,} rows.")
