"""Ticket management service"""
from typing import Dict, Any, List, Optional
from prisma import Prisma
import structlog
import uuid
from datetime import datetime

logger = structlog.get_logger(__name__)

class TicketService:
    """Service for managing customer support tickets"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_or_update_ticket(
        self,
        customer_email: str,
        subject: str,
        query: str,
        source: str = "api",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create new ticket or update existing one"""
        
        try:
            # Check if customer exists, create if not
            customer = await self.db.customer.find_unique(
                where={"email": customer_email}
            )
            
            if not customer:
                customer = await self.db.customer.create(
                    data={
                        "email": customer_email,
                        "name": metadata.get("name") if metadata else None
                    }
                )
            
            # Create new ticket
            ticket = await self.db.ticket.create(
                data={
                    "subject": subject,
                    "customer_id": customer.id,
                    "source": source,
                    "status": "OPEN",
                    "priority": "MEDIUM"
                }
            )
            
            # Create initial conversation entry
            await self.db.conversation.create(
                data={
                    "ticket_id": ticket.id,
                    "customer_id": customer.id,
                    "content": query,
                    "role": "CUSTOMER"
                }
            )
            
            logger.info("Ticket created", 
                       ticket_id=ticket.id, 
                       customer_email=customer_email)
            
            return {
                "id": ticket.id,
                "subject": ticket.subject,
                "status": ticket.status,
                "priority": ticket.priority,
                "customer_email": customer_email,
                "created_at": ticket.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error("Ticket creation failed", error=str(e))
            raise
    
    async def get_ticket_by_id(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Get ticket by ID with related data"""
        
        try:
            ticket = await self.db.ticket.find_unique(
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
                "category": ticket.category,
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
                "approvals": [
                    {
                        "id": approval.id,
                        "action_type": approval.action_type,
                        "status": approval.status,
                        "created_at": approval.created_at.isoformat()
                    }
                    for approval in ticket.approvals
                ],
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat()
            }
            
        except Exception as e:
            logger.error("Ticket retrieval failed", ticket_id=ticket_id, error=str(e))
            raise
    
    async def update_ticket_with_ai_result(
        self, 
        ticket_id: str, 
        ai_result: Dict[str, Any]
    ) -> bool:
        """Update ticket with AI processing results"""
        
        try:
            # Update ticket with AI classification
            classification = ai_result.get("classification", {})
            
            await self.db.ticket.update(
                where={"id": ticket_id},
                data={
                    "category": classification.get("category"),
                    "priority": classification.get("urgency", "medium").upper(),
                    "status": "IN_PROGRESS" if ai_result.get("requires_human_approval") else "OPEN"
                }
            )
            
            # Add AI response as conversation
            await self.db.conversation.create(
                data={
                    "ticket_id": ticket_id,
                    "customer_id": (await self.db.ticket.find_unique(
                        where={"id": ticket_id}
                    )).customer_id,
                    "content": ai_result.get("response", "AI processing completed"),
                    "role": "AI_AGENT",
                    "metadata": ai_result
                }
            )
            
            logger.info("Ticket updated with AI result", ticket_id=ticket_id)
            return True
            
        except Exception as e:
            logger.error("Ticket AI update failed", ticket_id=ticket_id, error=str(e))
            raise
    
    async def create_approval_request(
        self,
        ticket_id: str,
        ai_suggestion: str,
        action_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create human approval request"""
        
        try:
            approval = await self.db.humanapproval.create(
                data={
                    "ticket_id": ticket_id,
                    "action_type": action_type,
                    "ai_suggestion": ai_suggestion,
                    "status": "PENDING"
                }
            )
            
            logger.info("Approval request created", 
                       approval_id=approval.id, 
                       ticket_id=ticket_id)
            
            return approval.id
            
        except Exception as e:
            logger.error("Approval request creation failed", error=str(e))
            raise
    
    async def process_human_approval(
        self,
        ticket_id: str,
        approval_id: str,
        approved: bool,
        reason: Optional[str] = None,
        approved_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process human approval decision"""
        
        try:
            # Update approval record
            approval = await self.db.humanapproval.update(
                where={"id": approval_id},
                data={
                    "status": "APPROVED" if approved else "REJECTED",
                    "approved_by": approved_by,
                    "reason": reason,
                    "decided_at": datetime.utcnow()
                }
            )
            
            # Update ticket status
            new_status = "IN_PROGRESS" if approved else "OPEN"
            await self.db.ticket.update(
                where={"id": ticket_id},
                data={"status": new_status}
            )
            
            logger.info("Human approval processed", 
                       approval_id=approval_id, 
                       approved=approved)
            
            return {
                "approval_id": approval_id,
                "approved": approved,
                "processed_at": datetime.utcnow().isoformat(),
                "new_ticket_status": new_status
            }
            
        except Exception as e:
            logger.error("Approval processing failed", error=str(e))
            raise
    
    async def list_tickets(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List tickets with filtering"""
        
        try:
            where_clause = {}
            if status:
                where_clause["status"] = status.upper()
            if category:
                where_clause["category"] = category
            if priority:
                where_clause["priority"] = priority.upper()
            
            tickets = await self.db.ticket.find_many(
                where=where_clause,
                include={"customer": True},
                take=limit,
                skip=offset,
                order_by={"created_at": "desc"}
            )
            
            return [
                {
                    "id": ticket.id,
                    "subject": ticket.subject,
                    "status": ticket.status,
                    "priority": ticket.priority,
                    "category": ticket.category,
                    "customer_email": ticket.customer.email,
                    "created_at": ticket.created_at.isoformat()
                }
                for ticket in tickets
            ]
            
        except Exception as e:
            logger.error("Ticket listing failed", error=str(e))
            raise

    async def get_approval_request(self, approval_id: str) -> Optional[Dict[str, Any]]:
        """Get approval request by ID"""
        
        try:
            approval = await self.db.humanapproval.find_unique(
                where={"id": approval_id}
            )
            
            if not approval:
                return None
            
            return {
                "id": approval.id,
                "ticket_id": approval.ticket_id,
                "action_type": approval.action_type,
                "ai_suggestion": approval.ai_suggestion,
                "status": approval.status,
                "created_at": approval.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error("Approval request retrieval failed", error=str(e))
            raise