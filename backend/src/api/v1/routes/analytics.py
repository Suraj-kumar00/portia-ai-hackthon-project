from fastapi import APIRouter, HTTPException
import structlog
from ....services.analytics_service import AnalyticsService

router = APIRouter()
logger = structlog.get_logger(__name__)
svc = AnalyticsService()

@router.get("/dashboard", response_model=None)
async def get_dashboard_metrics():
    try:
        return await svc.get_dashboard_metrics()
    except Exception as e:
        logger.error("Dashboard metrics error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load dashboard metrics")

@router.get("/ai-performance", response_model=None)
async def get_ai_performance_metrics():
    try:
        return await svc.get_ai_performance_metrics()
    except Exception as e:
        logger.error("AI performance metrics error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load AI performance metrics")
