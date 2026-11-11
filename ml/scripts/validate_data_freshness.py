from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import json
from datetime import date
from climatesense.pipeline import load_all, write_json
root = Path(__file__).resolve().parents[1]
frame, audits = load_all(root / "data/raw")
latest = frame.date.max().date(); age = (date.today() - latest).days
report = {"source": "NASA POWER daily local exports", "retrieved_at": None, "latest_observation_date": str(latest), "freshness_checked_at": str(date.today()), "data_age_days": age, "configured_forecast_max_gap_days": 7, "status": "fresh_enough_for_forecast" if age <= 7 else "stale_for_forecast", "files": [{"source_file": a["source_file"], "time_basis": a.get("time_basis"), "date_range": [a.get("date_min"), a.get("date_max")], "rows": a["rows"]} for a in audits], "note": "Local files are historical NASA POWER exports; no live API refresh was performed."}
write_json(report, root / "outputs/reports/data_freshness.json")
print(json.dumps(report, indent=2))
