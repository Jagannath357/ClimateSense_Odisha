from fastapi import APIRouter
from backend.app.api.endpoints import health, dataset, predictions, climate, models, dashboard

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(dataset.router, tags=["Dataset"])
api_router.include_router(predictions.router, tags=["Predictions"])
api_router.include_router(climate.router, tags=["Climate"])
api_router.include_router(models.router, tags=["Models"])
api_router.include_router(dashboard.router, tags=["Dashboard"])

