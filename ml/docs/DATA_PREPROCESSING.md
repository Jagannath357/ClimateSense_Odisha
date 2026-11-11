# Data preprocessing

NASA POWER metadata rows are parsed before the tabular header. Column names are normalized, dates are reconstructed from year/day-of-year, `-999` is converted to missing, numeric values are coerced, and infinite values are replaced with missing. No imputation or automatic outlier deletion is performed.

The local files are historical exports through 2025-12-31. `validate_data_freshness.py` records this coverage, and forecast generation refuses to publish values when the gap exceeds seven days.
