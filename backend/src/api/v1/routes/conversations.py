"""Conversations Management Routes"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import structlog

from ....models.schemas import (
    ConversationResponse,
    ConversationCreate,
    ConversationUpdate
)
from ....services.conversation_service import ConversationService
from ....services.auth_service import get_current_user

router = APIRouter()
logger = structlog.get_logger(__name__)

@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(
    ticket_id: Optional[str] = Query(None, description="Filter by ticket ID"),
    customer_email: Optional[str] = Query(None, description="Filter by customer email"),
    limit: int = Query(50, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip"),
    current_user = Depends(get_current_user),
    conversation_service: ConversationService = Depends()
):
    """List conversations with optional filtering"""
    
    try:
        conversations = await conversation_service.list_conversations(
            ticket_id=ticket_id,
            customer_email=customer_email,
            limit=limit,
            offset=offset
        )
        
        logger.info("Conversations listed", 
                   count=len(conversations),
                   filters={"ticket_id": ticket_id, "customer_email": customer_email})
        
        return conversations
        
    except Exception as e:
        logger.error("Conversation listing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list conversations")

@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user = Depends(get_current_user),
    conversation_service: ConversationService = Depends()
):
    """Get conversation by ID"""
    
    try:
        conversation = await conversation_service.get_conversation_by_id(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Conversation retrieval failed", 
                    conversation_id=conversation_id, 
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation")

@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    conversation: ConversationCreate,
    current_user = Depends(get_current_user),
    conversation_service: ConversationService = Depends()
):
    """Create new conversation entry"""
    
    try:
        new_conversation = await conversation_service.create_conversation(
            ticket_id=conversation.ticket_id,
            customer_id=conversation.customer_id,
            content=conversation.content,
            role=conversation.role,
            metadata=conversation.metadata
        )
        
        logger.info("Conversation created", 
                   conversation_id=new_conversation.id,
                   ticket_id=conversation.ticket_id)
        
        return new_conversation
        
    except Exception as e:
        logger.error("Conversation creation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    updates: ConversationUpdate,
    current_user = Depends(get_current_user),
    conversation_service: ConversationService = Depends()
):
    """Update conversation"""
    
    try:
        updated_conversation = await conversation_service.update_conversation(
            conversation_id=conversation_id,
            updates=updates.dict(exclude_unset=True)
        )
        
        if not updated_conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        logger.info("Conversation updated", 
                   conversation_id=conversation_id)
        
        return updated_conversation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Conversation update failed", 
                    conversation_id=conversation_id, 
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update conversation")

@router.get("/ticket/{ticket_id}/history", response_model=List[ConversationResponse])
async def get_ticket_conversation_history(
    ticket_id: str,
    current_user = Depends(get_current_user),
    conversation_service: ConversationService = Depends()
):
    """Get complete conversation history for a ticket"""
    
    try:
        conversations = await conversation_service.get_ticket_history(ticket_id)
        
        logger.info("Ticket history retrieved", 
                   ticket_id=ticket_id, 
                   conversation_count=len(conversations))
        
        return conversations
        
    except Exception as e:
        logger.error("Ticket history retrieval failed", 
                    ticket_id=ticket_id, 
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve ticket history")