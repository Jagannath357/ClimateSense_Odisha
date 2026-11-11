# ClimateSense Odisha — Frontend Application

Modern React 18 + Vite + TypeScript climate intelligence and next-day weather prediction platform for 15 districts across Odisha, India.

## Features
- **Modern Climate-Tech Design:** Deep Navy, Teal, Cyan, and Emerald palette with full Light and Dark mode support persisted in `localStorage`.
- **Overview Dashboard:** High-level state summaries, key observation metrics, 30-day temporal progression charts, and district cards.
- **Next-Day Climate Prediction (Core Feature):**
  - Interactive district selection from 15 monitored districts.
  - User-selected reference date input with automatic next-day target date calculation (`T + 1`).
  - Quick date presets: Historical Validation (`2025-12-30`), Latest Dataset Source (`2025-12-31`), Monsoon Sample (`2025-08-15`), Future Stale-Source Test (`2026-10-29`).
  - Multi-target forecast cards: Mean Temp (`T2M`), Max Temp (`T2M_MAX`), Min Temp (`T2M_MIN`), Relative Humidity (`RH2M`), Wind Speed (`WS2M`), and Corrected Precipitation (`PRECTOTCORR`).
  - Two-Stage Hurdle Rainfall Model breakdown: Rain occurrence probability (%) + positive amount prediction + rainfall classification badge (No Rain, Very Light, Light, Moderate, Heavy, Very Heavy).
  - Situation A/B/C badge routing: Verified Historical Forecast, Latest Observation Forecast, or Climatological Normal Estimate.
  - Post-hoc Ground Truth comparison with absolute error ($\Delta$) when prediction date exists in historical dataset.
  - 7-day pre-forecast context time series chart.
  - Prediction history log with CSV export.
- **Historical Climate Explorer:** Filter by district and date range, toggle between Daily Observations, Monthly Aggregated Means, and Annual Climatology, with tabular pagination and CSV download.
- **Statistical Climate Trends:** Theil–Sen slope estimators and Kendall tau rank correlation p-values for 90 district-variable series, with interactive Sen slope comparison charts.
- **Climate Anomaly Detection:** Annual departure charts vs 2001–2010 normal baseline, and detected daily extreme climatological excursions ($|Z| \ge 2.5$).
- **Model Architecture & Evaluation:** Transparent out-of-sample test metrics (MAE, RMSE, R², Accuracy, Precision, Recall, F1, ROC-AUC), contemporaneous baseline vs 1-day lag model comparison, district breakdown table, and metric definitions.
- **About Project:** NASA POWER spatial grid resolution documentation (MERRA-2 0.5° × 0.625° reanalysis grid sharing explaining Bargarh & Sambalpur identical records), and full technology stack.

## Getting Started

From the `frontend/` directory:

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

The frontend runs at [http://localhost:5173](http://localhost:5173).

## Environment Configuration

Configure the backend API URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

