# Prediction output formatting

The shared helpers in `src/climatesense/formatting.py` format display values without changing model precision. Temperature displays to one decimal place with `°C` by default; Fahrenheit conversion is available as a presentation option. Daily precipitation displays to two decimal places as `mm/day`.

Rainfall descriptions use configurable amount thresholds: zero means no measurable rainfall, 0–2.5 mm/day is very light, 2.5–10 is light, 10–25 is moderate, 25–50 is heavy, and above 50 is very heavy. These labels describe predicted amount only; they are not probability-of-rain claims.

Run `python scripts/format_prediction_outputs.py` to create `outputs/metrics/tomorrow_predictions_display.csv`. Unavailable values remain `Unavailable`; they are never converted to zero.
