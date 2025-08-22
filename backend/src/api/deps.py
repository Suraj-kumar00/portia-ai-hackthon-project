"""FastAPI Dependencies"""
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
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends()
) -> Dict[str, Any]:
    """Get current authenticated user from Clerk"""
    
    try:
        user = await auth_service.verify_token(credentials.credentials)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user
    except Exception as e:
        logger.error("Authentication failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def get_auth_service() -> AuthService:
    """Get auth service instance"""
    return AuthService()

async def get_ticket_service(
    db = Depends(get_database)
) -> TicketService:
    """Get ticket service instance"""
    return TicketService(db)

async def get_conversation_service(
    db = Depends(get_database)
) -> ConversationService:
    """Get conversation service instance"""
    return ConversationService(db)

async def get_analytics_service(
    db = Depends(get_database)
) -> AnalyticsService:
    """Get analytics service instance"""
    return AnalyticsService(db)

async def get_ai_agent(request: Request):
    """Get AI agent from app state"""
    return request.app.state.ai_agent

# Optional user dependency (doesn't require auth)
async def get_optional_user(
    request: Request,
    auth_service: AuthService = Depends()
) -> Optional[Dict[str, Any]]:
    """Get user if authenticated, otherwise None"""
    
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        user = await auth_service.verify_token(token)
        return user
    except:
        return None