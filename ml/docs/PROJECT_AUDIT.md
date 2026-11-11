# Project audit and root cause

## Workspace architecture

This repository is a Python CLI/data-science project. It contains reusable loading and preprocessing code, command-line scripts, notebooks, tests, reports, models, and local CSV data. There is no frontend, backend API, database, scheduled job, or live external-data connector to update.

## Root cause of the old output

`scripts/predict_tomorrow.py` trained a lag model but always wrote a numeric `predicted_T2M` value from the latest historical row. When the latest source date was 2025-12-31 and the requested date was 2026-10-30, it published a 303-day-gap estimate and labeled it `historical_fallback_due_to_missing_recent_data`. That was misleading because it was not a current forecast.

The corrected workflow in `predict_tomorrow.py` uses target-specific historical lags when the source gap is at most seven days and emits one district row containing separate temperature, precipitation, humidity, and wind-speed predictions. When data is stale, it provides same-calendar-day historical climatological estimates for all four required targets, each labeled `climatological_estimate`; it never labels those values as a current weather forecast.

## Actual source and coverage

The configured source is 15 local NASA POWER daily exports in `data/raw/`, covering 2001-01-01 through 2025-12-31. The files contain temperature, dew point, humidity, precipitation, wind, solar radiation, and pressure variables. No live refresh was performed, so the current source is stale for a 2026 forecast.

## Implemented capabilities

- Metadata-aware NASA POWER CSV loading and quality inventory.
- Freshness validation with explicit stale status.
- Leakage-safe target-specific lag models for temperature, humidity, wind, and rainfall.
- Separate rainfall occurrence and positive-amount modeling.
- Chronological validation and test metrics.
- Annual district anomalies and Theil–Sen/Kendall observed trend statistics.
- Structured forecast result schema with units, source date, horizon, model metadata, and status.

There is no API or frontend in this repository, so no UI/API migration was applicable.
