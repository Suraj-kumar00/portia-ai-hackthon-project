"""Conversation service"""
from typing import Dict, Any, List, Optional
import structlog
from ..config.database import get_prisma

logger = structlog.get_logger(__name__)

class ConversationService:
    def __init__(self):
        pass

    async def create_conversation(self, ticket_id: str, customer_id: str, content: str, role: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        prisma = get_prisma()
        conv = await prisma.conversation.create(
            data={"ticket_id": ticket_id, "customer_id": customer_id, "content": content, "role": role.upper(), "metadata": metadata}
        )
        return {
            "id": conv.id,
            "ticket_id": conv.ticket_id,
            "customer_id": conv.customer_id,
            "content": conv.content,
            "role": conv.role,
            "metadata": conv.metadata,
            "created_at": conv.created_at.isoformat()
        }