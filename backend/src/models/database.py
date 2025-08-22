"""Database model utilities and helpers"""
from prisma import Prisma
from typing import Dict, Any, List, Optional
import structlog

logger = structlog.get_logger(__name__)

class DatabaseModels:
    """Helper class for database model operations"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_customer_if_not_exists(self, email: str, **kwargs) -> Dict[str, Any]:
        """Create customer if doesn't exist, otherwise return existing"""
        
        try:
            customer = await self.db.customer.find_unique(
                where={"email": email}
            )
            
            if customer:
                return {
                    "id": customer.id,
                    "email": customer.email,
                    "name": customer.name,
                    "created": False
                }
            
            customer = await self.db.customer.create(
                data={
                    "email": email,
                    "name": kwargs.get("name"),
                    "phone": kwargs.get("phone"),
                    "company": kwargs.get("company"),
                    "segment": kwargs.get("segment", "regular")
                }
            )
            
            return {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "created": True
            }
            
        except Exception as e:
            logger.error("Customer creation failed", email=email, error=str(e))
            raise
    
    async def get_ticket_with_relations(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Get ticket with all related data"""
        
        try:
            ticket = await self.db.ticket.find_unique(
                where={"id": ticket_id},
                include={
                    "customer": True,
                    "conversations": {
                        "order_by": {"created_at": "asc"}
                    },
                    "approvals": {
                        "order_by": {"created_at": "desc"}
                    }
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
    
    async def update_ticket_status_with_history(
        self, 
        ticket_id: str, 
        new_status: str, 
        updated_by: Optional[str] = None,
        reason: Optional[str] = None
    ) -> bool:
        """Update ticket status and log the change"""
        
        try:
            # Update ticket
            await self.db.ticket.update(
                where={"id": ticket_id},
                data={"status": new_status}
            )
            
            # Log status change in conversations
            if updated_by or reason:
                ticket = await self.db.ticket.find_unique(
                    where={"id": ticket_id}
                )
                
                log_message = f"Status changed to {new_status}"
                if updated_by:
                    log_message += f" by {updated_by}"
                if reason:
                    log_message += f". Reason: {reason}"
                
                await self.db.conversation.create(
                    data={
                        "ticket_id": ticket_id,
                        "customer_id": ticket.customer_id,
                        "content": log_message,
                        "role": "SYSTEM"
                    }
                )
            
            logger.info("Ticket status updated", 
                       ticket_id=ticket_id, 
                       new_status=new_status)
            
            return True
            
        except Exception as e:
            logger.error("Ticket status update failed", error=str(e))
            raise
    
    async def get_customer_ticket_history(
        self, 
        customer_email: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get customer's ticket history"""
        
        try:
            tickets = await self.db.ticket.find_many(
                where={
                    "customer": {"email": customer_email}
                },
                include={"conversations": True},
                order_by={"created_at": "desc"},
                take=limit
            )
            
            return [
                {
                    "id": ticket.id,
                    "subject": ticket.subject,
                    "status": ticket.status,
                    "created_at": ticket.created_at,
                    "conversation_count": len(ticket.conversations)
                }
                for ticket in tickets
            ]
            
        except Exception as e:
            logger.error("Customer history retrieval failed", error=str(e))
            raise
    
    async def get_pending_approvals(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get all pending approval requests"""
        
        try:
            approvals = await self.db.humanapproval.find_many(
                where={"status": "PENDING"},
                include={
                    "ticket": {
                        "include": {"customer": True}
                    }
                },
                order_by={"created_at": "asc"},
                take=limit
            )
            
            return [
                {
                    "id": approval.id,
                    "ticket_id": approval.ticket_id,
                    "action_type": approval.action_type,
                    "ai_suggestion": approval.ai_suggestion,
                    "created_at": approval.created_at,
                    "customer_email": approval.ticket.customer.email,
                    "ticket_subject": approval.ticket.subject
                }
                for approval in approvals
            ]
            
        except Exception as e:
            logger.error("Pending approvals retrieval failed", error=str(e))
            raise