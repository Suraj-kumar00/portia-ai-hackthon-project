"""Email Tool for Portia AI - Gmail integration"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import structlog
from portia import Tool

logger = structlog.get_logger(__name__)

class EmailSendInput(BaseModel):
    to_email: str = Field(description="Recipient email address")
    subject: str = Field(description="Email subject")
    body: str = Field(description="Email body content")
    cc: Optional[List[str]] = Field(default=None, description="CC recipients")
    bcc: Optional[List[str]] = Field(default=None, description="BCC recipients")

class EmailSearchInput(BaseModel):
    query: str = Field(description="Search query for emails")
    max_results: int = Field(default=10, description="Maximum number of results")
    from_email: Optional[str] = Field(default=None, description="Filter by sender")

class EmailTool(Tool):
    """Custom Portia tool for email operations"""
    
    name = "email_tool"
    description = "Send and search emails using Gmail integration"
    
    def __init__(self):
        super().__init__()
        logger.info("EmailTool initialized")
    
    async def send_email(self, input_data: EmailSendInput) -> Dict[str, Any]:
        """Send email via Gmail API"""
        
        try:
            # This would integrate with actual Gmail API
            # For demo purposes, we'll simulate email sending
            
            email_data = {
                "id": f"email_{hash(input_data.to_email)}",
                "to": input_data.to_email,
                "subject": input_data.subject,
                "body": input_data.body,
                "status": "sent",
                "sent_at": "2025-08-23T10:00:00Z"
            }
            
            logger.info("Email sent", 
                       to=input_data.to_email, 
                       subject=input_data.subject)
            
            return {
                "success": True,
                "email": email_data,
                "message": f"Email sent to {input_data.to_email}"
            }
            
        except Exception as e:
            logger.error("Email sending failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send email"
            }
    
    async def search_emails(self, input_data: EmailSearchInput) -> Dict[str, Any]:
        """Search emails in Gmail"""
        
        try:
            # Simulate email search results
            emails = [
                {
                    "id": "email_123",
                    "from": input_data.from_email or "customer@example.com",
                    "subject": f"RE: {input_data.query}",
                    "snippet": f"Email about {input_data.query}...",
                    "received_at": "2025-08-23T09:00:00Z"
                }
            ]
            
            logger.info("Emails searched", 
                       query=input_data.query, 
                       results=len(emails))
            
            return {
                "success": True,
                "emails": emails,
                "total_count": len(emails),
                "message": f"Found {len(emails)} emails"
            }
            
        except Exception as e:
            logger.error("Email search failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to search emails"
            }
    
    async def call(self, action: str, **kwargs) -> Dict[str, Any]:
        """Main tool entry point"""
        
        if action == "send":
            input_data = EmailSendInput(**kwargs)
            return await self.send_email(input_data)
            
        elif action == "search":
            input_data = EmailSearchInput(**kwargs)
            return await self.search_emails(input_data)
            
        else:
            return {
                "success": False,
                "error": f"Unknown action: {action}",
                "message": "Supported actions: send, search"
            }