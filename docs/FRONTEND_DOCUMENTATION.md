# ClimateSense Odisha — Frontend Documentation

**Framework:** React 18 + Vite + TypeScript  
**Styling:** Tailwind CSS + Custom ClimateTech Theme  
**Icons:** Lucide React  
**Charting:** Recharts  
**Source Directory:** `frontend/src/`  

---

## 1. Design Philosophy & User Experience

ClimateSense Odisha is designed as a modern climate analytics and machine learning prediction platform rather than a generic administrative dashboard.

### 1.1 Visual Identity & Color System
- **Backgrounds:** Crisp slate-50 in Light mode; Deep Navy & Slate (`#0a0f1d` / `#0f172a`) in Dark mode.
- **Brand Accents:** Teal (`#0d9488`), Cyan (`#06b6d4`), Sky Blue (`#0284c7`), and Soft Emerald (`#10b981`).
- **Typography:** `Plus Jakarta Sans` for clean scientific readability and `JetBrains Mono` for dates and numeric metrics.
- **Theme Persistence & Segmented Switcher:** Prominent segmented toggle pill in the top navigation bar featuring dedicated Light (Sun icon) and Dark (Moon icon) buttons, system auto-detection, and persistent storage in `localStorage`.
- **Theme-Aware Chart Tooltips:** Custom floating cards (`AnomalyTooltip`, `MultiSeriesTooltip`, `TrendTooltip`) replacing default Recharts tooltips with high-contrast colored metrics, delta pills, units, and clear visibility in both light and dark themes.

### 1.2 Layout Alignment & Structural Architecture
- **Full-Width Navigation Rail:** The top `Navbar` spans the complete viewport width with backdrop blur and border separation.
- **Left-Docked Sidebar:** Fixed on mobile drawer overlays and sticky docked to the left rail on desktop displays (`w-64 shrink-0 top-16 h-[calc(100vh-4rem)]`), eliminating awkward centering gaps on widescreen monitors.
- **Responsive Canvas:** The main content container occupies `flex-1 min-w-0` with internal centering (`max-w-7xl mx-auto`), ensuring perfect alignment, ample breathing room, and zero sidebar overlap.

---

## 2. Page Components & Features

### 2.1 Overview Dashboard (`src/pages/OverviewPage.tsx`)
- High-level KPIs: Monitored Districts (15), Total Observations (136,965), Temporal Span (2001–2025), and Forecast Models (6 Targets).
- State-Wide Climate Snapshot: Daily mean temperature, humidity, rainfall, and wind speed averaged across Odisha on the latest observation date.
- 30-Day Multi-Variable Progression Chart: Interactive Recharts time series comparing temperature, humidity, rainfall, and wind speed over the last 30 days of the dataset.
- District Grid Cards: 15 interactive cards displaying district elevation, region, and latest readings.
- Key Empirical Findings: Highlights NASA POWER spatial resolution, rainfall hurdle architecture, and held-out test performance.

### 2.2 Next-Day Prediction — Core Feature (`src/pages/PredictionPage.tsx`)
- **District Selector:** 15 Odisha districts populated dynamically via `GET /api/districts`.
- **Date Picker & Quick Presets:**
  - Date input with quick preset buttons: Historical Validation (`2025-12-30`), Latest Dataset Source (`2025-12-31`), Monsoon Sample (`2025-08-15`), and Future Stale-Source Test (`2026-10-29`).
- **Temporal Alignment Bar:** Highlights selected reference date and predicted next calendar date ($T+1$).
- **Situation Alerts:**
  - *Situation A (Historical Date):* Emerald alert indicating a verified historical prediction with zero future data leakage.
  - *Situation B (Latest Date 2025-12-31):* Blue alert indicating a true 1-day forward forecast.
  - *Situation C (Future Date > 2025-12-31):* Amber alert explaining dataset boundaries and providing 25-year historical climatological normals.
- **Prediction Cards:**
  - Mean Temperature (`T2M`) with Min and Max values.
  - Precipitation (`PRECTOTCORR`) with rain occurrence probability (%), numeric mm/day accumulation, and qualitative rainfall classification badge.
  - Relative Humidity (`RH2M`).
  - Surface Wind Speed (`WS2M`).
- **Post-Hoc Ground Truth Verification Card:** When predicting an available historical date, compares predicted vs actual values and displays the error delta ($\Delta$).
- **7-Day Historical Context Chart:** Visualizes prior observations used to build lag features.
- **Prediction History Log:** Table of recent predictions with CSV export.

### 2.3 Historical Climate Explorer (`src/pages/HistoricalPage.tsx`)
- District selection and date range filtering.
- View mode switch: Daily Observations, Monthly Aggregation, and Annual Climatology.
- Interactive multi-variable time series chart.
- Paged tabular record browser with CSV download.

### 2.4 Statistical Climate Trends (`src/pages/TrendsPage.tsx`)
- Filter by district and climate variable.
- Theil–Sen annual slope comparison bar chart across districts.
- Comprehensive table of 90 district-variable series with Theil–Sen slope, 95% confidence intervals, Kendall tau, and $p$-value significance badges.
- Clear educational note distinguishing long-term empirical trend analysis from short-term weather forecasts.

### 2.5 Climate Anomaly Detection (`src/pages/AnomaliesPage.tsx`)
- Annual temperature anomaly bar chart relative to the 2001–2010 normal baseline.
- **Enhanced High-Contrast Hover Tooltip:** Displays custom floating cards with year, status pill (▲ Warmer / ▼ Cooler), exact temperature anomaly in °C (bold rose/blue), annual observed mean, and 10-year normal baseline.
- Table of detected daily extreme climatological excursions ($|Z| \ge 2.5$) with high-contrast Z-score colors and flame/snowflake anomaly category badges.
- Clear disclaimer clarifying that statistical or ML anomalies indicate unusual departures from historical climatology and do not automatically denote civil disasters.

### 2.6 Model Architecture & Evaluation (`src/pages/ModelPerformancePage.tsx`)
- Out-of-sample metrics comparing Validation vs Test partitions for all 6 targets.
- Contemporaneous Baseline Regressor vs 1-Day Forward Forecasting Model card.
- District-by-district test set performance table.
- Plain language definitions of MAE, RMSE, and $R^2$.
- Documented model limitations.

### 2.7 About Project (`src/pages/AboutPage.tsx`)
- Research background, problem statement, NASA POWER citations, spatial grid resolution findings, and full technology stack.

---

## 3. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on [http://localhost:5173](http://localhost:5173).

