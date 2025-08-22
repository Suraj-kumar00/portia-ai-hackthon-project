"""Conversation management service"""
from typing import Dict, Any, List, Optional
from prisma import Prisma
import structlog

logger = structlog.get_logger(__name__)

class ConversationService:
    """Service for managing ticket conversations"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_conversation(
        self,
        ticket_id: str,
        customer_id: str,
        content: str,
        role: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create new conversation entry"""
        
        try:
            conversation = await self.db.conversation.create(
                data={
                    "ticket_id": ticket_id,
                    "customer_id": customer_id,
                    "content": content,
                    "role": role.upper(),
                    "metadata": metadata
                }
            )
            
            logger.info("Conversation created", 
                       conversation_id=conversation.id,
                       ticket_id=ticket_id,
                       role=role)
            
            return {
                "id": conversation.id,
                "ticket_id": conversation.ticket_id,
                "customer_id": conversation.customer_id,
                "content": conversation.content,
                "role": conversation.role,
                "metadata": conversation.metadata,
                "created_at": conversation.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error("Conversation creation failed", error=str(e))
            raise
    
    async def get_conversation_by_id(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation by ID"""
        
        try:
            conversation = await self.db.conversation.find_unique(
                where={"id": conversation_id},
                include={
                    "ticket": True,
                    "customer": True
                }
            )
            
            if not conversation:
                return None
            
            return {
                "id": conversation.id,
                "ticket_id": conversation.ticket_id,
                "customer_id": conversation.customer_id,
                "content": conversation.content,
                "role": conversation.role,
                "metadata": conversation.metadata,
                "created_at": conversation.created_at.isoformat(),
                "ticket": {
                    "subject": conversation.ticket.subject,
                    "status": conversation.ticket.status
                },
                "customer": {
                    "email": conversation.customer.email,
                    "name": conversation.customer.name
                }
            }
            
        except Exception as e:
            logger.error("Conversation retrieval failed", error=str(e))
            raise
    
    async def list_conversations(
        self,
        ticket_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List conversations with filtering"""
        
        try:
            where_clause = {}
            include_clause = {"customer": True, "ticket": True}
            
            if ticket_id:
                where_clause["ticket_id"] = ticket_id
            
            if customer_email:
                where_clause["customer"] = {"email": customer_email}
            
            conversations = await self.db.conversation.find_many(
                where=where_clause,
                include=include_clause,
                take=limit,
                skip=offset,
                order_by={"created_at": "desc"}
            )
            
            return [
                {
                    "id": conv.id,
                    "ticket_id": conv.ticket_id,
                    "content": conv.content,
                    "role": conv.role,
                    "created_at": conv.created_at.isoformat(),
                    "customer_email": conv.customer.email,
                    "ticket_subject": conv.ticket.subject
                }
                for conv in conversations
            ]
            
        except Exception as e:
            logger.error("Conversation listing failed", error=str(e))
            raise
    
    async def get_ticket_history(self, ticket_id: str) -> List[Dict[str, Any]]:
        """Get complete conversation history for a ticket"""
        
        try:
            conversations = await self.db.conversation.find_many(
                where={"ticket_id": ticket_id},
                include={"customer": True},
                order_by={"created_at": "asc"}
            )
            
            return [
                {
                    "id": conv.id,
                    "content": conv.content,
                    "role": conv.role,
                    "metadata": conv.metadata,
                    "created_at": conv.created_at.isoformat(),
                    "customer_email": conv.customer.email
                }
                for conv in conversations
            ]
            
        except Exception as e:
            logger.error("Ticket history retrieval failed", error=str(e))
            raise
    
    async def update_conversation(
        self, 
        conversation_id: str, 
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update conversation"""
        
        try:
            conversation = await self.db.conversation.update(
                where={"id": conversation_id},
                data=updates,
                include={"customer": True, "ticket": True}
            )
            
            logger.info("Conversation updated", conversation_id=conversation_id)
            
            return {
                "id": conversation.id,
                "content": conversation.content,
                "role": conversation.role,
                "metadata": conversation.metadata,
                "updated_at": conversation.ticket.updated_at.isoformat()
            }
            
        except Exception as e:
            logger.error("Conversation update failed", error=str(e))
            raise
    
    async def add_ai_response(
        self,
        ticket_id: str,
        ai_response: str,
        plan_id: Optional[str] = None,
        confidence_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """Add AI agent response to conversation"""
        
        try:
            # Get ticket to find customer_id
            ticket = await self.db.ticket.find_unique(
                where={"id": ticket_id}
            )
            
            if not ticket:
                raise ValueError(f"Ticket {ticket_id} not found")
            
            metadata = {
                "plan_id": plan_id,
                "confidence_score": confidence_score,
                "source": "portia_ai_agent"
            }
            
            conversation = await self.create_conversation(
                ticket_id=ticket_id,
                customer_id=ticket.customer_id,
                content=ai_response,
                role="AI_AGENT",
                metadata=metadata
            )
            
            logger.info("AI response added to conversation", 
                       ticket_id=ticket_id,
                       plan_id=plan_id)
            
            return conversation
            
        except Exception as e:
            logger.error("AI response addition failed", error=str(e))
            raise