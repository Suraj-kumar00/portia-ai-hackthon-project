from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import structlog

router = APIRouter()
logger = structlog.get_logger(__name__)

async def get_current_user():
    return {"id": "user_123", "email": "demo@example.com", "name": "Demo User"}

@router.get("/", response_model=None)
async def list_conversations(
    ticket_id: Optional[str] = Query(None),
    customer_email: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    current_user = Depends(get_current_user),
):
    try:
        conversations = [
            {
                "id": "conv_123",
                "ticket_id": ticket_id or "ticket_123",
                "customer_id": "customer_456",
                "content": "Hello, I need help with my order #12345",
                "role": "CUSTOMER",
                "metadata": {"source": "email"},
                "created_at": "2025-08-23T01:18:00Z"
            },
            {
                "id": "conv_124",
                "ticket_id": ticket_id or "ticket_123",
                "customer_id": "customer_456",
                "content": "I understand your concern. Let me check order #12345 for you.",
                "role": "AI_AGENT",
                "metadata": {"plan_id": "portia_plan_789","confidence_score": 0.95, "model": "gemini-2.0-flash"},
                "created_at": "2025-08-23T01:18:30Z"
            }
        ]
        return conversations[offset:offset+limit]
    except Exception as e:
        logger.error("Conversation listing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list conversations")
