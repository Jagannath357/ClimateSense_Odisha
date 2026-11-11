# Prediction result schema

Forecast outputs in `outputs/metrics/tomorrow_predictions_current.csv` use one row per district. The required numeric fields are `predicted_temperature_C`, `predicted_rainfall_mm_day`, `predicted_humidity_pct`, and `predicted_wind_speed_m_s`. Each has a matching `_status` field. The row also records `last_observed_date`, `forecast_date`, the four model names, `generated_at`, `data_quality_status`, `data_gap_days`, and `forecast_note`.

The primary targets are `T2M` (degrees Celsius), `PRECTOTCORR` (mm/day), `RH2M` (percent), and `WS2M` (m/s), based on the NASA POWER metadata in the raw exports. Raw CSV/JSON values remain numeric. Human-readable strings such as `23.3 °C` are written only by `scripts/format_prediction_outputs.py` to `tomorrow_predictions_display.csv`.

When the local source is stale by more than seven days, the pipeline uses a same-calendar-day historical mean and marks the target status `climatological_estimate` and the row status `stale_source_climatology_only`. This is an explicitly labeled historical estimate, not a live weather forecast. Missing models or missing required values produce nulls and an unavailable status rather than fabricated numbers.
