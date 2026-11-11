from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    GeospatialPredictionResponse,
)
from backend.app.services.prediction_service import prediction_service

router = APIRouter()


@router.get(
    "/predictions/geospatial",
    response_model=GeospatialPredictionResponse,
    summary="Geospatial District-Wise Predictions / Observations for All 15 Odisha Districts",
)
def get_geospatial_predictions(
    prediction_date: Annotated[
        Optional[str],
        Query(
            description="Target date in YYYY-MM-DD format (defaults to latest available ML forecast date)"
        ),
    ] = None,
    mode: Annotated[
        str,
        Query(description="Data mode: 'prediction' (ML pipeline) or 'observation' (historical records)"),
    ] = "prediction",
):
    pred_date = prediction_date if isinstance(prediction_date, str) else None
    data_mode = mode if isinstance(mode, str) else "prediction"
    try:
        return prediction_service.predict_geospatial_all_districts(
            prediction_date=pred_date, mode=data_mode
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Geospatial prediction pipeline error: {str(e)}"
        )


@router.post("/predictions/next-day", response_model=PredictionResponse, summary="Next-Day Weather Prediction for Selected District & Date")
def predict_next_day(request: PredictionRequest):
    try:
        return prediction_service.predict_next_day(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction pipeline error: {str(e)}")

@router.get("/predictions/history", summary="Recent Prediction Log & Query History")
def get_prediction_history(
    limit: Annotated[int, Query(ge=1, le=100, description="Max history records")] = 20
):
    lim = limit if isinstance(limit, int) else 20
    records = prediction_service.get_history(limit=lim)
    return {
        "total": len(records),
        "limit": lim,
        "history": records
    }
