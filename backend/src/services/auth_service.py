"""Authentication service (Clerk) - placeholder-ready"""
from typing import Dict, Any, Optional
import structlog
from clerk_backend_api import Clerk
from ..config.settings import settings

logger = structlog.get_logger(__name__)

class AuthService:
    def __init__(self):
        self.clerk = Clerk(bearer_auth=settings.clerk_secret_key)

    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            session = await self.clerk.sessions.verify_session_token_async(token)
            if session and session.user_id:
                user = await self.clerk.users.get_async(session.user_id)
                return {
                    "id": user.id,
                    "email": user.email_addresses[0].email_address if user.email_addresses else None,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "created_at": user.created_at,
                    "session_id": session.id
                }
            return None
        except Exception as e:
            logger.error("Token verification error", error=str(e))
            return None