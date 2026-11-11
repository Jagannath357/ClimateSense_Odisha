# ClimateSense Odisha — Machine Learning Model Integration

**Model Format:** Python Joblib serialized scikit-learn Pipelines  
**Artifact Location:** `ml/models/multi_target/*.joblib`  
**Integration Service:** `backend/app/services/model_service.py` & `prediction_service.py`  

---

## 1. Integrated Models Inventory

| Target | Model Artifact | Algorithm | Pipeline Transformers | Test MAE | Test R² / F1 |
|---|---|---|---|---|---|
| **`T2M`** | `T2M.joblib` | `HistGradientBoostingRegressor` | OneHotEncoder + SimpleImputer | 0.5571 °C | 0.9732 |
| **`T2M_MAX`** | `T2M_MAX.joblib` | `HistGradientBoostingRegressor` | OneHotEncoder + SimpleImputer | 0.8781 °C | 0.9396 |
| **`T2M_MIN`** | `T2M_MIN.joblib` | `HistGradientBoostingRegressor` | OneHotEncoder + SimpleImputer | 0.7171 °C | 0.9639 |
| **`RH2M`** | `RH2M.joblib` | `HistGradientBoostingRegressor` | OneHotEncoder + SimpleImputer | 3.1832 % | 0.9369 |
| **`WS2M`** | `WS2M.joblib` | `HistGradientBoostingRegressor` | OneHotEncoder + SimpleImputer | 0.4122 m/s | 0.6999 |
| **`PRECTOTCORR`** | `PRECTOTCORR.joblib` | Hurdle: Classifier + Log-Regressor | OneHotEncoder + SimpleImputer | 2.7789 mm/d | F1: 0.9410 |
| **Baseline** | `baseline_hist_gradient_boosting.joblib` | Contemporaneous Regressor | SimpleImputer(median) | 0.1899 °C | 0.9972 |

---

## 2. Feature Schema & Ordering Verification

The inference pipeline reproduces the exact feature ordering used during model training:

```python
feature_columns = [
    "district",
    "month",
    "day_of_year",
    "month_sin",
    "month_cos",
    f"{target}_lag_1",
    f"{target}_lag_2",
    f"{target}_lag_3",
    f"{target}_lag_7",
    f"{target}_lag_14",
    f"{target}_rolling_7d"
]
```

### Feature Construction Invariants:
1. `district`: Categorical string matching one of the 15 normalized district keys.
2. `month` & `day_of_year`: Calendar attributes corresponding to the **forecast date** ($T+1$).
3. `month_sin` & `month_cos`: Trigonometric seasonal encodings:
   $$\sin\left(\frac{2\pi \cdot \text{month}}{12}\right), \quad \cos\left(\frac{2\pi \cdot \text{month}}{12}\right)$$
4. `lag_1`: Observed value at $T_{\text{input}}$.
5. `lag_2`: Observed value at $T_{\text{input}} - 1\text{ day}$.
6. `lag_3`: Observed value at $T_{\text{input}} - 2\text{ days}$.
7. `lag_7`: Observed value at $T_{\text{input}} - 6\text{ days}$.
8. `lag_14`: Observed value at $T_{\text{input}} - 13\text{ days}$.
9. `rolling_7d`: Arithmetic mean of the 7 consecutive days ending at $T_{\text{input}}$:
   $$\frac{1}{7} \sum_{i=0}^6 Y(T_{\text{input}} - i)$$

---

## 3. Two-Stage Hurdle Rainfall Inference

For `PRECTOTCORR`:
```python
occurrence_clf = artifact["occurrence"]
amount_reg = artifact["amount"]

# Stage 1: Rain Occurrence Classification
prob = float(occurrence_clf.predict_proba(feature_row)[:, 1][0])

# Stage 2: Positive Amount Regression
if prob >= 0.5:
    log_amt = float(amount_reg.predict(feature_row)[0])
    amount = max(0.0, float(np.expm1(log_amt)))
else:
    amount = 0.0
```
This handles Odisha's 39.4% zero-inflation without distorting positive monsoon rainfall predictions.

