"""Database model helpers"""
from prisma import Prisma
from typing import Dict, Any, List, Optional
import structlog

logger = structlog.get_logger(__name__)

class DatabaseModels:
    def __init__(self, db: Prisma):
        self.db = db

    async def get_ticket_with_relations(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        try:
            ticket = await self.db.ticket.find_unique(
                where={"id": ticket_id},
                include={
                    "customer": True,
                    "conversations": {"order": {"created_at": "asc"}},
                    "approvals": {"order": {"created_at": "desc"}},
                }
            )
            if not ticket:
                return None
            return {
                "ticket": ticket,
                "customer": ticket.customer,
                "conversations": ticket.conversations,
                "approvals": ticket.approvals
            }
        except Exception as e:
            logger.error("Ticket retrieval with relations failed", error=str(e))
            raise