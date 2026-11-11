# ClimateSense Odisha — Prediction Methodology

**Core Feature:** User-Selected Date-Based Next-Day Prediction  
**Mathematical Formulation:** One-Day-Ahead Autoregressive Exogenous Forecasting  
**Key Principle:** Absolute Prevention of Data Leakage  

---

## 1. Problem Formulation

Given a user-selected district $d \in \{\text{angul}, \dots, \text{sundargarh}\}$ and a reference observation date $T_{\text{input}}$, the system predicts the meteorological state at:
$$T_{\text{pred}} = T_{\text{input}} + 1\text{ day}$$

The feature set $\mathcal{X}(T_{\text{input}}, T_{\text{pred}}, d)$ is constructed strictly from observations available at or prior to $T_{\text{input}}$.

---

## 2. Situation Handling Strategy

```
                          User Request: (District, Date)
                                        │
                                        ▼
                       Is Date in Dataset (<= 2025-12-31)?
                                   /         \
                                 YES          NO
                                 /              \
                Is Date < 2025-12-31?           Situation C:
                   /            \               Future Date
                 YES             NO             • Refuses to fabricate forecast
                 /                 \            • Returns Stale-Source notification
            Situation A:        Situation B:    • Computes 25-Year Climatological
            Historical Date     Latest Date       Normal (Historical Baseline)
            • Constructs lags   • Constructs lags
            • Runs ML models    • Runs ML models
            • Fetches ground    • Forward forecast
              truth post-hoc      for 2026-01-01
              for error delta
```

### 2.1 Situation A: Historical Date Exists ($T_{\text{input}} \le 2025\text{-}12\text{-}30$)
- **Data Source:** Actual NASA POWER records on or before $T_{\text{input}}$.
- **ML Inference:** Runs the 6 multi-target gradient boosting models.
- **Post-Hoc Verification:** If ground truth for $T_{\text{pred}}$ exists in the dataset, actual values are retrieved for display and absolute error is computed:
  $$\Delta = |\hat{Y} - Y_{\text{actual}}|$$
- **Leakage Safeguard:** Ground-truth observations are retrieved post-hoc and never passed into model feature vectors.

### 2.2 Situation B: Latest Available Dataset Date ($T_{\text{input}} = 2025\text{-}12\text{-}31$)
- **Forecast Target:** $T_{\text{pred}} = 2026\text{-}01\text{-}01$.
- **ML Inference:** The trained models execute genuine forward inference using observations up to December 31, 2025.
- **Ground Truth:** None available in the historical dataset.

### 2.3 Situation C: Future Date Beyond Dataset ($T_{\text{input}} > 2025\text{-}12\text{-}31$)
- **Physical Rationale:** An autoregressive lag model requires observed meteorological data ($t-1, t-2, \dots$). Without physical sensor observations on that date, an ML model cannot predict tomorrow's weather.
- **System Behavior:**
  1. Refuses to display fake predictions.
  2. Sets status to `stale_source_climatology_only` and `is_climatological_estimate = True`.
  3. Provides a 25-year historical same-calendar-day ($MM-DD$) climatological baseline normal, clearly designated as an empirical estimate.

---

## 3. Rainfall Categorization

Rainfall predictions are categorized using the exact interval definitions:
- **0.00 mm:** No measurable rainfall predicted.
- **0.01 – 2.50 mm:** Very light amount.
- **2.50 – 10.00 mm:** Light amount.
- **10.00 – 25.00 mm:** Moderate amount.
- **25.00 – 50.00 mm:** Heavy amount.
- **> 50.00 mm:** Very heavy amount.

