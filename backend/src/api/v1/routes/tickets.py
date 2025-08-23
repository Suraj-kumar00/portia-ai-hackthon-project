"""
Customer Support Tickets API with Portia AI Integration
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from typing import List, Optional
import structlog
import uuid
import time
import asyncio

from ....models.schemas import (
    TicketCreate,
    TicketResponse, 
    ProcessQueryRequest,
    ProcessQueryResponse,
    HumanApprovalRequest,
    HumanApprovalResponse,
    ClassificationModel
)
from ....services.ticket_service import TicketService
from ....services.auth_service import get_current_user
from ....agents.customer_support_agent import CustomerSupportAgent

router = APIRouter()
logger = structlog.get_logger(__name__)

def get_ai_agent(request: Request) -> CustomerSupportAgent:
    """Dependency to get the AI agent instance"""
    return request.app.state.ai_agent

@router.post("/process-query", response_model=ProcessQueryResponse)
async def process_customer_query(
    request: ProcessQueryRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    ai_agent: CustomerSupportAgent = Depends(get_ai_agent),
    ticket_service: TicketService = Depends()
):
    """
    Process incoming customer query with Portia AI agent
    This is the main endpoint for customer support automation
    """
    
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # ✅ CRITICAL: Add deduplication based on email + query hash
    query_hash = hash(f"{request.customer_email}:{request.query}")
    cache_key = f"processing_{query_hash}"
    
    # Simple in-memory cache to prevent duplicates (use Redis in production)
    if not hasattr(process_customer_query, '_processing_cache'):
        process_customer_query._processing_cache = {}
    
    # Check if same query is already being processed
    if cache_key in process_customer_query._processing_cache:
        existing_request = process_customer_query._processing_cache[cache_key]
        if time.time() - existing_request['start_time'] < 60:  # Within 1 minute
            logger.warning("Duplicate request detected, returning existing ticket",
                         customer_email=request.customer_email,
                         existing_ticket_id=existing_request['ticket_id'])
            
            return ProcessQueryResponse(
                request_id=existing_request['request_id'],
                ticket_id=existing_request['ticket_id'],
                status="duplicate_prevented",
                ai_response="Your request is already being processed. Please check your ticket status.",
                classification={"category": "duplicate", "priority": "low", "cloud_enhanced": "false", "confidence": "1.0"},
                requires_human_approval=False,
                suggested_actions=[]
            )
    
    # Mark as processing
    process_customer_query._processing_cache[cache_key] = {
        'request_id': request_id,
        'start_time': start_time,
        'ticket_id': None
    }
    
    try:
        logger.info("Processing customer query",
                   request_id=request_id,
                   customer_email=request.customer_email,
                   query_length=len(request.query))
        
        # Create ticket with proper error handling
        ticket = await ticket_service.create_or_update_ticket(
            customer_email=request.customer_email,
            subject=request.subject or "Customer Inquiry",
            query=request.query,
            source=request.source or "api",
            metadata=request.metadata or {}
        )
        
        # Safe ticket ID extraction
        ticket_id = ticket.get("id") if isinstance(ticket, dict) else getattr(ticket, 'id', None)
        if not ticket_id:
            raise ValueError("Failed to get ticket ID from created ticket")
        
        # Update cache with ticket ID
        process_customer_query._processing_cache[cache_key]['ticket_id'] = ticket_id
        
        logger.info("✅ Ticket created successfully", 
                   ticket_id=ticket_id, request_id=request_id)
        
        # Build customer context
        customer_context = {
            "email": request.customer_email,
            "ticket_id": ticket_id,
            "source": request.source or "api",
            "history": request.context.get("history", []) if request.context else [],
            "customer_segment": request.context.get("segment", "regular") if request.context else "regular"
        }
        
        # ✅ ENHANCED: AI processing with timeout protection
        ai_result = None
        try:
            # Set overall processing timeout
            ai_result = await asyncio.wait_for(
                ai_agent.process_customer_query(
                    query=request.query,
                    customer_context=customer_context,
                    ticket_id=ticket_id
                ),
                timeout=45.0  # ✅ Overall timeout of 45 seconds
            )
            
            logger.info("✅ AI processing completed", 
                       ticket_id=ticket_id, 
                       request_id=request_id)
            
        except asyncio.TimeoutError:
            logger.error("❌ AI processing timed out after 45s", 
                        ticket_id=ticket_id, request_id=request_id)
            ai_result = {
                "response": "Thank you for your inquiry. Due to high demand, your request is being processed and our team will respond within 2 hours.",
                "classification": {
                    "category": "general_inquiry",
                    "priority": "medium",
                    "urgency": "medium",
                    "sentiment": "neutral",
                    "cloud_enhanced": "false",
                    "confidence": "0.6"
                },
                "requires_human_approval": True,
                "suggested_actions": [{"action_type": "human_review_timeout", "description": "AI processing timed out"}],
                "timeout": True
            }
            
        except Exception as ai_error:
            logger.error("❌ AI processing failed", 
                        ticket_id=ticket_id, error=str(ai_error), request_id=request_id)
            ai_result = {
                "response": "Thank you for your inquiry. We've received your request and our team will respond with a comprehensive solution within 24 hours.",
                "classification": {
                    "category": "general_inquiry",
                    "priority": "medium", 
                    "urgency": "medium",
                    "sentiment": "neutral",
                    "cloud_enhanced": "false",
                    "confidence": "0.5"
                },
                "requires_human_approval": True,
                "suggested_actions": [{"action_type": "human_review_error", "description": "AI processing failed"}],
                "error": str(ai_error)
            }
        
        # ✅ CRITICAL: Sanitize AI result for Pydantic validation
        if ai_result and ai_result.get("classification"):
            classification = ai_result["classification"]
            
            # Convert boolean values to strings
            for key, value in classification.items():
                if isinstance(value, bool):
                    classification[key] = str(value).lower()
                elif value is None:
                    classification[key] = None
            
            # Ensure required fields have defaults
            classification.setdefault("category", "general_inquiry")
            classification.setdefault("priority", "medium")
            classification.setdefault("urgency", "medium")
            classification.setdefault("sentiment", "neutral")
            classification.setdefault("confidence", "0.5")
        
        # Update ticket with AI processing results
        try:
            await ticket_service.update_ticket_with_ai_result(
                ticket_id=ticket_id,
                ai_result=ai_result
            )
            logger.info("✅ Ticket updated with AI results", ticket_id=ticket_id)
        except Exception as update_error:
            logger.error("❌ Ticket AI update failed", 
                        ticket_id=ticket_id, error=str(update_error))
        
        # Handle approval request
        approval_id = None
        if ai_result and ai_result.get("requires_human_approval"):
            try:
                approval_id = await ticket_service.create_approval_request(
                    ticket_id=ticket_id,
                    ai_suggestion=ai_result.get("response", ""),
                    action_type=ai_result.get("classification", {}).get("category", "general"),
                    metadata=ai_result or {}
                )
                logger.info("✅ Approval request created", ticket_id=ticket_id, approval_id=approval_id)
            except Exception as approval_error:
                logger.error("❌ Approval creation failed", error=str(approval_error))
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # ✅ CRITICAL: Create response with validated data
        try:
            response = ProcessQueryResponse(
                request_id=request_id,
                ticket_id=ticket_id,
                plan_id=ai_result.get("plan_id") if ai_result else None,
                status="completed",
                ai_response=ai_result.get("response", "Request processed successfully") if ai_result else "Request processed successfully",
                classification=ai_result.get("classification") if ai_result else {
                    "category": "general_inquiry",
                    "priority": "medium",
                    "urgency": "medium", 
                    "sentiment": "neutral",
                    "cloud_enhanced": "false",
                    "confidence": "0.5"
                },
                requires_human_approval=ai_result.get("requires_human_approval", True) if ai_result else True,
                approval_id=approval_id,
                suggested_actions=ai_result.get("suggested_actions", []) if ai_result else [],
                processing_time_ms=processing_time_ms
            )
        except Exception as response_error:
            logger.error("❌ Response creation failed", error=str(response_error), error_type=type(response_error).__name__)
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Response validation failed",
                    "message": str(response_error),
                    "request_id": request_id
                }
            )
        
        logger.info("✅ Customer query processed successfully",
                   request_id=request_id,
                   ticket_id=ticket_id,
                   processing_time_ms=processing_time_ms,
                   requires_approval=response.requires_human_approval)
        
        return response
        
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        logger.error("❌ Query processing failed",
                    request_id=request_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    processing_time_ms=processing_time_ms)
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Query processing failed",
                "message": str(e),
                "request_id": request_id,
                "processing_time_ms": processing_time_ms
            }
        )
        
    finally:
        # ✅ CRITICAL: Clean up processing cache
        if cache_key in process_customer_query._processing_cache:
            del process_customer_query._processing_cache[cache_key]

# Rest of your endpoints remain the same...
@router.post("/{ticket_id}/approve", response_model=HumanApprovalResponse)
async def approve_ai_action(
    ticket_id: str,
    request: HumanApprovalRequest,
    current_user = Depends(get_current_user),
    ai_agent: CustomerSupportAgent = Depends(get_ai_agent),
    ticket_service: TicketService = Depends()
):
    """Human approval endpoint for AI-suggested actions"""
    
    logger.info("Processing human approval",
               ticket_id=ticket_id,
               approval_id=request.approval_id,
               approved=request.approved,
               user_id=current_user.get("id"))
    
    try:
        # Validate approval request exists
        approval = await ticket_service.get_approval_request(request.approval_id)
        if not approval or approval.get("ticket_id") != ticket_id:
            raise HTTPException(status_code=404, detail="Approval request not found")
        
        # Process approval in ticket service
        approval_result = await ticket_service.process_human_approval(
            ticket_id=ticket_id,
            approval_id=request.approval_id,
            approved=request.approved,
            reason=request.reason,
            approved_by=current_user.get("id")
        )
        
        # If approved, continue AI agent execution
        if request.approved and approval.get("plan_id"):
            try:
                ai_continuation = await ai_agent.approve_action(
                    plan_id=approval["plan_id"],
                    approved=True,
                    reason=request.reason or "Human approved"
                )
                approval_result["ai_continuation"] = ai_continuation
            except Exception as e:
                logger.error("AI continuation failed after approval", error=str(e))
        
        response = HumanApprovalResponse(
            approval_id=request.approval_id,
            ticket_id=ticket_id,
            approved=request.approved,
            processed_at=approval_result["processed_at"],
            result=approval_result
        )
        
        logger.info("✅ Human approval processed successfully",
                   ticket_id=ticket_id,
                   approved=request.approved)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("❌ Approval processing failed",
                    ticket_id=ticket_id,
                    error=str(e))
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Approval processing failed",
                "message": str(e)
            }
        )

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    current_user = Depends(get_current_user),
    ticket_service: TicketService = Depends()
):
    """Get ticket by ID with full details"""
    
    try:
        ticket = await ticket_service.get_ticket_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        return ticket
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("❌ Ticket retrieval failed", ticket_id=ticket_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve ticket")

@router.get("/", response_model=List[TicketResponse])
async def list_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user = Depends(get_current_user),
    ticket_service: TicketService = Depends()
):
    """List tickets with optional filtering"""
    
    try:
        tickets = await ticket_service.list_tickets(
            status=status,
            category=category,
            priority=priority,
            limit=limit,
            offset=offset
        )
        
        return tickets
        
    except Exception as e:
        logger.error("❌ Ticket listing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list tickets")