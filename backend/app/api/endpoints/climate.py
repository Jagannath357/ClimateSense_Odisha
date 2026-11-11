from typing import Optional, Annotated
from fastapi import APIRouter, HTTPException, Query
from backend.app.services.climate_service import climate_service

router = APIRouter()

@router.get("/climate/historical", summary="Query Daily Historical Climate Observations")
def get_historical_climate(
    district: Annotated[str, Query(description="District identifier (e.g. 'cuttack', 'puri')")],
    start_date: Annotated[Optional[str], Query(description="Start date in YYYY-MM-DD format")] = None,
    end_date: Annotated[Optional[str], Query(description="End date in YYYY-MM-DD format")] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=1000, description="Records per page")] = 100
):
    try:
        s_date = start_date if isinstance(start_date, str) else None
        e_date = end_date if isinstance(end_date, str) else None
        return climate_service.get_historical_records(
            district=district,
            start_date=s_date,
            end_date=e_date,
            page=page if isinstance(page, int) else 1,
            page_size=page_size if isinstance(page_size, int) else 100
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/climate/aggregated", summary="Monthly or Annual Aggregated Climate Time Series")
def get_aggregated_climate(
    district: Annotated[str, Query(description="District identifier")],
    aggregation_type: Annotated[str, Query(description="'monthly' or 'annual'")] = "monthly"
):
    try:
        agg_type = aggregation_type if isinstance(aggregation_type, str) else "monthly"
        return climate_service.get_aggregated_data(district=district, aggregation_type=agg_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/climate/summary", summary="Descriptive Statistical Summary for District")
def get_climate_summary(
    district: Annotated[str, Query(description="District identifier")],
    start_date: Annotated[Optional[str], Query(description="Start date YYYY-MM-DD")] = None,
    end_date: Annotated[Optional[str], Query(description="End date YYYY-MM-DD")] = None
):
    try:
        s_date = start_date if isinstance(start_date, str) else None
        e_date = end_date if isinstance(end_date, str) else None
        return climate_service.get_climate_summary(district=district, start_date=s_date, end_date=e_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/climate/trends", summary="Statistical Climate Trends (Theil–Sen Slope & Kendall Tau)")
def get_climate_trends(
    district: Annotated[Optional[str], Query(description="Filter by district")] = None,
    variable: Annotated[Optional[str], Query(description="Filter by variable (e.g. 'T2M', 'PRECTOTCORR')")] = None
):
    try:
        dist = district if isinstance(district, str) else None
        var = variable if isinstance(variable, str) else None
        return climate_service.get_trends(district=dist, variable=var)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/climate/anomalies", summary="Climate Anomalies vs Baseline & Climatological Extremes")
def get_climate_anomalies(
    district: Annotated[Optional[str], Query(description="Filter by district")] = None
):
    try:
        dist = district if isinstance(district, str) else None
        return climate_service.get_anomalies(district=dist)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
