"""
Customer Support Tickets API with Portia AI Integration
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from typing import List, Optional
import structlog
import uuid

from ....models.schemas import (
    TicketCreate,
    TicketResponse, 
    ProcessQueryRequest,
    ProcessQueryResponse,
    HumanApprovalRequest,
    HumanApprovalResponse
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
    
    logger.info("Processing customer query",
               request_id=request_id,
               customer_email=request.customer_email,
               query_length=len(request.query))
    
    try:
        # Create or get existing ticket
        ticket = await ticket_service.create_or_update_ticket(
            customer_email=request.customer_email,
            subject=request.subject or "Customer Inquiry",
            query=request.query,
            source=request.source or "api",
            metadata=request.metadata or {}
        )
        
        # Build customer context for AI agent
        customer_context = {
            "email": request.customer_email,
            "ticket_id": ticket.id,
            "source": request.source,
            "history": request.context.get("history", []) if request.context else [],
            "customer_segment": request.context.get("segment", "regular") if request.context else "regular"
        }
        
        # Process with Portia AI agent
        ai_result = await ai_agent.process_customer_query(
            query=request.query,
            customer_context=customer_context,
            ticket_id=ticket.id
        )
        
        # Update ticket with AI processing results
        await ticket_service.update_ticket_with_ai_result(
            ticket_id=ticket.id,
            ai_result=ai_result
        )
        
        # If human approval required, create approval request
        approval_id = None
        if ai_result.get("requires_human_approval"):
            approval_id = await ticket_service.create_approval_request(
                ticket_id=ticket.id,
                ai_suggestion=ai_result.get("response"),
                action_type=ai_result.get("classification", {}).get("category", "general"),
                metadata=ai_result
            )
        
        # Prepare response
        response = ProcessQueryResponse(
            request_id=request_id,
            ticket_id=ticket.id,
            plan_id=ai_result.get("plan_id"),
            status="completed",
            ai_response=ai_result.get("response"),
            classification=ai_result.get("classification"),
            requires_human_approval=ai_result.get("requires_human_approval"),
            approval_id=approval_id,
            suggested_actions=ai_result.get("suggested_actions", [])
        )
        
        logger.info("Customer query processed successfully",
                   request_id=request_id,
                   ticket_id=ticket.id,
                   requires_approval=ai_result.get("requires_human_approval"))
        
        return response
        
    except Exception as e:
        logger.error("Query processing failed",
                    request_id=request_id,
                    error=str(e))
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Query processing failed",
                "message": str(e),
                "request_id": request_id
            }
        )

@router.post("/{ticket_id}/approve", response_model=HumanApprovalResponse)
async def approve_ai_action(
    ticket_id: str,
    request: HumanApprovalRequest,
    current_user = Depends(get_current_user),
    ai_agent: CustomerSupportAgent = Depends(get_ai_agent),
    ticket_service: TicketService = Depends()
):
    """
    Human approval endpoint for AI-suggested actions
    Critical for human-in-the-loop workflow
    """
    
    logger.info("Processing human approval",
               ticket_id=ticket_id,
               approval_id=request.approval_id,
               approved=request.approved,
               user_id=current_user.get("id"))
    
    try:
        # Validate approval request exists
        approval = await ticket_service.get_approval_request(request.approval_id)
        if not approval or approval.ticket_id != ticket_id:
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
        if request.approved and approval.plan_id:
            try:
                ai_continuation = await ai_agent.approve_action(
                    plan_id=approval.plan_id,
                    approved=True,
                    reason=request.reason or "Human approved"
                )
                approval_result["ai_continuation"] = ai_continuation
            except Exception as e:
                logger.error("AI continuation failed after approval", error=str(e))
                # Don't fail the approval, just log the error
        
        response = HumanApprovalResponse(
            approval_id=request.approval_id,
            ticket_id=ticket_id,
            approved=request.approved,
            processed_at=approval_result["processed_at"],
            result=approval_result
        )
        
        logger.info("Human approval processed successfully",
                   ticket_id=ticket_id,
                   approved=request.approved)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Approval processing failed",
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
        logger.error("Ticket retrieval failed", ticket_id=ticket_id, error=str(e))
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
        logger.error("Ticket listing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list tickets")