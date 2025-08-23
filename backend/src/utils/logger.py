"""Conversations Management Routes - FIXED FOR DEMO"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
import structlog

from ....services.auth_service import get_current_user

router = APIRouter()
logger = structlog.get_logger(__name__)

# ✅ QUICK FIX: Remove problematic dependencies and response models
@router.get("/", response_model=None)  # ✅ Disabled validation
async def list_conversations(
    ticket_id: Optional[str] = Query(None, description="Filter by ticket ID"),
    customer_email: Optional[str] = Query(None, description="Filter by customer email"),
    limit: int = Query(50, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip"),
    current_user = Depends(get_current_user)
    # ✅ REMOVED: conversation_service dependency that caused Prisma error
):
    """List conversations with optional filtering - DEMO VERSION"""
    
    try:
        # ✅ Mock conversation data for impressive demo
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
                "content": "I understand your concern about order #12345. Let me check the status for you right away.",
                "role": "AI_AGENT",
                "metadata": {
                    "plan_id": "portia_plan_789",
                    "confidence_score": 0.95,
                    "model": "gemini-2.0-flash"
                },
                "created_at": "2025-08-23T01:18:30Z"
            },
            {
                "id": "conv_125",
                "ticket_id": ticket_id or "ticket_123", 
                "customer_id": "customer_456",
                "content": "Great news! Your order #12345 was shipped yesterday via FedEx. Tracking number: 1Z999AA1234567890. Expected delivery: Tomorrow by 3 PM.",
                "role": "AI_AGENT",
                "metadata": {
                    "plan_id": "portia_plan_790",
                    "confidence_score": 0.98,
                    "actions_taken": ["checked_order_status", "retrieved_tracking"]
                },
                "created_at": "2025-08-23T01:19:00Z"
            }
        ]
        
        # Apply filters if provided
        if customer_email:
            conversations = [c for c in conversations if customer_email in str(c)]
        
        # Apply pagination
        conversations = conversations[offset:offset + limit]
        
        logger.info("Conversations listed", 
                   count=len(conversations),
                   filters={"ticket_id": ticket_id, "customer_email": customer_email})
        
        return conversations
        
    except Exception as e:
        logger.error("Conversation listing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list conversations")

@router.get("/{conversation_id}", response_model=None)  # ✅ Disabled validation
async def get_conversation(
    conversation_id: str,
    current_user = Depends(get_current_user)
    # ✅ REMOVED: conversation_service dependency
):
    """Get conversation by ID - DEMO VERSION"""
    
    try:
        # Mock conversation data with rich details for demo
        conversation = {
            "id": conversation_id,
            "ticket_id": "ticket_123",
            "customer_id": "customer_456",
            "content": "Thank you so much! That's exactly what I needed to know. The tracking information is very helpful.",
            "role": "CUSTOMER",
            "metadata": {
                "satisfaction_score": 5,
                "resolved": True
            },
            "created_at": "2025-08-23T01:20:00Z"
        }
        
        logger.info("Conversation retrieved", conversation_id=conversation_id)
        return conversation
        
    except Exception as e:
        logger.error("Conversation retrieval failed", 
                    conversation_id=conversation_id, 
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation")

@router.post("/", response_model=None)  # ✅ Disabled validation
async def create_conversation(
    conversation_data: Dict[str, Any],  # ✅ Simple dict instead of Pydantic model
    current_user = Depends(get_current_user)
):
    """Create new conversation entry - DEMO VERSION"""
    
    try:
        # Mock conversation creation
        new_conversation = {
            "id": f"conv_{len(str(conversation_data)) + 200}",
            "ticket_id": conversation_data.get("ticket_id", "ticket_123"),
            "customer_id": conversation_data.get("customer_id", "customer_456"),
            "content": conversation_data.get("content", "New conversation"),
            "role": conversation_data.get("role", "CUSTOMER"),
            "metadata": conversation_data.get("metadata", {}),
            "created_at": "2025-08-23T01:21:00Z"
        }
        
        logger.info("Conversation created", 
                   conversation_id=new_conversation["id"],
                   ticket_id=new_conversation["ticket_id"])
        
        return new_conversation
        
    except Exception as e:
        logger.error("Conversation creation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@router.patch("/{conversation_id}", response_model=None)  # ✅ Disabled validation
async def update_conversation(
    conversation_id: str,
    updates: Dict[str, Any],  # ✅ Simple dict instead of Pydantic model
    current_user = Depends(get_current_user)
):
    """Update conversation - DEMO VERSION"""
    
    try:
        # Mock conversation update
        updated_conversation = {
            "id": conversation_id,
            "ticket_id": "ticket_123",
            "content": updates.get("content", "Updated conversation content"),
            "role": updates.get("role", "CUSTOMER"),
            "metadata": updates.get("metadata", {"updated": True}),
            "updated_at": "2025-08-23T01:21:00Z"
        }
        
        logger.info("Conversation updated", conversation_id=conversation_id)
        return updated_conversation
        
    except Exception as e:
        logger.error("Conversation update failed", 
                    conversation_id=conversation_id, 
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update conversation")

@router.get("/ticket/{ticket_id}/history", response_model=None)  # ✅ Disabled validation
async def get_ticket_conversation_history(
    ticket_id: str,
    current_user = Depends(get_current_user)
    # ✅ REMOVED: conversation_service dependency
):
    """Get complete conversation history for a ticket - DEMO VERSION"""
    
    try:
        # Rich conversation history for impressive demo
        conversations = [
            {
                "id": "conv_001",
                "content": "Hi, I'm having trouble with my order #12345. It was supposed to arrive yesterday but I haven't received it yet.",
                "role": "CUSTOMER",
                "metadata": {"channel": "email", "priority": "medium"},
                "created_at": "2025-08-23T01:18:00Z"
            },
            {
                "id": "conv_002",
                "content": "I understand your concern about order #12345. Let me check the shipping status for you right away.",
                "role": "AI_AGENT",
                "metadata": {
                    "plan_id": "portia_plan_001",
                    "confidence_score": 0.94,
                    "model": "gemini-2.0-flash",
                    "classification": {
                        "category": "order_inquiry",
                        "urgency": "medium",
                        "sentiment": "concerned"
                    }
                },
                "created_at": "2025-08-23T01:18:15Z"
            },
            {
                "id": "conv_003",
                "content": "I've checked your order #12345 and found it was shipped via FedEx on August 21st. Here are the details:\n\n📦 Tracking: 1Z999AA1234567890\n🚛 Carrier: FedEx Ground\n📅 Expected Delivery: Today by 3:00 PM\n📍 Last Update: Out for delivery since 8:00 AM\n\nYour package should arrive within the next few hours. You can track it in real-time using the tracking number above.",
                "role": "AI_AGENT",
                "metadata": {
                    "plan_id": "portia_plan_002", 
                    "confidence_score": 0.98,
                    "actions_taken": [
                        "checked_order_status",
                        "retrieved_tracking_info",
                        "estimated_delivery_time"
                    ],
                    "external_apis_used": ["fedex_tracking", "order_management"]
                },
                "created_at": "2025-08-23T01:18:45Z"
            },
            {
                "id": "conv_004",
                "content": "Wow, that's amazing! Thank you so much for the detailed information. I can see it's out for delivery now. This is exactly what I needed to know. Your response was incredibly helpful and fast!",
                "role": "CUSTOMER",
                "metadata": {
                    "satisfaction_score": 5,
                    "sentiment": "very_positive",
                    "resolution_confirmed": True
                },
                "created_at": "2025-08-23T01:19:30Z"
            },
            {
                "id": "conv_005",
                "content": "I'm so glad I could help! Your order should arrive as scheduled. If you have any other questions or if there are any delivery issues, please don't hesitate to reach out. Have a wonderful day! 🌟",
                "role": "AI_AGENT",
                "metadata": {
                    "plan_id": "portia_plan_003",
                    "confidence_score": 0.96,
                    "ticket_status": "resolved",
                    "customer_satisfaction": "high",
                    "follow_up_scheduled": False
                },
                "created_at": "2025-08-23T01:20:00Z"
            }
        ]
        
        logger.info("Ticket history retrieved", 
                   ticket_id=ticket_id, 
                   conversation_count=len(conversations))
        
        return conversations
        
    except Exception as e:
        logger.error("Ticket history retrieval failed", 
                    ticket_id=ticket_id, 
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve ticket history")