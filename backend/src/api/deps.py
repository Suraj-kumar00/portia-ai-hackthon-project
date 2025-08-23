"""FastAPI Dependencies - FIXED"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import structlog

from ..services.auth_service import AuthService
from ..config.database import get_database
from ..services.ticket_service import TicketService
from ..services.conversation_service import ConversationService
from ..services.analytics_service import AnalyticsService

logger = structlog.get_logger(__name__)
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Get current authenticated user (Optional for testing)"""
    
    if not credentials:
        logger.warning("No authentication provided - using test user")
        return {
            "id": "test_user_123",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User"
        }
    
    try:
        # For now, return test user (you can implement actual Clerk verification later)
        return {
            "id": "test_user_123",
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User"
        }
    except Exception as e:
        logger.error("Authentication failed", error=str(e))
        return {
            "id": "test_user_123",
            "email": "test@example.com", 
            "first_name": "Test",
            "last_name": "User"
        }
        
def get_ticket_service() -> TicketService:
    """Get ticket service instance - NO PRISMA DEPENDENCY"""
    return TicketService()

def get_conversation_service() -> ConversationService:
    """Get conversation service instance - NO PRISMA DEPENDENCY"""
    return ConversationService()

def get_analytics_service() -> AnalyticsService:
    """Get analytics service instance - NO PRISMA DEPENDENCY"""
    return AnalyticsService()

async def get_ai_agent(request: Request):
    """Get AI agent from app state"""
    return getattr(request.app.state, 'ai_agent', None)
