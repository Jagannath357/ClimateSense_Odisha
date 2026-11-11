from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any
import numpy as np
import pandas as pd

STANDARD_COLUMNS = {"YEAR": "year", "DOY": "doy", "T2M": "T2M", "T2M_MAX": "T2M_MAX", "T2M_MIN": "T2M_MIN", "T2MDEW": "T2MDEW", "RH2M": "RH2M", "PRECTOTCORR": "PRECTOTCORR", "WS2M": "WS2M", "ALLSKY_SFC_SW_DWN": "ALLSKY_SFC_SW_DWN", "PS": "PS"}
SUPPORTED_TARGETS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "WS2M", "T2MDEW", "PS", "ALLSKY_SFC_SW_DWN"]

def district_name(path: Path) -> str:
    return re.sub(r"[^a-z0-9]+", "_", path.stem.lower()).strip("_")

def parse_nasa_csv(path: Path, sentinel: float = -999) -> tuple[pd.DataFrame, dict[str, Any]]:
    lines = path.read_text(encoding="utf-8-sig", errors="replace").splitlines()
    end = next((i for i, line in enumerate(lines) if line.strip() == "-END HEADER-"), -1)
    if end < 0:
        raise ValueError(f"NASA POWER header terminator not found: {path}")
    metadata: dict[str, Any] = {"source_file": path.name, "source_path": str(path)}
    for line in lines[: end + 1]:
        if "Dates (month/day/year):" in line:
            metadata["date_range_text"] = line.split(":", 1)[1].strip()
            metadata["time_basis"] = "LST" if " LST" in line else "UTC" if " UTC" in line else "unknown"
        match = re.search(r"Location:\s*latitude\s+([-\d.]+)\s+longitude\s+([-\d.]+)", line)
        if match:
            metadata["latitude"], metadata["longitude"] = map(float, match.groups())
        if "elevation from" in line:
            metadata["elevation_text"] = line.strip()
    frame = pd.read_csv(path, skiprows=end + 1)
    frame.columns = [STANDARD_COLUMNS.get(str(c).strip(), str(c).strip()) for c in frame.columns]
    frame.insert(0, "source_file", path.name)
    frame.insert(1, "district", district_name(path))
    frame["date"] = pd.to_datetime(frame["year"].astype(str) + frame["doy"].astype(str), format="%Y%j", errors="coerce")
    frame = frame.replace(sentinel, np.nan)
    for col in frame.columns:
        if col not in {"source_file", "district", "date"}:
            frame[col] = pd.to_numeric(frame[col], errors="coerce")
    return frame, metadata

def discover_files(raw_dir: Path) -> list[Path]:
    return sorted(raw_dir.glob("*.csv"))

def audit_frame(frame: pd.DataFrame, metadata: dict[str, Any]) -> dict[str, Any]:
    numeric = frame.select_dtypes(include=np.number)
    invalid = {c: int(np.isinf(frame[c]).sum()) for c in numeric.columns if np.isinf(frame[c]).any()}
    return {**metadata, "rows": int(len(frame)), "columns": int(len(frame.columns)), "column_names": list(frame.columns), "dtypes": {c: str(t) for c, t in frame.dtypes.items()}, "date_min": frame["date"].min().isoformat() if frame["date"].notna().any() else None, "date_max": frame["date"].max().isoformat() if frame["date"].notna().any() else None, "missing_counts": {c: int(v) for c, v in frame.isna().sum().items()}, "missing_percent": {c: round(float(v / len(frame) * 100), 4) for c, v in frame.isna().sum().items()}, "duplicate_rows": int(frame.duplicated().sum()), "duplicate_dates": int(frame["date"].duplicated().sum()), "constant_columns": [c for c in frame.columns if frame[c].nunique(dropna=True) <= 1], "infinite_counts": invalid, "numeric_summary": json.loads(numeric.describe().to_json()) if not numeric.empty else {}}

def load_all(raw_dir: Path, sentinel: float = -999) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    frames, audits = [], []
    files = discover_files(raw_dir)
    if not files:
        raise FileNotFoundError(f"No CSV files found in {raw_dir}")
    for path in files:
        frame, meta = parse_nasa_csv(path, sentinel)
        frames.append(frame)
        audits.append(audit_frame(frame, meta))
    return pd.concat(frames, ignore_index=True), audits

def write_json(value: Any, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, default=str), encoding="utf-8")

def preprocess(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    result = frame.replace([np.inf, -np.inf], np.nan).sort_values(["date", "district"], kind="stable").reset_index(drop=True)
    return result, {"rows_before": len(frame), "rows_after": len(result), "infinite_values_replaced": int(frame.select_dtypes(include=np.number).isin([np.inf, -np.inf]).sum().sum()), "imputation": "none; missing values retained", "sentinel": "-999 converted to NaN"}

def add_features(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    result["month"] = result["date"].dt.month
    result["day_of_year"] = result["date"].dt.dayofyear
    result["month_sin"] = np.sin(2 * np.pi * result["month"] / 12)
    result["month_cos"] = np.cos(2 * np.pi * result["month"] / 12)
    result["T2M_lag_1"] = result.groupby("district", sort=False)["T2M"].shift(1)
    result["T2M_rolling_7d"] = result.groupby("district", sort=False)["T2M"].transform(lambda s: s.shift(1).rolling(7, min_periods=3).mean())
    return result

def chronological_split(frame: pd.DataFrame, train_ratio=.7, validation_ratio=.15) -> tuple[dict[str, pd.DataFrame], dict[str, Any]]:
    ordered = frame.sort_values("date", kind="stable").reset_index(drop=True)
    n = len(ordered); train_target, val_target = int(n * train_ratio), int(n * (train_ratio + validation_ratio))
    dates = ordered["date"].drop_duplicates().tolist()
    train_date = dates[min(len(dates) - 1, max(0, int(len(dates) * train_ratio) - 1))]
    val_date = dates[min(len(dates) - 1, max(0, int(len(dates) * (train_ratio + validation_ratio)) - 1))]
    train_mask = ordered["date"] <= train_date
    val_mask = (ordered["date"] > train_date) & (ordered["date"] <= val_date)
    test_mask = ordered["date"] > val_date
    splits = {"train": ordered.loc[train_mask].copy(), "validation": ordered.loc[val_mask].copy(), "test": ordered.loc[test_mask].copy()}
    summary = {"strategy": "chronological_global", "ratios": {"train": train_ratio, "validation": validation_ratio, "test": 1 - train_ratio - validation_ratio}, "total_rows": n, "splits": {}}
    for name, part in splits.items():
        summary["splits"][name] = {"rows": len(part), "date_min": part.date.min().isoformat(), "date_max": part.date.max().isoformat(), "district_counts": part.district.value_counts().to_dict()}
    summary["target_rows"] = {"train": train_target, "validation": val_target - train_target, "test": n - val_target}
    summary["overlap_dates"] = sorted(set(splits["train"].date) & set(splits["validation"].date) | set(splits["validation"].date) & set(splits["test"].date))
    return splits, summary
