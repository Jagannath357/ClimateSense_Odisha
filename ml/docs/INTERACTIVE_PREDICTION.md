# Interactive next-day prediction

Run from the project root:

```powershell
.\.venv\Scripts\Activate.ps1
python scripts/interactive_next_day_prediction.py
```

The program asks for:

1. A reference date, accepted as `YYYY-MM-DD`, `DD-MM-YYYY`, `DD/MM/YYYY`, or `YYYY/MM/DD`.
2. A district name, for example `angul`, `cuttack`, or `puri`.

It automatically adds one day to the reference date and prints the prediction date, district, temperature in °C, rainfall in mm/day, rainfall description, latest source observation, and the number of historical observations used.

The current local data ends on 2025-12-31. Therefore this interactive script produces a historical same-calendar-day climatological estimate and explicitly labels it as such. It does not claim to be a live weather forecast.
