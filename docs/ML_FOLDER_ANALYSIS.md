# ClimateSense Odisha — Machine Learning Implementation Analysis

**Project Name:** ClimateSense Odisha  
**Domain:** Meteorological Analysis, Empirical Climatology & Machine Learning Forecasting  
**Source of Truth:** `ml/` repository directory  
**Analysis Date:** November 2026  
**Document Purpose:** Comprehensive audit, structural inventory, architectural analysis, data quality inspection, and full-stack integration blueprint for the ClimateSense Odisha platform.

---

## 1. Executive Summary & Inventory

The `ml/` directory contains an end-to-end Python machine learning pipeline tailored for 15 meteorological districts in the State of Odisha, India. The project ingests daily agro-climatological exports from the NASA POWER (Prediction Of Worldwide Energy Resources) project spanning 25 full calendar years (January 1, 2001 through December 31, 2025).

The primary modeling objectives comprise:
1. **Mean Air Temperature (`T2M`)** at 2 meters above ground level (°C).
2. **Maximum Daily Temperature (`T2M_MAX`)** at 2 meters (°C).
3. **Minimum Daily Temperature (`T2M_MIN`)** at 2 meters (°C).
4. **Relative Humidity (`RH2M`)** at 2 meters (%).
5. **Wind Speed (`WS2M`)** at 2 meters (m/s).
6. **Corrected Precipitation (`PRECTOTCORR`)** daily accumulation (mm/day) using a dual-stage hurdle architecture (binary occurrence classifier followed by positive-amount log-transformed regression).

### 1.1 Complete File and Directory Inventory

| Path | Type | Role & Description |
|---|---|---|
| `ml/configs/config.yaml` | Configuration | Global pipeline parameters, split ratios (0.70/0.15/0.15), sentinel value (-999), climatology baseline years (2001–2010). |
| `ml/pyproject.toml` | Build Config | Python packaging configuration and test runner settings. |
| `ml/requirements.txt` | Dependencies | Pinned dependencies (`scikit-learn`, `pandas`, `numpy`, `joblib`, `scipy`, `matplotlib`, `seaborn`, `statsmodels`, `pytest`, `openpyxl`, `reportlab`). |
| `ml/README.md` | Documentation | Pipeline CLI documentation and operational safeguards. |
| `ml/data/raw/*.csv` (15 files) | Raw Data | Individual NASA POWER daily export files for 15 Odisha districts. |
| `ml/data/processed/climate_daily_cleaned.csv` | Clean Data | Unified, sanitized, chronologically sorted dataset (136,965 rows, 14 columns). |
| `ml/data/splits/train.csv` | Split Data | Chronological training partition (95,865 rows; 2001-01-01 to 2018-07-01). |
| `ml/data/splits/validation.csv` | Split Data | Chronological validation partition (20,550 rows; 2018-07-02 to 2022-04-01). |
| `ml/data/splits/test.csv` | Split Data | Chronological held-out test partition (20,550 rows; 2022-04-02 to 2025-12-31). |
| `ml/models/baseline_hist_gradient_boosting.joblib` | Model Artifact | Single-day contemporaneous regression baseline for `T2M`. |
| `ml/models/tomorrow_lag_model.joblib` | Model Artifact | 1-day-ahead lag regression model for `T2M`. |
| `ml/models/multi_target/T2M.joblib` | Model Artifact | 1-day-ahead HistGradientBoosting regressor for Mean Temperature. |
| `ml/models/multi_target/T2M_MAX.joblib` | Model Artifact | 1-day-ahead HistGradientBoosting regressor for Maximum Temperature. |
| `ml/models/multi_target/T2M_MIN.joblib` | Model Artifact | 1-day-ahead HistGradientBoosting regressor for Minimum Temperature. |
| `ml/models/multi_target/RH2M.joblib` | Model Artifact | 1-day-ahead HistGradientBoosting regressor for Relative Humidity. |
| `ml/models/multi_target/WS2M.joblib` | Model Artifact | 1-day-ahead HistGradientBoosting regressor for Wind Speed. |
| `ml/models/multi_target/PRECTOTCORR.joblib` | Model Artifact | Two-stage hurdle model: Classifier (occurrence) + Regressor (amount). |
| `ml/models/multi_target/*_metadata.json` | Metadata | Target schema, feature names, hyperparams, sample sizes, and SHA256 fingerprints. |
| `ml/outputs/metrics/multi_target_metrics.json` | Metrics | Comprehensive validation and test metrics for all 6 targets. |
| `ml/outputs/metrics/final_test_metrics.json` | Metrics | Baseline model test evaluation metrics. |
| `ml/outputs/metrics/final_test_metrics_by_district.csv` | Metrics | District-by-district MAE, RMSE, and bias breakdown. |
| `ml/outputs/metrics/climate_trend_statistics.csv` | Trend Stats | 90 district-variable series containing Theil–Sen slope and Kendall tau. |
| `ml/outputs/metrics/annual_district_anomalies.csv` | Anomalies | 375 records (15 districts × 25 years) measuring anomaly vs 2001–2010 baseline. |
| `ml/outputs/figures/*.png` | Visualizations | Actual vs predicted, residual distributions, correlation heatmaps, time series. |
| `ml/src/climatesense/pipeline.py` | Core Library | Reusable loader, parser, auditor, preprocessor, feature engineer, and splitter. |
| `ml/src/climatesense/formatting.py` | Presentation | Standardized formatting for temperatures, rainfall amounts, and categories. |
| `ml/scripts/inspect_datasets.py` | Script | Discovers and audits raw NASA POWER CSVs. |
| `ml/scripts/run_preprocessing.py` | Script | Cleans raw files and builds `climate_daily_cleaned.csv`. |
| `ml/scripts/run_eda.py` | Script | Generates descriptive statistics, correlation matrices, and time series plots. |
| `ml/scripts/prepare_splits.py` | Script | Generates chronological partitions in `data/splits/`. |
| `ml/scripts/run_training.py` | Script | Trains baseline contemporaneous model. |
| `ml/scripts/run_multi_target_training.py` | Script | Trains all 6 one-day-ahead multi-target forecasting pipelines. |
| `ml/scripts/run_climate_trends.py` | Script | Computes Mann–Kendall tests, Sen's slope, and annual baseline anomalies. |
| `ml/scripts/predict_tomorrow.py` | Script | Batch generates tomorrow's prediction for all 15 districts. |
| `ml/scripts/interactive_next_day_prediction.py` | Script | Terminal CLI for date-based and district-based inference. |
| `ml/scripts/generate_final_predictions.py` | Script | Evaluates baseline model against untouched test partition. |
| `ml/scripts/validate_data_freshness.py` | Script | Audits dataset recency and reports gap days against execution date. |
| `ml/tests/*.py` | Test Suite | Unit tests for formatting, pipeline integrity, and prediction artifacts. |

---

## 2. Data Pipeline Architecture & Execution Flow

The end-to-end data lifecycle follows a strictly chronological, non-leaking pipeline:

```
[Raw NASA POWER CSVs (15 districts)]
                  │
                  ▼ (parse_nasa_csv: strip header, extract lat/lon, replace -999)
     [Raw Ingestion Audit]
                  │
                  ▼ (preprocess: check infinitives, enforce stable date-district ordering)
  [Cleaned Dataset: climate_daily_cleaned.csv (136,965 rows)]
                  │
                  ├───────────────────────────────┬────────────────────────────────┐
                  ▼                               ▼                                ▼
       [Exploratory Analysis]           [Climate Trend Engine]           [Feature Engineering]
  (Descriptive stats, Spearman       (Annual district aggregations,       (Target-specific lags: 1, 2, 3, 7, 14,
   correlation, distribution plots)   2001-2010 baseline subtraction,      rolling 7d shifted by 1,
                                       Theil–Sen slopes, Kendall tau)      calendar sin/cos cyclic encoding)
                                                                                   │
                                                                                   ▼
                                                                     [Chronological Partitioning]
                                                                     Train: 70% (2001-01-01 to 2018-07-01)
                                                                     Val:   15% (2018-07-02 to 2022-04-01)
                                                                     Test:  15% (2022-04-02 to 2025-12-31)
                                                                                   │
                                                                                   ▼
                                                                     [Multi-Target Model Training]
                                                                     - 5 Regressors (T2M, T2M_MAX, T2M_MIN,
                                                                       RH2M, WS2M) via HistGradientBoosting
                                                                     - 1 Hurdle Dual-Stage (PRECTOTCORR)
                                                                       via Classifier + Log-Regressor
                                                                                   │
                                                                                   ▼
                                                                     [Evaluation & Artifact Export]
                                                                     (Joblib models, metadata JSON, metrics CSV,
                                                                      held-out test residuals and figures)
```

---

## 3. Dataset Inspection & In-Depth Data Quality Audit

### 3.1 Dataset Schema & Variables
The unified processed dataset `climate_daily_cleaned.csv` comprises **136,965 rows** and **14 columns**.

| Feature Column | Storage Type | Physical Meaning | NASA POWER Source Unit | Value Range in Data |
|---|---|---|---|---|
| `source_file` | string | Filename of district export | N/A | `angul.csv` to `sundargarh.csv` |
| `district` | string | Normalized district identifier | N/A | 15 unique district strings |
| `year` | int64 | Gregorian calendar year | Years | 2001 to 2025 |
| `doy` | int64 | Day of Year (1 to 365/366) | Days | 1 to 366 |
| `date` | datetime64[ns] | ISO Calendar Date (YYYY-MM-DD) | Date | 2001-01-01 to 2025-12-31 |
| `T2M` | float64 | Air temperature at 2 meters | °C | 8.87 to 39.42 |
| `T2M_MAX` | float64 | Maximum air temperature at 2m | °C | 13.91 to 46.12 |
| `T2M_MIN` | float64 | Minimum air temperature at 2m | °C | 4.31 to 32.22 |
| `T2MDEW` | float64 | Dew/Frost point at 2 meters | °C | -2.63 to 29.08 |
| `RH2M` | float64 | Relative humidity at 2 meters | % | 12.38 to 99.38 |
| `PRECTOTCORR` | float64 | Corrected precipitation | mm/day | 0.00 to 193.95 |
| `WS2M` | float64 | Wind speed at 2 meters | m/s | 0.40 to 16.92 |
| `ALLSKY_SFC_SW_DWN` | float64 | All-sky solar irradiance | MJ/m²/day | 0.44 to 29.83 |
| `PS` | float64 | Surface atmospheric pressure | kPa | 88.08 to 101.99 |

### 3.2 Continuity and Missingness
- **Observation Completeness:** Exactly **9,131 daily records** exist for each of the 15 districts (365 days × 19 standard years + 366 days × 6 leap years [2004, 2008, 2012, 2016, 2020, 2024]).
- **Temporal Continuity:** Every district's time series is 100% continuous without missing calendar dates, duplicate timestamps, or temporal breaks.
- **Missing Value Sentinel Handling:** Raw NASA POWER files encode sensor voids or invalid calculations as `-999`. The pipeline explicitly converts `-999` to `np.nan` rather than zero. In the cleaned dataset, all 136,965 rows have valid numerical readings with zero remaining NaNs.

### 3.3 Critical Data Quality Finding: The Bargarh vs Sambalpur & Khurda vs Puri Anomalies

An exhaustive comparison across all pairs of districts yielded two significant empirical discoveries:

#### Case 1: Bargarh and Sambalpur (100% Identical)
- **Empirical Check:** Bargarh and Sambalpur share **100.00% identical values** across **all 9 meteorological and surface variables** (`T2M`, `T2M_MAX`, `T2M_MIN`, `T2MDEW`, `RH2M`, `PRECTOTCORR`, `WS2M`, `ALLSKY_SFC_SW_DWN`, `PS`) for every single day from January 1, 2001 to December 31, 2025 (9,131 days).
- **Physical Root Cause:**
  - Bargarh coordinates: Latitude 21.33° N, Longitude 83.62° E.
  - Sambalpur coordinates: Latitude 21.4669° N, Longitude 83.9812° E.
  - NASA POWER relies on the NASA GMAO MERRA-2 meteorological reanalysis assimilation grid, which has a spatial resolution of **0.5° latitude by 0.625° longitude**.
  - Both coordinates fall into the **exact same 0.5° × 0.625° MERRA-2 grid cell**, for which the model elevation is recorded as **222.75 meters**. Because NASA POWER serves spatial grid averages rather than point weather station measurements, both queries returned identical MERRA-2 assimilation outputs.

#### Case 2: Khurda and Puri (99.96% Identical)
- **Empirical Check:** Khurda (lat 20.18, lon 85.62) and Puri (lat 19.8135, lon 85.8315) are **100.00% identical** across `T2M`, `T2M_MAX`, `T2M_MIN`, `T2MDEW`, `RH2M`, `PRECTOTCORR`, `WS2M`, and `PS`, and share the identical MERRA-2 elevation of **37.91 meters**.
- **Exception:** Only `ALLSKY_SFC_SW_DWN` differs (0.36% match), because solar radiation is derived from the satellite-based CERES/GEWEX solar grid which operates on a distinct 1° × 1° spatial mesh.

#### Data Integrity Decision
In accordance with scientific standards and project instructions:
1. **The data is NOT silently altered or artificially modified.**
2. The web application, APIs, and documentation will explicitly state why these neighboring districts exhibit identical NASA POWER climate histories.

---

## 4. Machine Learning Model Architecture & Preprocessing

The project utilizes two distinct classes of models:
1. **Contemporaneous Baseline Model:** Diagnoses physical covariation among same-day variables.
2. **One-Day-Ahead Lag Forecasting Models (Multi-Target Pipeline):** Operational models designed for true predictive forecasting of tomorrow's weather given historical observations.

### 4.1 Feature Construction Logic for 1-Day-Ahead Forecasting

For each prediction target $Y \in \{\text{T2M}, \text{T2M\_MAX}, \text{T2M\_MIN}, \text{RH2M}, \text{WS2M}, \text{PRECTOTCORR}\}$:
1. **Grouping:** Data is grouped strictly by `district` and sorted by `date ASC`.
2. **Lag Features:** Lags at $t-1, t-2, t-3, t-7, t-14$ days:
   $$\text{Lag}_k(t) = Y(t - k)$$
3. **Rolling Features:** A 7-day rolling mean shifted by 1 day to strictly preclude data leakage:
   $$\text{Rolling7d}(t) = \frac{1}{7} \sum_{k=1}^7 Y(t - k)$$
4. **Calendar & Seasonality Features:**
   $$\text{month} = \text{Month}(t), \quad \text{day\_of\_year} = \text{DOY}(t)$$
   $$\text{month\_sin} = \sin\left(\frac{2\pi \cdot \text{month}}{12}\right), \quad \text{month\_cos} = \cos\left(\frac{2\pi \cdot \text{month}}{12}\right)$$
5. **Categorical Features:** `district` (15 categorical levels).

### 4.2 Machine Learning Algorithms

#### 1. Continuous Meteorological Variables (`T2M`, `T2M_MAX`, `T2M_MIN`, `RH2M`, `WS2M`)
- **Algorithm:** `HistGradientBoostingRegressor` (scikit-learn implementation of LightGBM-style histogram-based gradient boosted decision trees).
- **Hyperparameters:** `max_iter=180`, `learning_rate=0.06`, `random_state=42`.
- **Pipeline:**
  - `OneHotEncoder(handle_unknown="ignore", sparse_output=False)` for `district`.
  - `SimpleImputer(strategy="median")` for numerical features.
  - Regressor fitted on training split only.

#### 2. Precipitation (`PRECTOTCORR`) Dual-Stage Hurdle Architecture
Daily rainfall exhibits severe zero-inflation (39.36% of daily records in Odisha have 0.00 mm precipitation, with extreme positive skew up to 193.95 mm/day). Standard single-stage MSE regression collapses toward the median, underestimating heavy precipitation events.
- **Stage 1 (Rain Occurrence):** `HistGradientBoostingClassifier` trained on binary label $\mathbb{I}(Y > 0)$.
  - Predicts probability $P(\text{Rain} > 0 \mid X)$.
  - Decision threshold: $P \ge 0.5 \implies \text{Rain predicted}$.
- **Stage 2 (Rain Amount):** `HistGradientBoostingRegressor` trained exclusively on positive rain observations ($Y > 0$) with target $\log(1 + Y)$.
  - Predicted amount: $\hat{Y} = \max(0, \exp(\hat{z}) - 1)$.
- **Combined Inference:**
  $$\hat{Y}_{\text{final}} = \begin{cases} \hat{Y}_{\text{amount}} & \text{if } P(\text{Rain} > 0) \ge 0.5 \\ 0.0 & \text{otherwise} \end{cases}$$

---

## 5. Model Evaluation Metrics (Actual Recorded Results)

All performance metrics below are extracted directly from `ml/outputs/metrics/multi_target_metrics.json` and `ml/outputs/metrics/final_test_metrics.json`. No metrics are fabricated.

### 5.1 Multi-Target Forecasting Performance (Held-out Test Period: 2022-04-02 to 2025-12-31, 20,550 Rows)

| Target Variable | Target Description | Test MAE | Test RMSE | Test $R^2$ | Classification Metrics (Test) |
|---|---|---:|---:|---:|---|
| **`T2M`** | Mean Temperature (°C) | **0.5571 °C** | **0.7649 °C** | **0.9732** | — |
| **`T2M_MAX`** | Max Temperature (°C) | **0.8781 °C** | **1.2350 °C** | **0.9396** | — |
| **`T2M_MIN`** | Min Temperature (°C) | **0.7171 °C** | **0.9985 °C** | **0.9639** | — |
| **`RH2M`** | Relative Humidity (%) | **3.1832 %** | **4.4465 %** | **0.9369** | — |
| **`WS2M`** | Wind Speed (m/s) | **0.4122 m/s** | **0.5735 m/s** | **0.6999** | — |
| **`PRECTOTCORR`** | Precipitation (mm/day) | **2.7789 mm** | **6.6192 mm** | *N/A (Hurdle)* | **Accuracy: 92.35%**<br>**Precision: 95.20%**<br>**Recall: 93.02%**<br>**F1-Score: 0.9410**<br>**ROC-AUC: 0.9672** |

### 5.2 Baseline Contemporaneous Model vs 1-Day Lag Model
- **Baseline Model (`baseline_hist_gradient_boosting.joblib`):**
  - Features: Contemporaneous same-day variables (`T2M_MAX`, `T2M_MIN`, `RH2M`, `PRECTOTCORR`, `WS2M`, `PS`, etc.).
  - Performance: MAE = 0.1899 °C, RMSE = 0.2487 °C, $R^2 = 0.9972$.
  - Scientific interpretation: Excellent physical consistency model, but requires same-day measurements so cannot forecast future days without auxiliary forecasts.
- **1-Day Lag Model (`models/multi_target/T2M.joblib`):**
  - Features: Strictly prior-day lags ($t-1, t-2, \dots$) and calendar encodings.
  - Performance: MAE = 0.5571 °C, RMSE = 0.7649 °C, $R^2 = 0.9732$.
  - Operational role: Primary engine for user-selected next-day forecasting.

---

## 6. Detailed Analysis of User-Selected Next-Day Prediction

### 6.1 The Date-Based Prediction Workflow
The user selects a `district` and an `input_date` $T_{\text{input}}$. The application must compute a forecast for $T_{\text{pred}} = T_{\text{input}} + 1\text{ day}$.

### 6.2 Data Situations & Boundary Handling

1. **Situation A — Historical Date in Dataset ($2001\text{-}01\text{-}15 \le T_{\text{input}} \le 2025\text{-}12\text{-}30$):**
   - Observations on or before $T_{\text{input}}$ exist in `climate_daily_cleaned.csv`.
   - The lag features ($T_{\text{input}}, T_{\text{input}}-1, T_{\text{input}}-2, T_{\text{input}}-6, T_{\text{input}}-13$) and rolling 7-day average ending at $T_{\text{input}}$ are extracted directly from historical records.
   - Calendar features (`month`, `day_of_year`, `month_sin`, `month_cos`) are calculated for $T_{\text{pred}}$.
   - Saved models run inference.
   - Status: `historical_observation_available` / `model_forecast`.
   - **Zero Data Leakage:** The ground-truth observation at $T_{\text{pred}}$ is never fed into the model; it is only retrieved separately if the user wishes to compare the prediction with the actual historical outcome.

2. **Situation B — Latest Available Dataset Date ($T_{\text{input}} = 2025\text{-}12\text{-}31$):**
   - Forecast date: $T_{\text{pred}} = 2026\text{-}01\text{-}01$.
   - All necessary lag observations (up to 2025-12-31) are present in the dataset.
   - The trained models execute genuine forward inference for the very first day beyond the dataset.
   - Status: `latest_observation_forecast`.

3. **Situation C — Arbitrary Future Date ($T_{\text{input}} > 2025\text{-}12\text{-}31$):**
   - The required recent daily observations do not exist in the NASA POWER offline dataset.
   - **Honest System Behavior:** The system refuses to generate a fake ML forecast. It informs the user:
     *"Weather observations for this date are not available in the current NASA POWER dataset (coverage ends 2025-12-31). A model trained on observed physical lag features cannot generate next-day weather predictions without recent meteorological inputs."*
   - In addition, the system provides a transparent **Climatological Benchmark Estimate** computed as the 25-year historical mean for that specific calendar day ($MM\text{-}DD$) in that district, labeled clearly as `climatological_estimate` and NOT an ML weather prediction.

---

## 7. Statistical Climate Trends & Anomaly Detection

### 7.1 Trend Methodology
- **Annual Aggregation:** 25-year series (2001–2025) of annual district means.
- **Theil–Sen Estimator:** Non-parametric robust linear regression slope ($\Delta / \text{year}$) with 95% confidence intervals.
- **Mann–Kendall / Kendall Tau:** Rank correlation test for monotonic trends with associated $p$-values.
- **Coverage:** 90 individual time series (15 districts × 6 variables) precalculated in `ml/outputs/metrics/climate_trend_statistics.csv`.

### 7.2 Anomaly Methodology
- **Baseline Period:** 2001 to 2010 (10-year climatological normal).
- **Annual Anomaly:**
  $$\text{Anomaly}(d, y, v) = \text{Mean}(d, y, v) - \text{BaselineMean}_{2001-2010}(d, v)$$
- **Daily Climatological Anomalies:** Daily departure from the historical 25-year day-of-year mean normalized by standard deviation ($Z$-score), identifying extreme temperature or precipitation excursions.

---

## 8. Backend & Frontend Architecture Integration Plan

### 8.1 Backend Architecture (`backend/`)
- **Framework:** Python FastAPI with Pydantic v2 schemas and CORS middleware.
- **Model Registry (`ModelService`):** Singleton service that loads all joblib models and metadata into memory once during FastAPI startup.
- **Inference Service (`PredictionService`):** Implements exact feature engineering, lag extraction, hurdle rainfall logic, and situation A/B/C routing.
- **Climate Data Service (`ClimateService`):** Efficient in-memory caching and retrieval of historical daily records, monthly/annual aggregations, trend statistics, and anomaly scores.
- **API Endpoints:**
  - `GET /api/health`
  - `GET /api/districts`
  - `GET /api/dataset/info`
  - `GET /api/dataset/date-range`
  - `POST /api/predictions/next-day`
  - `GET /api/predictions/history`
  - `GET /api/climate/historical`
  - `GET /api/climate/summary`
  - `GET /api/climate/trends`
  - `GET /api/climate/anomalies`
  - `GET /api/models`
  - `GET /api/models/performance`
  - `GET /api/dashboard/summary`

### 8.2 Frontend Architecture (`frontend/`)
- **Framework:** React 18 + Vite + TypeScript.
- **Styling:** Modern Tailwind CSS with dedicated ClimateTech design tokens (Navy, Teal, Cyan, Soft Greens, Warm Ambers), glassmorphism cards, and dark/light mode toggles.
- **Charts:** Chart.js / Recharts for responsive, interactive scientific time series and metric comparisons.
- **Pages:**
  1. `Overview Dashboard`: High-level state summary, key metrics, quick prediction preview, seasonal charts.
  2. `Next-Day Prediction (Highest Priority)`: Full interactive date & district selector, situation A/B/C indicators, multi-variable cards (Temperature, Max/Min, Humidity, Wind, Hurdle Rainfall), 7-day historical context chart, rainfall category badges, prediction history log with CSV export.
  3. `Historical Climate`: Interactive exploration with date-range filters, daily/monthly/annual views, multi-variable plotting, and data table export.
  4. `Climate Trends`: Theil–Sen slope visualization, Kendall tau significance badges, long-term trend direction analysis.
  5. `Anomaly Detection`: Annual departure charts vs 2001–2010 baseline, daily extreme $Z$-score analyzer, disaster distinction disclaimer.
  6. `Model Performance`: Transparent scientific validation report displaying actual MAE, RMSE, $R^2$, F1, ROC-AUC, district comparisons, and baseline vs lag model contrast.
  7. `About Project`: Problem statement, NASA POWER citations, methodology, technology stack, and known constraints.

---

## 9. Conclusion

The `ml/` repository contains a mathematically sound, reproducible, and leakage-safe machine learning system. The upcoming FastAPI backend and React TypeScript frontend will preserve the exact data pipeline without inventing metrics or synthetic predictions, bringing ClimateSense Odisha to life as a research-grade environmental analytics platform.

