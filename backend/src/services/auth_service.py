"""Authentication service using Official Clerk Backend API"""
from typing import Dict, Any, Optional
import os
import structlog
from clerk_backend_api import Clerk  # CORRECTED IMPORT
from ..config.settings import settings

logger = structlog.get_logger(__name__)

class AuthService:
    """Official Clerk authentication integration service"""
    
    def __init__(self):
        self.clerk_secret_key = settings.clerk_secret_key
        # Initialize Official Clerk SDK
        self.clerk = Clerk(bearer_auth=self.clerk_secret_key)
        
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Clerk JWT token and return user data"""
        
        try:
            # Using official Clerk SDK method
            session = await self.clerk.sessions.verify_session_token_async(token)
            
            if session and session.user_id:
                # Get user details
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
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user details by Clerk user ID"""
        
        try:
            user = await self.clerk.users.get_async(user_id)
            
            return {
                "id": user.id,
                "email": user.email_addresses[0].email_address if user.email_addresses else None,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "created_at": user.created_at
            }
                
        except Exception as e:
            logger.error("User retrieval error", user_id=user_id, error=str(e))
            return None
    
    async def create_webhook_event(self, webhook_data: Dict[str, Any]) -> bool:
        """Process Clerk webhook events"""
        
        try:
            event_type = webhook_data.get("type")
            
            if event_type == "user.created":
                user_data = webhook_data.get("data")
                logger.info("New user created", user_id=user_data.get("id"))
                
            elif event_type == "user.updated":
                user_data = webhook_data.get("data")
                logger.info("User updated", user_id=user_data.get("id"))
                
            elif event_type == "session.created":
                session_data = webhook_data.get("data")
                logger.info("New session created", user_id=session_data.get("user_id"))
            
            return True
            
        except Exception as e:
            logger.error("Webhook processing error", error=str(e))
            return False

def get_current_user():
    """Dependency function for FastAPI"""
    return AuthService()
