"""Presentation formatting for climate outputs; numeric model values remain unchanged."""
from __future__ import annotations
from datetime import date, datetime
import math
from typing import Any

RAINFALL_THRESHOLDS = {"no_measurable": 0.0, "very_light_upper": 2.5, "light_upper": 10.0, "moderate_upper": 25.0, "heavy_upper": 50.0}

def _number(value: Any) -> float | None:
    try: number = float(value)
    except (TypeError, ValueError): return None
    return number if math.isfinite(number) else None

def format_temperature(value: Any, unit: str = "C") -> str:
    number = _number(value)
    if number is None: return "Unavailable"
    if unit.upper() == "F": return f"{number * 9 / 5 + 32:.1f} °F"
    return f"{number:.1f} °C"

def format_rainfall(value: Any, unit: str = "mm/day") -> str:
    number = _number(value)
    if number is None or number < 0: return "Unavailable"
    return f"{number:.2f} {unit}"

def rainfall_description(value: Any, thresholds: dict[str, float] | None = None) -> str:
    number = _number(value)
    if number is None or number < 0: return "Unavailable"
    limits = thresholds or RAINFALL_THRESHOLDS
    if number == limits["no_measurable"]: return "No measurable rainfall predicted"
    if number <= limits["very_light_upper"]: return "Very light amount"
    if number <= limits["light_upper"]: return "Light amount"
    if number <= limits["moderate_upper"]: return "Moderate amount"
    if number <= limits["heavy_upper"]: return "Heavy amount"
    return "Very heavy amount"

def format_forecast_date(value: Any) -> str:
    if value is None: return "Unavailable"
    try:
        parsed = value if isinstance(value, (date, datetime)) else datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.strftime("%d %b %Y")
    except (TypeError, ValueError): return "Unavailable"
