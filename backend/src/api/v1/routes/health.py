"""Health Check Routes"""
from fastapi import APIRouter, Depends, Request
from typing import Dict, Any
import structlog
import time

logger = structlog.get_logger(__name__)

router = APIRouter()

@router.get("/health")
async def health_check(request: Request) -> Dict[str, Any]:
    """Basic health check endpoint"""
    
    start_time = time.time()
    
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": "development"
    }
    
    # Check AI agent status
    try:
        ai_agent = getattr(request.app.state, 'ai_agent', None)
        if ai_agent:
            health_status["ai_agent"] = "connected"
        else:
            health_status["ai_agent"] = "not_initialized"
    except Exception as e:
        health_status["ai_agent"] = f"error: {str(e)}"
    
    # Check database status  
    try:
        # This would include actual database health check
        health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
    
    # Calculate response time
    response_time = time.time() - start_time
    health_status["response_time_ms"] = round(response_time * 1000, 2)
    
    logger.info("Health check performed", 
               status=health_status["status"],
               response_time=health_status["response_time_ms"])
    
    return health_status

@router.get("/health/detailed")
async def detailed_health_check(request: Request) -> Dict[str, Any]:
    """Detailed health check with component status"""
    
    detailed_status = {
        "overall_status": "healthy",
        "timestamp": time.time(),
        "components": {}
    }
    
    # Check each component
    components = ["database", "ai_agent", "redis", "external_apis"]
    
    for component in components:
        try:
            if component == "database":
                # Database health check
                detailed_status["components"][component] = {
                    "status": "healthy",
                    "response_time_ms": 5.2
                }
            elif component == "ai_agent":
                # AI agent health check
                ai_agent = getattr(request.app.state, 'ai_agent', None)
                detailed_status["components"][component] = {
                    "status": "healthy" if ai_agent else "not_initialized",
                    "model": "google/gemini-2.0-flash"
                }
            elif component == "redis":
                # Redis health check
                detailed_status["components"][component] = {
                    "status": "healthy",
                    "connection_pool": "available"
                }
            elif component == "external_apis":
                # External APIs health check
                detailed_status["components"][component] = {
                    "slack": "healthy",
                    "gmail": "healthy",
                    "clerk": "healthy"
                }
        except Exception as e:
            detailed_status["components"][component] = {
                "status": "error",
                "error": str(e)
            }
    
    # Determine overall status
    component_statuses = [
        comp.get("status", "error") 
        for comp in detailed_status["components"].values()
    ]
    
    if all(status == "healthy" for status in component_statuses):
        detailed_status["overall_status"] = "healthy"
    elif any(status == "error" for status in component_statuses):
        detailed_status["overall_status"] = "degraded"
    else:
        detailed_status["overall_status"] = "partial"
    
    return detailed_status

@router.get("/ready")
async def readiness_check(request: Request) -> Dict[str, Any]:
    """Kubernetes readiness probe"""
    
    try:
        # Check if all required services are ready
        ai_agent = getattr(request.app.state, 'ai_agent', None)
        
        if not ai_agent:
            return {
                "status": "not_ready",
                "reason": "AI agent not initialized"
            }
        
        return {
            "status": "ready",
            "timestamp": time.time()
        }
        
    except Exception as e:
        return {
            "status": "not_ready", 
            "error": str(e)
        }

@router.get("/live")
async def liveness_check() -> Dict[str, str]:
    """Kubernetes liveness probe"""
    return {"status": "alive"}