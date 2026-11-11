"""Generate observed long-term climate trends and anomalies."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import json
import pandas as pd
from scipy.stats import kendalltau, theilslopes
import matplotlib.pyplot as plt
import seaborn as sns

root = Path(__file__).resolve().parents[1]
source = root / "data/processed/climate_daily_cleaned.csv"
if not source.exists(): raise SystemExit("Run scripts/run_preprocessing.py first.")
df = pd.read_csv(source, parse_dates=["date"])
df["year"] = df.date.dt.year
variables = {"T2M": "°C", "T2M_MAX": "°C", "T2M_MIN": "°C", "PRECTOTCORR": "mm/day", "RH2M": "%", "WS2M": "m/s"}
annual = df.groupby(["district", "year"], as_index=False)[list(variables)].mean()
baseline_start, baseline_end = 2001, 2010
baseline = annual[annual.year.between(baseline_start, baseline_end)].groupby("district")[list(variables)].mean().add_suffix("_baseline")
anomalies = annual.merge(baseline, on="district", how="left")
for variable in variables: anomalies[f"{variable}_anomaly"] = anomalies[variable] - anomalies[f"{variable}_baseline"]
anomalies.to_csv(root / "outputs/metrics/annual_district_anomalies.csv", index=False)
trend_rows = []
for district, group in annual.groupby("district"):
    for variable, unit in variables.items():
        valid = group[["year", variable]].dropna()
        if len(valid) < 8: continue
        slope, intercept, low, high = theilslopes(valid[variable], valid.year, 0.95); tau, pvalue = kendalltau(valid.year, valid[variable])
        trend_rows.append({"district": district, "variable": variable, "unit": unit, "years": len(valid), "first_year": int(valid.year.min()), "last_year": int(valid.year.max()), "sen_slope_per_year": slope, "sen_slope_ci_low": low, "sen_slope_ci_high": high, "kendall_tau": tau, "kendall_p_value": pvalue, "interpretation": "trend evidence; not causal attribution"})
trends = pd.DataFrame(trend_rows)
trends.to_csv(root / "outputs/metrics/climate_trend_statistics.csv", index=False)
annual_state = annual.groupby("year", as_index=False)[list(variables)].mean(); figures = root / "outputs/figures"; figures.mkdir(parents=True, exist_ok=True); sns.set_theme(style="whitegrid")
for variable, unit in variables.items():
    fig, ax = plt.subplots(figsize=(10, 4)); ax.plot(annual_state.year, annual_state[variable], marker="o", markersize=2); ax.set(title=f"Odisha annual mean {variable}", xlabel="Year", ylabel=f"{variable} ({unit})"); fig.tight_layout(); fig.savefig(figures / f"annual_trend_{variable.lower()}.png", dpi=160); plt.close(fig)
summary = {"baseline_period": [baseline_start, baseline_end], "variables": variables, "districts": sorted(df.district.unique().tolist()), "note": "Observed historical trends are separate from short-term forecasts. Kendall p-values do not correct for all possible serial correlation or multiple testing."}
(root / "outputs/reports/climate_trend_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
(root / "outputs/reports/CLIMATE_TRENDS.md").write_text(f"# Climate trend analysis\n\nBaseline period: {baseline_start}-{baseline_end}. Trends use observed annual district means, Theil–Sen slopes, and Kendall correlation. They are not forecasts or causal climate-change attribution.\n", encoding="utf-8")
print(f"Generated trends for {len(trends):,} district-variable series using observed data.")
