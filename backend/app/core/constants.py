from typing import Dict, Any

DISTRICT_METADATA: Dict[str, Dict[str, Any]] = {
    "angul": {"name": "Angul", "latitude": 20.84, "longitude": 85.10, "elevation_m": 206.61, "region": "Central Odisha"},
    "bargarh": {"name": "Bargarh", "latitude": 21.33, "longitude": 83.62, "elevation_m": 222.75, "region": "Western Odisha", "note": "Shares identical MERRA-2 0.5x0.625° grid cell with Sambalpur"},
    "bhadrak": {"name": "Bhadrak", "latitude": 21.06, "longitude": 86.50, "elevation_m": 82.63, "region": "Northern Coastal Odisha"},
    "cuttack": {"name": "Cuttack", "latitude": 20.4625, "longitude": 85.883, "elevation_m": 72.95, "region": "Central Coastal Odisha"},
    "gajapati": {"name": "Gajapati", "latitude": 18.78, "longitude": 84.09, "elevation_m": 231.82, "region": "Southern Odisha"},
    "ganjam": {"name": "Ganjam", "latitude": 19.35, "longitude": 84.99, "elevation_m": 60.99, "region": "Southern Coastal Odisha"},
    "kalahandi": {"name": "Kalahandi", "latitude": 19.91, "longitude": 83.17, "elevation_m": 353.47, "region": "Southwestern Odisha"},
    "kendrapada": {"name": "Kendrapada", "latitude": 20.50, "longitude": 86.42, "elevation_m": 17.76, "region": "Eastern Coastal Odisha"},
    "keojhar": {"name": "Kendujhar (Keonjhar)", "latitude": 21.63, "longitude": 85.58, "elevation_m": 341.47, "region": "Northern Odisha"},
    "khurda": {"name": "Khurda", "latitude": 20.18, "longitude": 85.62, "elevation_m": 37.91, "region": "East-Central Odisha", "note": "Shares near-identical MERRA-2 grid with Puri"},
    "koraput": {"name": "Koraput", "latitude": 18.81, "longitude": 82.71, "elevation_m": 642.71, "region": "Southern Highlands"},
    "malkangiri": {"name": "Malkangiri", "latitude": 18.35, "longitude": 81.90, "elevation_m": 387.93, "region": "Southernmost Odisha"},
    "puri": {"name": "Puri", "latitude": 19.8135, "longitude": 85.8315, "elevation_m": 37.91, "region": "Coastal Odisha", "note": "Shares near-identical MERRA-2 grid with Khurda"},
    "sambalpur": {"name": "Sambalpur", "latitude": 21.4669, "longitude": 83.9812, "elevation_m": 222.75, "region": "Western Odisha", "note": "Shares identical MERRA-2 0.5x0.625° grid cell with Bargarh"},
    "sundargarh": {"name": "Sundargarh", "latitude": 22.12, "longitude": 84.03, "elevation_m": 295.48, "region": "Northwestern Odisha"},
}

TARGET_VARIABLES: Dict[str, Dict[str, str]] = {
    "T2M": {
        "display_name": "Average Temperature",
        "unit": "°C",
        "description": "Daily mean temperature at 2 meters above ground",
        "color": "#ef4444"
    },
    "T2M_MAX": {
        "display_name": "Maximum Temperature",
        "unit": "°C",
        "description": "Daily maximum temperature at 2 meters",
        "color": "#f97316"
    },
    "T2M_MIN": {
        "display_name": "Minimum Temperature",
        "unit": "°C",
        "description": "Daily minimum temperature at 2 meters",
        "color": "#3b82f6"
    },
    "RH2M": {
        "display_name": "Relative Humidity",
        "unit": "%",
        "description": "Daily relative humidity at 2 meters",
        "color": "#06b6d4"
    },
    "PRECTOTCORR": {
        "display_name": "Precipitation",
        "unit": "mm/day",
        "description": "Corrected daily total precipitation accumulation",
        "color": "#0284c7"
    },
    "WS2M": {
        "display_name": "Wind Speed",
        "unit": "m/s",
        "description": "Daily wind speed at 2 meters",
        "color": "#10b981"
    }
}

RAINFALL_THRESHOLDS = {
    "no_measurable": 0.0,
    "very_light_upper": 2.5,
    "light_upper": 10.0,
    "moderate_upper": 25.0,
    "heavy_upper": 50.0
}

def get_rainfall_category(amount: float | None) -> Dict[str, str]:
    if amount is None or amount < 0:
        return {"category": "Unavailable", "description": "No data", "badge_color": "gray"}
    if amount == 0.0:
        return {"category": "No Rainfall", "description": "No measurable precipitation (0 mm)", "badge_color": "emerald"}
    if amount <= 2.5:
        return {"category": "Very Light", "description": "Very light rainfall (0.01 - 2.5 mm)", "badge_color": "cyan"}
    if amount <= 10.0:
        return {"category": "Light", "description": "Light rainfall (2.5 - 10 mm)", "badge_color": "blue"}
    if amount <= 25.0:
        return {"category": "Moderate", "description": "Moderate rainfall (10 - 25 mm)", "badge_color": "indigo"}
    if amount <= 50.0:
        return {"category": "Heavy", "description": "Heavy rainfall (25 - 50 mm)", "badge_color": "amber"}
    return {"category": "Very Heavy", "description": "Very heavy rainfall (> 50 mm)", "badge_color": "rose"}

