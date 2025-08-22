"""Slack Tool for Portia AI"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import structlog
from portia import Tool

logger = structlog.get_logger(__name__)

class SlackMessageInput(BaseModel):
    channel: str = Field(description="Slack channel ID or name")
    text: str = Field(description="Message text")
    blocks: Optional[List[Dict]] = Field(default=None, description="Slack blocks for rich formatting")
    thread_ts: Optional[str] = Field(default=None, description="Thread timestamp for replies")

class SlackNotificationInput(BaseModel):
    user_id: str = Field(description="User ID to notify")
    message: str = Field(description="Notification message")
    urgency: str = Field(default="normal", description="Urgency level: low, normal, high, urgent")

class SlackTool(Tool):
    """Custom Portia tool for Slack operations"""
    
    name = "slack_tool"
    description = "Send messages and notifications via Slack"
    
    def __init__(self):
        super().__init__()
        logger.info("SlackTool initialized")
    
    async def send_message(self, input_data: SlackMessageInput) -> Dict[str, Any]:
        """Send message to Slack channel"""
        
        try:
            # This would integrate with actual Slack API
            # For demo purposes, we'll simulate message sending
            
            message_data = {
                "ts": "1692723600.123456",
                "channel": input_data.channel,
                "text": input_data.text,
                "user": "bot_user_id",
                "sent_at": "2025-08-23T10:00:00Z"
            }
            
            logger.info("Slack message sent", 
                       channel=input_data.channel, 
                       text_length=len(input_data.text))
            
            return {
                "success": True,
                "message": message_data,
                "slack_response": f"Message sent to {input_data.channel}"
            }
            
        except Exception as e:
            logger.error("Slack message sending failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send Slack message"
            }
    
    async def send_notification(self, input_data: SlackNotificationInput) -> Dict[str, Any]:
        """Send direct notification to user"""
        
        try:
            # Format message based on urgency
            urgency_emoji = {
                "low": "ℹ️",
                "normal": "📢", 
                "high": "⚠️",
                "urgent": "🚨"
            }
            
            formatted_message = f"{urgency_emoji.get(input_data.urgency, '📢')} {input_data.message}"
            
            notification_data = {
                "user_id": input_data.user_id,
                "message": formatted_message,
                "urgency": input_data.urgency,
                "sent_at": "2025-08-23T10:00:00Z"
            }
            
            logger.info("Slack notification sent", 
                       user_id=input_data.user_id, 
                       urgency=input_data.urgency)
            
            return {
                "success": True,
                "notification": notification_data,
                "message": f"Notification sent to user {input_data.user_id}"
            }
            
        except Exception as e:
            logger.error("Slack notification failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send Slack notification"
            }
    
    async def call(self, action: str, **kwargs) -> Dict[str, Any]:
        """Main tool entry point"""
        
        if action == "send_message":
            input_data = SlackMessageInput(**kwargs)
            return await self.send_message(input_data)
            
        elif action == "send_notification":
            input_data = SlackNotificationInput(**kwargs)
            return await self.send_notification(input_data)
            
        else:
            return {
                "success": False,
                "error": f"Unknown action: {action}",
                "message": "Supported actions: send_message, send_notification"
            }