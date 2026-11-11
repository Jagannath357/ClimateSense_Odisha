import json
import logging
import uuid
from datetime import datetime, date, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List
import numpy as np
import pandas as pd

from backend.app.core.config import settings
from backend.app.core.constants import DISTRICT_METADATA, TARGET_VARIABLES, get_rainfall_category
from backend.app.services.climate_service import climate_service
from backend.app.services.model_service import model_service
from backend.app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    VariablePrediction,
    HistoricalContextPoint,
    GroundTruthComparison,
    PredictionHistoryRecord,
    GeospatialDistrictPrediction,
    GeospatialPredictionResponse,
)

logger = logging.getLogger(__name__)

class PredictionService:
    _instance: Optional["PredictionService"] = None

    def __init__(self):
        self._history_file = settings.PREDICTION_HISTORY_FILE
        self._ensure_history_storage()

    @classmethod
    def get_instance(cls) -> "PredictionService":
        if cls._instance is None:
            cls._instance = PredictionService()
        return cls._instance

    def _ensure_history_storage(self) -> None:
        self._history_file.parent.mkdir(parents=True, exist_ok=True)
        if not self._history_file.exists():
            self._history_file.write_text("[]", encoding="utf-8")

    def _load_history(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self._history_file.read_text(encoding="utf-8"))
        except Exception:
            return []

    def _save_history(self, record: Dict[str, Any]) -> None:
        try:
            history = self._load_history()
            history.insert(0, record)
            # Keep latest 100 predictions
            history = history[:100]
            self._history_file.write_text(json.dumps(history, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save prediction record: {e}")

    def _predict_target_value(
        self,
        district: str,
        recent_vals: np.ndarray,
        target: str,
        forecast_dt: date
    ) -> VariablePrediction:
        """Compute lag features strictly from prior values and evaluate target model."""
        info = TARGET_VARIABLES[target]
        model_artifact = model_service.get_model(target)
        if model_artifact is None:
            return VariablePrediction(
                target=target,
                display_name=info["display_name"],
                value=None,
                unit=info["unit"],
                status="unavailable_missing_model",
                model_name="none"
            )

        if len(recent_vals) < 14:
            return VariablePrediction(
                target=target,
                display_name=info["display_name"],
                value=None,
                unit=info["unit"],
                status="unavailable_missing_lag_features",
                model_name="none"
            )

        lags = [recent_vals[-1], recent_vals[-2], recent_vals[-3], recent_vals[-7], recent_vals[-14]]
        rolling_window = recent_vals[-7:]
        if any(pd.isna(v) for v in lags) or pd.isna(rolling_window).any():
            return VariablePrediction(
                target=target,
                display_name=info["display_name"],
                value=None,
                unit=info["unit"],
                status="unavailable_missing_lag_features",
                model_name="none"
            )

        feature_cols = model_artifact["feature_columns"]
        feat_dict: Dict[str, Any] = {
            "district": district,
            "month": forecast_dt.month,
            "day_of_year": forecast_dt.timetuple().tm_yday,
            "month_sin": np.sin(2 * np.pi * forecast_dt.month / 12),
            "month_cos": np.cos(2 * np.pi * forecast_dt.month / 12),
            f"{target}_lag_1": float(lags[0]),
            f"{target}_lag_2": float(lags[1]),
            f"{target}_lag_3": float(lags[2]),
            f"{target}_lag_7": float(lags[3]),
            f"{target}_lag_14": float(lags[4]),
            f"{target}_rolling_7d": float(np.mean(rolling_window)),
        }
        feat_row = pd.DataFrame([feat_dict])[feature_cols]

        if target == "PRECTOTCORR":
            occurrence_clf = model_artifact["occurrence"]
            amount_reg = model_artifact["amount"]
            prob = float(occurrence_clf.predict_proba(feat_row)[:, 1][0])
            if prob >= 0.5:
                log_amt = float(amount_reg.predict(feat_row)[0])
                pred_amt = round(max(0.0, float(np.expm1(log_amt))), 2)
            else:
                pred_amt = 0.0

            return VariablePrediction(
                target=target,
                display_name=info["display_name"],
                value=pred_amt,
                unit=info["unit"],
                status="available",
                model_name="Two-Stage Hurdle (HistGradientBoosting Classifier + Regressor)",
                rainfall_probability=round(prob, 4),
                rainfall_category=get_rainfall_category(pred_amt)
            )

        regressor = model_artifact["model"]
        pred_val = round(float(regressor.predict(feat_row)[0]), 2)
        return VariablePrediction(
            target=target,
            display_name=info["display_name"],
            value=pred_val,
            unit=info["unit"],
            status="available",
            model_name="HistGradientBoostingRegressor (1-Day Lag Pipeline)"
        )

    def predict_next_day(self, request: PredictionRequest) -> PredictionResponse:
        district = request.district.strip().lower()
        if district not in climate_service.districts:
            raise ValueError(f"District '{district}' is not recognized. Available: {', '.join(climate_service.districts)}")

        # Parse and validate selected input date
        try:
            input_dt = datetime.strptime(request.selected_date.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Invalid date format. Please use YYYY-MM-DD (e.g., '2025-12-30').")

        forecast_dt = input_dt + timedelta(days=1)
        input_date_str = input_dt.isoformat()
        prediction_date_str = forecast_dt.isoformat()
        meta = DISTRICT_METADATA.get(district, {})
        district_name = meta.get("name", district.title())

        dataset_min = datetime.strptime(climate_service.date_min, "%Y-%m-%d").date()
        dataset_max = datetime.strptime(climate_service.date_max, "%Y-%m-%d").date()

        # Check earliest allowed date for 14-day lags
        min_allowed_date = dataset_min + timedelta(days=14)
        if input_dt < min_allowed_date:
            raise ValueError(f"Input date {input_date_str} is too early. At least 14 days of prior history ({min_allowed_date.isoformat()}) are required to construct lag features.")

        # Determine Situation A, B, or C
        df = climate_service.df
        district_data = df[(df["district"] == district) & (df["date_str"] <= input_date_str)].sort_values("date").copy()

        is_climatological = False
        data_status = ""
        predictions_map: Dict[str, VariablePrediction] = {}
        model_info_map: Dict[str, str] = {}
        disclaimer = ""
        data_gap_days = max(0, (input_dt - dataset_max).days)

        if input_dt <= dataset_max and not district_data.empty:
            # Check gap between selected date and latest available observation in subset
            latest_sub_date = district_data["date"].max().date()
            sub_gap = (input_dt - latest_sub_date).days

            if sub_gap == 0:
                if input_dt == dataset_max:
                    data_status = "latest_observation_forecast"
                    disclaimer = "Forecast generated from the latest available dataset observations using trained multi-target lag models."
                else:
                    data_status = "historical_observation_available"
                    disclaimer = "Forecast generated from historical observations on the selected date using the trained multi-target lag models. Target-day values were strictly excluded from input features."

                # Construct features and predict for each target
                for target in TARGET_VARIABLES:
                    recent_vals = district_data[target].values
                    var_pred = self._predict_target_value(district, recent_vals, target, forecast_dt)
                    predictions_map[target] = var_pred
                    if target == "PRECTOTCORR":
                        model_info_map[target] = "HistGradientBoosting Hurdle Model"
                    else:
                        model_info_map[target] = f"HistGradientBoostingRegressor ({target})"
            else:
                # Historical gap exists within dataset
                data_status = "unavailable_historical_gap"
                disclaimer = f"Historical observations for {district_name} have a gap at {input_date_str}."
        else:
            # Situation C: Selected date is past the end of the dataset
            is_climatological = True
            data_status = "stale_source_climatology_only"
            disclaimer = (
                f"Selected date {input_date_str} is beyond the current NASA POWER dataset boundary ({dataset_max.isoformat()}). "
                "A model trained on observed physical lag features cannot forecast without current meteorological inputs. "
                "Displayed values are historical same-calendar-day (2001–2025) climatological normals and MUST NOT be treated as live weather forecasts."
            )

            # Calculate 25-year historical calendar-day mean (month-day)
            req_md = forecast_dt.strftime("%m-%d")
            cal_slice = df[(df["district"] == district) & (df["month_day"] == req_md)]

            for target, info in TARGET_VARIABLES.items():
                mean_val = cal_slice[target].mean() if not cal_slice.empty else None
                num_val = round(float(mean_val), 2) if (mean_val is not None and pd.notna(mean_val)) else None
                rain_cat = get_rainfall_category(num_val) if target == "PRECTOTCORR" else None

                predictions_map[target] = VariablePrediction(
                    target=target,
                    display_name=info["display_name"],
                    value=num_val,
                    unit=info["unit"],
                    status="climatological_estimate",
                    model_name="25-Year Climatological Day-of-Year Mean",
                    rainfall_category=rain_cat
                )
                model_info_map[target] = "Climatological Mean (Historical Normal)"

        # Extract 7-day historical context leading up to input_date
        recent_7d: List[HistoricalContextPoint] = []
        if not district_data.empty:
            tail_7 = district_data.tail(7)
            for _, r in tail_7.iterrows():
                recent_7d.append(HistoricalContextPoint(
                    date=r["date_str"],
                    T2M=round(float(r["T2M"]), 2) if pd.notna(r["T2M"]) else None,
                    T2M_MAX=round(float(r["T2M_MAX"]), 2) if pd.notna(r["T2M_MAX"]) else None,
                    T2M_MIN=round(float(r["T2M_MIN"]), 2) if pd.notna(r["T2M_MIN"]) else None,
                    RH2M=round(float(r["RH2M"]), 2) if pd.notna(r["RH2M"]) else None,
                    PRECTOTCORR=round(float(r["PRECTOTCORR"]), 2) if pd.notna(r["PRECTOTCORR"]) else None,
                    WS2M=round(float(r["WS2M"]), 2) if pd.notna(r["WS2M"]) else None,
                ))

        # Check Ground Truth on prediction_date if within dataset
        ground_truth: Optional[GroundTruthComparison] = None
        gt_slice = df[(df["district"] == district) & (df["date_str"] == prediction_date_str)]
        if not gt_slice.empty and not is_climatological:
            actual_row = gt_slice.iloc[0]
            actual_vals = {}
            abs_errs = {}
            for target in TARGET_VARIABLES:
                act = float(actual_row[target]) if pd.notna(actual_row[target]) else None
                actual_vals[target] = round(act, 2) if act is not None else None
                pred_item = predictions_map.get(target)
                if act is not None and pred_item and pred_item.value is not None:
                    abs_errs[target] = round(abs(pred_item.value - act), 2)
                else:
                    abs_errs[target] = None

            ground_truth = GroundTruthComparison(
                has_ground_truth=True,
                date=prediction_date_str,
                note="Historical actual observation retrieved post-hoc for verification; was strictly withheld from model input features.",
                actual_values=actual_vals,
                absolute_errors=abs_errs
            )
        else:
            ground_truth = GroundTruthComparison(
                has_ground_truth=False,
                date=prediction_date_str,
                note="Ground truth observation is not available in the dataset for this forecast date.",
                actual_values={},
                absolute_errors={}
            )

        response = PredictionResponse(
            success=True,
            district=district,
            district_display_name=district_name,
            input_date=input_date_str,
            prediction_date=prediction_date_str,
            prediction_type="next_day",
            data_status=data_status,
            is_climatological_estimate=is_climatological,
            data_gap_days=data_gap_days,
            latest_available_date=climate_service.date_max,
            predictions=predictions_map,
            recent_7d_context=recent_7d,
            ground_truth_comparison=ground_truth,
            disclaimer=disclaimer,
            generated_at=datetime.now(timezone.utc).isoformat(),
            model_information=model_info_map
        )

        # Record prediction to history storage
        record_id = str(uuid.uuid4())[:8]
        hist_entry = {
            "id": record_id,
            "timestamp": response.generated_at,
            "district": district,
            "district_display_name": district_name,
            "input_date": input_date_str,
            "prediction_date": prediction_date_str,
            "data_status": data_status,
            "is_climatological_estimate": is_climatological,
            "predictions": {
                k: {
                    "value": v.value,
                    "unit": v.unit,
                    "status": v.status,
                    "rainfall_category": v.rainfall_category
                } for k, v in predictions_map.items()
            }
        }
        self._save_history(hist_entry)

        return response

    def get_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        history = self._load_history()
        return history[:limit]

    def predict_geospatial_all_districts(
        self,
        prediction_date: Optional[str] = None,
        mode: str = "prediction"
    ) -> GeospatialPredictionResponse:
        """Generate or retrieve all-15-district weather data for a given forecast or observation date."""
        df = climate_service.df
        if df is None or climate_service.date_min is None or climate_service.date_max is None:
            raise ValueError("Climate dataset is not loaded.")

        dataset_min = datetime.strptime(climate_service.date_min, "%Y-%m-%d").date()
        dataset_max = datetime.strptime(climate_service.date_max, "%Y-%m-%d").date()

        if mode not in {"prediction", "observation"}:
            raise ValueError("Invalid mode. Must be 'prediction' or 'observation'.")

        if prediction_date:
            try:
                pred_dt = datetime.strptime(prediction_date.strip(), "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Invalid prediction_date format. Use YYYY-MM-DD (e.g., '2026-01-01').")
        else:
            # Default: Latest available ML forecast date (latest observation + 1 day)
            pred_dt = dataset_max + timedelta(days=1) if mode == "prediction" else dataset_max

        pred_date_str = pred_dt.isoformat()
        input_dt = pred_dt - timedelta(days=1)
        input_date_str = input_dt.isoformat()
        min_allowed_input = dataset_min + timedelta(days=14)
        generated_at = datetime.now(timezone.utc).isoformat()

        district_items: List[GeospatialDistrictPrediction] = []
        available_count = 0

        if mode == "observation":
            obs_slice = df[df["date_str"] == pred_date_str]
            has_obs = dataset_min <= pred_dt <= dataset_max and not obs_slice.empty
            prediction_type = "historical_observation" if has_obs else "unavailable"
            data_status = "historical_observation_available" if has_obs else "unavailable_no_observation"
            is_climatological = False
            data_gap_days = max(0, (pred_dt - dataset_max).days)
            disclaimer = (
                f"Displaying verified NASA POWER daily meteorological observations recorded on {pred_date_str}."
                if has_obs
                else f"No historical NASA POWER observations exist for {pred_date_str} (dataset spans {climate_service.date_min} to {climate_service.date_max})."
            )

            obs_by_district = {r["district"]: r for _, r in obs_slice.iterrows()} if has_obs else {}
            for d_id in sorted(DISTRICT_METADATA.keys()):
                meta = DISTRICT_METADATA[d_id]
                row = obs_by_district.get(d_id)
                if row is not None:
                    rain_val = round(float(row["PRECTOTCORR"]), 2) if pd.notna(row["PRECTOTCORR"]) else None
                    t2m_val = round(float(row["T2M"]), 2) if pd.notna(row["T2M"]) else None
                    if t2m_val is not None:
                        available_count += 1
                    district_items.append(GeospatialDistrictPrediction(
                        district=d_id,
                        district_display_name=meta["name"],
                        latitude=meta["latitude"],
                        longitude=meta["longitude"],
                        elevation_m=meta["elevation_m"],
                        region=meta["region"],
                        grid_note=meta.get("note"),
                        T2M=t2m_val,
                        T2M_MAX=round(float(row["T2M_MAX"]), 2) if pd.notna(row["T2M_MAX"]) else None,
                        T2M_MIN=round(float(row["T2M_MIN"]), 2) if pd.notna(row["T2M_MIN"]) else None,
                        RH2M=round(float(row["RH2M"]), 2) if pd.notna(row["RH2M"]) else None,
                        PRECTOTCORR=rain_val,
                        WS2M=round(float(row["WS2M"]), 2) if pd.notna(row["WS2M"]) else None,
                        rainfall_probability=None,
                        rainfall_category=get_rainfall_category(rain_val) if rain_val is not None else None,
                        status="available",
                        data_quality_status="observed_nasa_power",
                        model_source="NASA POWER Observed Record",
                        last_observed_date=pred_date_str
                    ))
                else:
                    district_items.append(GeospatialDistrictPrediction(
                        district=d_id,
                        district_display_name=meta["name"],
                        latitude=meta["latitude"],
                        longitude=meta["longitude"],
                        elevation_m=meta["elevation_m"],
                        region=meta["region"],
                        grid_note=meta.get("note"),
                        status="unavailable",
                        data_quality_status="no_observation",
                        model_source="none",
                        last_observed_date=climate_service.date_max
                    ))

            return GeospatialPredictionResponse(
                success=True,
                prediction_date=pred_date_str,
                input_reference_date=pred_date_str,
                prediction_type=prediction_type,
                data_status=data_status,
                is_climatological_estimate=is_climatological,
                latest_available_date=climate_service.date_max,
                data_gap_days=data_gap_days,
                available_districts=available_count,
                total_districts=len(DISTRICT_METADATA),
                disclaimer=disclaimer,
                generated_at=generated_at,
                districts=district_items
            )

        # Prediction Mode: Situation A / B (ML Prediction) vs Situation C (Stale Climatology) vs Unavailable
        if input_dt < min_allowed_input:
            for d_id in sorted(DISTRICT_METADATA.keys()):
                meta = DISTRICT_METADATA[d_id]
                district_items.append(GeospatialDistrictPrediction(
                    district=d_id,
                    district_display_name=meta["name"],
                    latitude=meta["latitude"],
                    longitude=meta["longitude"],
                    elevation_m=meta["elevation_m"],
                    region=meta["region"],
                    grid_note=meta.get("note"),
                    status="unavailable",
                    data_quality_status="insufficient_lag_history",
                    model_source="none"
                ))
            return GeospatialPredictionResponse(
                success=True,
                prediction_date=pred_date_str,
                input_reference_date=input_date_str,
                prediction_type="unavailable",
                data_status="insufficient_lag_history",
                is_climatological_estimate=False,
                latest_available_date=climate_service.date_max,
                data_gap_days=0,
                available_districts=0,
                total_districts=len(DISTRICT_METADATA),
                disclaimer=f"Prediction date {pred_date_str} requires prior reference observations back to {min_allowed_input.isoformat()} (14-day lag window unavailable before 2001-01-16).",
                generated_at=generated_at,
                districts=district_items
            )

        if input_dt <= dataset_max:
            # Situations A & B: Genuine ML prediction from observed historical lags <= input_dt
            is_climatological = False
            prediction_type = "ml_prediction"
            is_latest = input_dt == dataset_max
            data_status = "latest_observation_forecast" if is_latest else "historical_observation_available"
            data_quality = "fresh_for_model_forecast" if is_latest else "valid"
            data_gap_days = 0
            disclaimer = (
                f"1-day forward ML forecast for {pred_date_str} generated from latest NASA POWER observations ({input_date_str}) using trained HistGradientBoosting models."
                if is_latest
                else f"Leakage-safe ML next-day forecast for {pred_date_str} generated strictly from prior observations ending {input_date_str}."
            )

            # Slice last 20 calendar days ending at input_date_str across all districts for fast feature lookup
            window_start_str = (input_dt - timedelta(days=20)).isoformat()
            sub_df = df[(df["date_str"] >= window_start_str) & (df["date_str"] <= input_date_str)].sort_values(["district", "date"])
            gt_slice = df[df["date_str"] == pred_date_str] if pred_dt <= dataset_max else pd.DataFrame()
            gt_by_district = {r["district"]: r for _, r in gt_slice.iterrows()} if not gt_slice.empty else {}

            for d_id in sorted(DISTRICT_METADATA.keys()):
                meta = DISTRICT_METADATA[d_id]
                d_rows = sub_df[sub_df["district"] == d_id]
                if d_rows.empty or d_rows["date"].max().date() != input_dt or len(d_rows) < 14:
                    district_items.append(GeospatialDistrictPrediction(
                        district=d_id,
                        district_display_name=meta["name"],
                        latitude=meta["latitude"],
                        longitude=meta["longitude"],
                        elevation_m=meta["elevation_m"],
                        region=meta["region"],
                        grid_note=meta.get("note"),
                        status="unavailable",
                        data_quality_status="unavailable_historical_gap",
                        model_source="none",
                        last_observed_date=d_rows["date"].max().date().isoformat() if not d_rows.empty else None
                    ))
                    continue

                preds: Dict[str, VariablePrediction] = {}
                for target in TARGET_VARIABLES:
                    preds[target] = self._predict_target_value(d_id, d_rows[target].values, target, pred_dt)

                t2m_val = preds["T2M"].value
                rain_pred = preds["PRECTOTCORR"]
                has_any = any(preds[k].value is not None for k in ["T2M", "RH2M", "PRECTOTCORR", "WS2M"])
                if has_any:
                    available_count += 1

                gt_dict = None
                gt_row = gt_by_district.get(d_id)
                if gt_row is not None:
                    gt_dict = {
                        k: round(float(gt_row[k]), 2) if pd.notna(gt_row[k]) else None
                        for k in ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "PRECTOTCORR", "WS2M"]
                    }

                district_items.append(GeospatialDistrictPrediction(
                    district=d_id,
                    district_display_name=meta["name"],
                    latitude=meta["latitude"],
                    longitude=meta["longitude"],
                    elevation_m=meta["elevation_m"],
                    region=meta["region"],
                    grid_note=meta.get("note"),
                    T2M=t2m_val,
                    T2M_MAX=preds["T2M_MAX"].value,
                    T2M_MIN=preds["T2M_MIN"].value,
                    RH2M=preds["RH2M"].value,
                    PRECTOTCORR=rain_pred.value,
                    WS2M=preds["WS2M"].value,
                    rainfall_probability=rain_pred.rainfall_probability,
                    rainfall_category=rain_pred.rainfall_category,
                    status="available" if has_any else "unavailable",
                    data_quality_status=data_quality,
                    model_source="Trained HistGradientBoosting Multi-Target Pipeline",
                    last_observed_date=input_date_str,
                    ground_truth=gt_dict
                ))

            return GeospatialPredictionResponse(
                success=True,
                prediction_date=pred_date_str,
                input_reference_date=input_date_str,
                prediction_type=prediction_type,
                data_status=data_status,
                is_climatological_estimate=is_climatological,
                latest_available_date=climate_service.date_max,
                data_gap_days=data_gap_days,
                available_districts=available_count,
                total_districts=len(DISTRICT_METADATA),
                disclaimer=disclaimer,
                generated_at=generated_at,
                districts=district_items
            )

        # Situation C: Stale source beyond 2025-12-31 -> Historical Same-Calendar-Day Climatology Estimate
        is_climatological = True
        prediction_type = "climatological_estimate"
        data_status = "stale_source_climatology_only"
        data_gap_days = (input_dt - dataset_max).days
        req_md = pred_dt.strftime("%m-%d")
        cal_df = df[df["month_day"] == req_md]
        disclaimer = (
            f"Requested forecast date {pred_date_str} exceeds the current NASA POWER source boundary ({climate_service.date_max}) by {data_gap_days} day(s). "
            "Fresh lag inputs are unavailable; displaying 25-year (2001–2025) same-calendar-day climatological normals instead of live ML forecasts."
        )

        for d_id in sorted(DISTRICT_METADATA.keys()):
            meta = DISTRICT_METADATA[d_id]
            d_cal = cal_df[cal_df["district"] == d_id]
            if d_cal.empty:
                district_items.append(GeospatialDistrictPrediction(
                    district=d_id,
                    district_display_name=meta["name"],
                    latitude=meta["latitude"],
                    longitude=meta["longitude"],
                    elevation_m=meta["elevation_m"],
                    region=meta["region"],
                    grid_note=meta.get("note"),
                    status="unavailable",
                    data_quality_status="stale_source_climatology_only",
                    model_source="none",
                    last_observed_date=climate_service.date_max
                ))
                continue

            vals = {}
            for k in ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "PRECTOTCORR", "WS2M"]:
                m = d_cal[k].mean()
                vals[k] = round(float(m), 2) if pd.notna(m) else None

            rain_val = vals["PRECTOTCORR"]
            has_any = any(vals[k] is not None for k in ["T2M", "RH2M", "PRECTOTCORR", "WS2M"])
            if has_any:
                available_count += 1

            district_items.append(GeospatialDistrictPrediction(
                district=d_id,
                district_display_name=meta["name"],
                latitude=meta["latitude"],
                longitude=meta["longitude"],
                elevation_m=meta["elevation_m"],
                region=meta["region"],
                grid_note=meta.get("note"),
                T2M=vals["T2M"],
                T2M_MAX=vals["T2M_MAX"],
                T2M_MIN=vals["T2M_MIN"],
                RH2M=vals["RH2M"],
                PRECTOTCORR=rain_val,
                WS2M=vals["WS2M"],
                rainfall_probability=None,
                rainfall_category=get_rainfall_category(rain_val) if rain_val is not None else None,
                status="climatological_estimate" if has_any else "unavailable",
                data_quality_status="stale_source_climatology_only",
                model_source="25-Year Climatological Day-of-Year Mean",
                last_observed_date=climate_service.date_max
            ))

        return GeospatialPredictionResponse(
            success=True,
            prediction_date=pred_date_str,
            input_reference_date=climate_service.date_max,
            prediction_type=prediction_type,
            data_status=data_status,
            is_climatological_estimate=is_climatological,
            latest_available_date=climate_service.date_max,
            data_gap_days=data_gap_days,
            available_districts=available_count,
            total_districts=len(DISTRICT_METADATA),
            disclaimer=disclaimer,
            generated_at=generated_at,
            districts=district_items
        )

prediction_service = PredictionService.get_instance()

