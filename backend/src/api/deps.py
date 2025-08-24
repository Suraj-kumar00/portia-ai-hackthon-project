"""FastAPI Dependencies"""
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
import structlog

logger = structlog.get_logger(__name__)
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    # For MVP, return test user even if no auth
    return {
        "id": "test_user_123",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User"
    }

async def get_ai_agent(request: Request):
    return getattr(request.app.state, 'ai_agent', None)