"""Authentication service using Clerk"""
from typing import Dict, Any, Optional
import httpx
import structlog
from ..config.settings import settings

logger = structlog.get_logger(__name__)

class AuthService:
    """Clerk authentication integration service"""
    
    def __init__(self):
        self.clerk_secret_key = settings.clerk_secret_key
        self.base_url = "https://api.clerk.com/v1"
        
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Clerk JWT token and return user data"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/sessions/{token}/verify",
                    headers={
                        "Authorization": f"Bearer {self.clerk_secret_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    session_data = response.json()
                    
                    # Get user details
                    user_response = await client.get(
                        f"{self.base_url}/users/{session_data['user_id']}",
                        headers={
                            "Authorization": f"Bearer {self.clerk_secret_key}",
                            "Content-Type": "application/json"
                        }
                    )
                    
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        
                        return {
                            "id": user_data["id"],
                            "email": user_data["email_addresses"][0]["email_address"],
                            "first_name": user_data["first_name"],
                            "last_name": user_data["last_name"],
                            "created_at": user_data["created_at"],
                            "session_id": session_data["id"]
                        }
                
                logger.warning("Token verification failed", 
                             status_code=response.status_code)
                return None
                
        except Exception as e:
            logger.error("Token verification error", error=str(e))
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user details by Clerk user ID"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/users/{user_id}",
                    headers={
                        "Authorization": f"Bearer {self.clerk_secret_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    return {
                        "id": user_data["id"],
                        "email": user_data["email_addresses"][0]["email_address"],
                        "first_name": user_data["first_name"],
                        "last_name": user_data["last_name"],
                        "created_at": user_data["created_at"]
                    }
                
                return None
                
        except Exception as e:
            logger.error("User retrieval error", user_id=user_id, error=str(e))
            return None
    
    async def create_webhook_event(self, webhook_data: Dict[str, Any]) -> bool:
        """Process Clerk webhook events"""
        
        try:
            event_type = webhook_data.get("type")
            
            if event_type == "user.created":
                # Handle new user creation
                user_data = webhook_data.get("data")
                logger.info("New user created", user_id=user_data.get("id"))
                
            elif event_type == "user.updated":
                # Handle user updates
                user_data = webhook_data.get("data")
                logger.info("User updated", user_id=user_data.get("id"))
                
            elif event_type == "session.created":
                # Handle new session
                session_data = webhook_data.get("data")
                logger.info("New session created", user_id=session_data.get("user_id"))
            
            return True
            
        except Exception as e:
            logger.error("Webhook processing error", error=str(e))
            return False

def get_current_user():
    """Dependency function for FastAPI"""
    return AuthService()
