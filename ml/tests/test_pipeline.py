from pathlib import Path
import pandas as pd
from climatesense.pipeline import chronological_split, parse_nasa_csv

def test_parse_nasa_csv():
    frame, meta = parse_nasa_csv(Path("data/raw/bhadrak.csv"))
    assert len(frame) > 8000 and frame.date.notna().all()
    assert meta["time_basis"] == "LST"
    assert frame["PRECTOTCORR"].min() >= 0

def test_chronological_split_has_no_order_leakage():
    frame = pd.DataFrame({"date": pd.date_range("2020-01-01", periods=100), "district": "x", "value": range(100)})
    parts, summary = chronological_split(frame)
    assert parts["train"].date.max() < parts["validation"].date.min()
    assert parts["validation"].date.max() < parts["test"].date.min()
    assert summary["overlap_dates"] == []
