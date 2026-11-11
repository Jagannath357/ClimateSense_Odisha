from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
root = Path(__file__).resolve().parents[1]
src = root / "data/processed/climate_daily_cleaned.csv"
if not src.exists(): raise SystemExit("Run scripts/run_preprocessing.py first.")
df = pd.read_csv(src, parse_dates=["date"]); out = root / "outputs/figures"; out.mkdir(parents=True, exist_ok=True)
num = df.select_dtypes("number"); num.describe().T.to_csv(root / "outputs/reports/descriptive_statistics.csv"); num.corr(method="spearman").to_csv(root / "outputs/reports/spearman_correlation.csv")
sns.set_theme(style="whitegrid")
for col in ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"]:
    fig, ax = plt.subplots(figsize=(11, 4)); df.groupby("date")[col].mean().plot(ax=ax); ax.set(title=f"District-average daily {col}", xlabel="Date", ylabel=col); fig.tight_layout(); fig.savefig(out / f"timeseries_{col.lower()}.png", dpi=150); plt.close(fig)
fig, ax = plt.subplots(figsize=(11, 8)); sns.heatmap(num.corr(method="spearman"), cmap="coolwarm", center=0, ax=ax); fig.tight_layout(); fig.savefig(out / "spearman_correlation_heatmap.png", dpi=150); plt.close(fig)
(root / "outputs/reports/EDA_FINDINGS.md").write_text(f"# EDA findings\n\nRows: {len(df):,}. Districts: {df.district.nunique()}. Date range: {df.date.min().date()} to {df.date.max().date()}. Missing values are retained; no values were imputed.\n", encoding="utf-8")
print(f"Generated EDA summaries and figures for {len(df):,} rows.")
