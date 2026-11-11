from fastapi import APIRouter
from backend.app.core.constants import TARGET_VARIABLES
from backend.app.services.model_service import model_service

router = APIRouter()

@router.get("/models", summary="List All Trained Machine Learning Models & Metadata")
def get_models():
    all_metadata = model_service.get_all_metadata()
    result = []
    for target, meta in all_metadata.items():
        var_info = TARGET_VARIABLES.get(target, {})
        result.append({
            "target": target,
            "display_name": var_info.get("display_name", target),
            "unit": meta.get("unit", ""),
            "model_type": meta.get("model_type", ""),
            "feature_columns": meta.get("feature_columns", []),
            "model_parameters": meta.get("model_parameters", {}),
            "train": meta.get("train", {}),
            "validation": meta.get("validation", {}),
            "test": meta.get("test", {}),
            "model_version": meta.get("model_version", "1.0.0"),
            "created_at": meta.get("created_at")
        })
    return {
        "total_models": len(result),
        "models": result
    }

@router.get("/models/performance", summary="Model Evaluation Metrics, Baselines & District Breakdown")
def get_model_performance():
    metrics_list = []
    for item in model_service.multi_target_metrics:
        target = item["target"]
        var_info = TARGET_VARIABLES.get(target, {})
        entry = {
            "target": target,
            "display_name": var_info.get("display_name", target),
            "stage": item["stage"],
            "unit": item["unit"],
            "rows": item["rows"],
            "MAE": round(float(item["MAE"]), 4),
            "RMSE": round(float(item["RMSE"]), 4),
            "R2": round(float(item["R2"]), 4) if "R2" in item and item["R2"] is not None else None,
        }
        if "rain_occurrence_accuracy" in item:
            entry.update({
                "rain_occurrence_accuracy": round(float(item["rain_occurrence_accuracy"]), 4),
                "rain_occurrence_precision": round(float(item["rain_occurrence_precision"]), 4),
                "rain_occurrence_recall": round(float(item["rain_occurrence_recall"]), 4),
                "rain_occurrence_f1": round(float(item["rain_occurrence_f1"]), 4),
                "rain_occurrence_roc_auc": round(float(item["rain_occurrence_roc_auc"]), 4) if "rain_occurrence_roc_auc" in item else None,
            })
        metrics_list.append(entry)

    baseline_data = {
        "target": "T2M",
        "model_name": "Baseline HistGradientBoostingRegressor (Contemporaneous Physical Model)",
        "scientific_role": "Diagnostic baseline demonstrating same-day covariation among meteorological variables (MAE 0.1899 °C, R² 0.9972); cannot be used for forward forecasting without contemporaneous inputs.",
        "test_metrics": model_service.final_test_metrics,
        "validation_metrics": model_service.baseline_metrics.get("metrics", {}).get("validation", {})
    }

    metrics_explanation = {
        "MAE": "Mean Absolute Error: The average magnitude of absolute prediction errors in target units. Less sensitive to extreme outliers than RMSE.",
        "RMSE": "Root Mean Squared Error: Gives higher penalty to large forecast errors, essential for meteorological extremes.",
        "R2": "Coefficient of Determination: Proportion of variance in the climate variable explained by the model features.",
        "F1": "Harmonic mean of precision and recall for rain occurrence, balancing false alarms against missed rain events in zero-inflated distributions.",
        "ROC_AUC": "Area Under ROC Curve: Discrimination ability of the rainfall occurrence classifier across all decision thresholds."
    }

    limitations = [
        "Historical evaluation metrics reflect test performance from April 2022 to December 2025 and do not guarantee future operational accuracy.",
        "NASA POWER dataset coverage ends on 2025-12-31; forecasting dates beyond requires live meteorological inputs.",
        "Precipitation in tropical Odisha exhibits severe zero-inflation (39.4% dry days); while the hurdle architecture improves over standard MSE, localized convective flash events remain inherently uncertain with daily lag data.",
        "Statistical climate anomalies indicate unusual deviations from historical climatology and do not automatically denote civil disasters."
    ]

    return {
        "multi_target_models": metrics_list,
        "baseline_model": baseline_data,
        "district_test_breakdown": model_service.district_test_metrics,
        "metrics_explanation": metrics_explanation,
        "limitations": limitations
    }

