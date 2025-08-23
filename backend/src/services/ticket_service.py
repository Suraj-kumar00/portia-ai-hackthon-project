"""Ticket Service with Real Prisma Integration"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import structlog

from ..config.database import get_prisma

logger = structlog.get_logger(__name__)

class TicketService:
    """Service for managing customer support tickets with Prisma"""
    
    def __init__(self):
        pass  # No Prisma in constructor - use get_prisma() in methods
    
    async def create_or_update_ticket(
        self,
        customer_email: str,
        subject: str,
        query: str,
        source: str = "api",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create new ticket using Prisma"""
        
        try:
            prisma = get_prisma()
            
            # Check if customer exists, create if not
            customer = await prisma.customer.find_unique(
                where={"email": customer_email}
            )
            
            if not customer:
                customer = await prisma.customer.create(
                    data={
                        "email": customer_email,
                        "name": metadata.get("name") if metadata else None
                    }
                )
            
            # Create new ticket
            ticket = await prisma.ticket.create(
                data={
                    "subject": subject,
                    "customer_id": customer.id,
                    "source": source,
                    "status": "OPEN",
                    "priority": "MEDIUM"
                }
            )
            
            # Create initial conversation entry
            await prisma.conversation.create(
                data={
                    "ticket_id": ticket.id,
                    "customer_id": customer.id,
                    "content": query,
                    "role": "CUSTOMER"
                }
            )
            
            logger.info("✅ Ticket created with Prisma", ticket_id=ticket.id)
            
            # Convert to dict for response
            return {
                "id": ticket.id,
                "subject": ticket.subject,
                "status": ticket.status,
                "priority": ticket.priority,
                "customer_email": customer.email,
                "created_at": ticket.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error("❌ Ticket creation failed", error=str(e))
            raise
    
    async def get_ticket_by_id(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Get ticket by ID using Prisma"""
        
        try:
            prisma = get_prisma()
            
            ticket = await prisma.ticket.find_unique(
                where={"id": ticket_id},
                include={
                    "customer": True,
                    "conversations": True,
                    "approvals": True
                }
            )
            
            if not ticket:
                return None
            
            return {
                "id": ticket.id,
                "subject": ticket.subject,
                "status": ticket.status,
                "priority": ticket.priority,
                "customer": {
                    "email": ticket.customer.email,
                    "name": ticket.customer.name
                },
                "conversations": [
                    {
                        "id": conv.id,
                        "content": conv.content,
                        "role": conv.role,
                        "created_at": conv.created_at.isoformat()
                    }
                    for conv in ticket.conversations
                ],
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat()
            }
            
        except Exception as e:
            logger.error("❌ Ticket retrieval failed", error=str(e))
            raise
