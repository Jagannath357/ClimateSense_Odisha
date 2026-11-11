# Changelog

## 2026-10-29

- Refactored next-day inference to produce one district-level row with temperature, rainfall, humidity, and wind-speed predictions.
- Added explicit per-target status fields, data freshness status, forecast date, last observation date, and model names.
- Added target model metadata with feature schema, split ranges, parameters, data fingerprint, and model version.
- Updated presentation formatting and automated tests for the four-variable wide output schema.

Earlier 2026-10-29 milestones:

- Added NASA POWER CSV discovery, metadata-aware loading, audit, preprocessing, EDA, feature engineering, chronological splits, baseline training, tests, and documentation.
- Added final untouched-test prediction CSV, residual diagnostics, district metrics, final report, and artifact tests.
- Replaced stale historical fallback values with explicit unavailable status; added multi-target models, rainfall occurrence/amount modeling, freshness reports, and climate trend analysis.
- Added centralized temperature/rainfall/date formatting, configurable rainfall descriptions, formatted output export, and rainfall distribution findings.
