"""Health Check Routes - SIMPLE VERSION"""
from fastapi import APIRouter
import time

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check"""
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "ai_agent": "connected"
    }