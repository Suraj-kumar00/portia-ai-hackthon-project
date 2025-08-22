"""Analytics and Metrics Routes"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import structlog

from ....models.schemas import (
    AnalyticsResponse,
    MetricsResponse,
    PerformanceReport
)
from ....services.analytics_service import AnalyticsService
from ....services.auth_service import get_current_user

router = APIRouter()
logger = structlog.get_logger(__name__)

@router.get("/dashboard", response_model=AnalyticsResponse)
async def get_dashboard_metrics(
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """Get main dashboard metrics"""
    
    try:
        metrics = await analytics_service.get_dashboard_metrics()
        
        logger.info("Dashboard metrics retrieved", 
                   user_id=current_user.get("id"))
        
        return metrics
        
    except Exception as e:
        logger.error("Dashboard metrics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard metrics")

@router.get("/performance", response_model=PerformanceReport)
async def get_performance_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """Get performance report for specified date range"""
    
    try:
        # Parse dates or use defaults
        if start_date:
            start = datetime.fromisoformat(start_date)
        else:
            start = datetime.now() - timedelta(days=30)
        
        if end_date:
            end = datetime.fromisoformat(end_date)
        else:
            end = datetime.now()
        
        report = await analytics_service.get_performance_report(start, end)
        
        logger.info("Performance report generated", 
                   start_date=start.isoformat(),
                   end_date=end.isoformat(),
                   user_id=current_user.get("id"))
        
        return report
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error("Performance report generation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate performance report")

@router.get("/metrics/real-time", response_model=MetricsResponse)
async def get_real_time_metrics(
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """Get real-time system metrics"""
    
    try:
        metrics = await analytics_service.get_real_time_metrics()
        
        return metrics
        
    except Exception as e:
        logger.error("Real-time metrics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve real-time metrics")

@router.get("/trends/resolution-time")
async def get_resolution_time_trends(
    days: int = Query(30, description="Number of days to analyze"),
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """Get resolution time trends"""
    
    try:
        trends = await analytics_service.get_resolution_time_trends(days)
        
        logger.info("Resolution time trends retrieved", 
                   days=days,
                   user_id=current_user.get("id"))
        
        return trends
        
    except Exception as e:
        logger.error("Resolution time trends retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve resolution time trends")

@router.get("/ai-performance")
async def get_ai_performance_metrics(
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """Get AI agent performance metrics"""
    
    try:
        ai_metrics = await analytics_service.get_ai_performance_metrics()
        
        logger.info("AI performance metrics retrieved", 
                   user_id=current_user.get("id"))
        
        return ai_metrics
        
    except Exception as e:
        logger.error("AI performance metrics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve AI performance metrics")

@router.get("/customer-satisfaction")
async def get_customer_satisfaction_metrics(
    period: str = Query("month", description="Time period: week, month, quarter"),
    current_user = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends()
):
    """Get customer satisfaction metrics"""
    
    try:
        satisfaction_metrics = await analytics_service.get_satisfaction_metrics(period)
        
        logger.info("Customer satisfaction metrics retrieved", 
                   period=period,
                   user_id=current_user.get("id"))
        
        return satisfaction_metrics
        
    except Exception as e:
        logger.error("Customer satisfaction metrics retrieval failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve satisfaction metrics")