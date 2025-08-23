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
    
    def _safe_get(self, obj: Any, key: str, default: Any = None) -> Any:
        """Safely get value from dict or object"""
        if isinstance(obj, dict):
            return obj.get(key, default)
        else:
            return getattr(obj, key, default)
    
    def _to_dict(self, obj: Any) -> Dict[str, Any]:
        """Convert Prisma result to dict safely"""
        if isinstance(obj, dict):
            return obj
        elif hasattr(obj, 'dict'):
            return obj.dict()
        elif hasattr(obj, '__dict__'):
            return obj.__dict__
        else:
            # Handle object with attributes
            result = {}
            for attr in ['id', 'email', 'name', 'subject', 'status', 'priority', 'created_at', 'updated_at', 'customer_id', 'source']:
                if hasattr(obj, attr):
                    result[attr] = getattr(obj, attr)
            return result
    
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
            
            # ✅ FIX: Safe customer ID extraction
            customer_id = self._safe_get(customer, 'id')
            if not customer_id:
                raise ValueError("Failed to get customer ID")
            
            # Create new ticket
            ticket = await prisma.ticket.create(
                data={
                    "subject": subject,
                    "customer_id": customer_id,
                    "source": source,
                    "status": "OPEN",
                    "priority": "MEDIUM"
                }
            )
            
            # ✅ FIX: Safe ticket ID extraction
            ticket_id = self._safe_get(ticket, 'id')
            if not ticket_id:
                raise ValueError("Failed to get ticket ID")
            
            # Create initial conversation entry
            await prisma.conversation.create(
                data={
                    "ticket_id": ticket_id,
                    "customer_id": customer_id,
                    "content": query,
                    "role": "CUSTOMER"
                }
            )
            
            logger.info("✅ Ticket created with Prisma", ticket_id=ticket_id)
            
            # ✅ FIX: Safe response building
            created_at = self._safe_get(ticket, 'created_at')
            response = {
                "id": ticket_id,
                "subject": self._safe_get(ticket, 'subject'),
                "status": self._safe_get(ticket, 'status'),
                "priority": self._safe_get(ticket, 'priority'),
                "customer_email": self._safe_get(customer, 'email'),
                "created_at": created_at.isoformat() if created_at else datetime.utcnow().isoformat()
            }
            
            return response
            
        except Exception as e:
            logger.error("❌ Ticket creation failed", error=str(e))
            raise
    
    async def update_ticket_with_ai_result(
        self, 
        ticket_id: str, 
        ai_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update ticket with AI processing results"""
        
        try:
            prisma = get_prisma()
            
            update_data = {
                "updated_at": datetime.utcnow()
            }
            
            # Add AI results if available
            if ai_result.get("classification", {}).get("category"):
                update_data["category"] = ai_result["classification"]["category"]
            
            if ai_result.get("classification", {}).get("priority"):
                update_data["priority"] = ai_result["classification"]["priority"].upper()
            
            if ai_result.get("confidence"):
                update_data["ai_confidence"] = float(ai_result["confidence"])
            
            # Update ticket
            updated_ticket = await prisma.ticket.update(
                where={"id": ticket_id},
                data=update_data
            )
            
            logger.info("✅ Ticket updated with AI results", 
                       ticket_id=ticket_id,
                       category=update_data.get("category"),
                       priority=update_data.get("priority"))
            
            return self._to_dict(updated_ticket)
            
        except Exception as e:
            logger.error("❌ Ticket AI update failed", 
                        ticket_id=ticket_id, error=str(e))
            raise
    
    async def create_approval_request(
        self,
        ticket_id: str,
        ai_suggestion: str,
        action_type: str,
        metadata: Dict[str, Any]
    ) -> str:
        """Create approval request for human oversight"""
        
        try:
            prisma = get_prisma()
            
            approval = await prisma.approval.create(
                data={
                    "ticket_id": ticket_id,
                    "ai_suggestion": ai_suggestion,
                    "action_type": action_type,
                    "status": "PENDING",
                    "plan_id": metadata.get("plan_id"),
                    "metadata": metadata
                }
            )
            
            approval_id = self._safe_get(approval, 'id')
            logger.info("✅ Approval request created", 
                       ticket_id=ticket_id, approval_id=approval_id)
            
            return approval_id
            
        except Exception as e:
            logger.error("❌ Approval creation failed", error=str(e))
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
            
            # ✅ FIX: Safe data extraction
            customer = self._safe_get(ticket, 'customer')
            conversations = self._safe_get(ticket, 'conversations', [])
            
            response = {
                "id": self._safe_get(ticket, 'id'),
                "subject": self._safe_get(ticket, 'subject'),
                "status": self._safe_get(ticket, 'status'),
                "priority": self._safe_get(ticket, 'priority'),
                "customer": {
                    "email": self._safe_get(customer, 'email') if customer else None,
                    "name": self._safe_get(customer, 'name') if customer else None
                },
                "conversations": [
                    {
                        "id": self._safe_get(conv, 'id'),
                        "content": self._safe_get(conv, 'content'),
                        "role": self._safe_get(conv, 'role'),
                        "created_at": self._safe_get(conv, 'created_at').isoformat() 
                            if self._safe_get(conv, 'created_at') else None
                    }
                    for conv in conversations
                ],
                "created_at": self._safe_get(ticket, 'created_at').isoformat() 
                    if self._safe_get(ticket, 'created_at') else None,
                "updated_at": self._safe_get(ticket, 'updated_at').isoformat() 
                    if self._safe_get(ticket, 'updated_at') else None
            }
            
            return response
            
        except Exception as e:
            logger.error("❌ Ticket retrieval failed", error=str(e))
            raise
