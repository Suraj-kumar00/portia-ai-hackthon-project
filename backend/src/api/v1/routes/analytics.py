"""Analytics Routes - FIXED VERSION"""
from fastapi import APIRouter, HTTPException, Depends
import structlog

router = APIRouter()
logger = structlog.get_logger(__name__)

async def get_current_user():
    return {"id": "user_123", "email": "demo@example.com"}

@router.get("/dashboard", response_model=None)
async def get_dashboard_metrics(current_user = Depends(get_current_user)):
    """Dashboard metrics - DEMO VERSION"""
    
    return {
        "total_tickets": 1247,
        "tickets_today": 23,
        "open_tickets": 45,
        "ai_resolved_tickets": 934,
        "avg_response_time_minutes": 2.3,
        "customer_satisfaction": 4.6,
        "ai_automation_rate": 75.2
    }

@router.get("/ai-performance", response_model=None)
async def get_ai_performance_metrics(current_user = Depends(get_current_user)):
    """AI performance - DEMO VERSION"""
    
    return {
        "queries_processed_today": 89,
        "avg_confidence_score": 0.94,
        "successful_resolutions": 67,
        "gemini_model_performance": {
            "model": "gemini-2.0-flash",
            "uptime": "99.7%",
            "avg_response_time_ms": 847
        }
    }