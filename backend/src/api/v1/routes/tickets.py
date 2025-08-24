"""Tickets API"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request, Query
from typing import List, Optional
import structlog
import uuid
import time
import asyncio

from ....models.schemas import (
    TicketResponse,
    ProcessQueryRequest,
    ProcessQueryResponse,
    HumanApprovalRequest,
    HumanApprovalResponse,
)
from ....services.ticket_service import TicketService
from ....api.deps import get_current_user, get_ai_agent

router = APIRouter()
logger = structlog.get_logger(__name__)

def get_ticket_service() -> TicketService:
    return TicketService()

@router.post("/process-query", response_model=ProcessQueryResponse)
async def process_customer_query(
    request: ProcessQueryRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    ai_agent = Depends(get_ai_agent),
    ticket_service: TicketService = Depends(get_ticket_service),
):
    request_id = str(uuid.uuid4())
    start_time = time.time()

    # Dedup simple cache
    query_hash = hash(f"{request.customer_email}:{request.query}")
    cache_key = f"processing_{query_hash}"
    if not hasattr(process_customer_query, '_processing_cache'):
        process_customer_query._processing_cache = {}

    if cache_key in process_customer_query._processing_cache:
        existing = process_customer_query._processing_cache[cache_key]
        if time.time() - existing['start_time'] < 60:
            return ProcessQueryResponse(
                request_id=existing['request_id'],
                ticket_id=existing['ticket_id'],
                status="duplicate_prevented",
                ai_response="Your request is already being processed. Please check your ticket status.",
                classification={"category": "duplicate", "priority": "low", "cloud_enhanced": "false", "confidence": "1.0"},
                requires_human_approval=False,
                suggested_actions=[]
            )

    process_customer_query._processing_cache[cache_key] = {'request_id': request_id, 'start_time': start_time, 'ticket_id': None}

    try:
        ticket = await ticket_service.create_or_update_ticket(
            customer_email=request.customer_email,
            subject=request.subject or "Customer Inquiry",
            query=request.query,
            source=request.source or "api",
            metadata=request.metadata or {}
        )
        ticket_id = ticket.get("id")
        if not ticket_id:
            raise ValueError("Failed to get ticket ID after creation")

        process_customer_query._processing_cache[cache_key]['ticket_id'] = ticket_id

        customer_context = {
            "email": request.customer_email,
            "ticket_id": ticket_id,
            "source": request.source or "api",
            "history": request.context.get("history", []) if request.context else [],
            "customer_segment": request.context.get("segment", "regular") if request.context else "regular"
        }

        ai_result = None
        try:
            if ai_agent is None:
                raise RuntimeError("AI agent not initialized")
            ai_result = await asyncio.wait_for(
                ai_agent.process_customer_query(
                    query=request.query,
                    customer_context=customer_context,
                    ticket_id=ticket_id
                ),
                timeout=45.0
            )
        except asyncio.TimeoutError:
            ai_result = {
                "response": "Thank you for your inquiry. Due to high demand, your request is being processed and our team will respond shortly.",
                "classification": {"category":"general_inquiry","priority":"medium","urgency":"medium","sentiment":"neutral","cloud_enhanced":"false","confidence":"0.6"},
                "requires_human_approval": True,
                "suggested_actions": [{"action_type":"human_review_timeout","description":"AI processing timed out"}],
                "timeout": True
            }
        except Exception as e:
            ai_result = {
                "response": "Thanks for the details. We’ve logged your request and will follow up with a comprehensive solution.",
                "classification": {"category":"general_inquiry","priority":"medium","urgency":"medium","sentiment":"neutral","cloud_enhanced":"false","confidence":"0.5"},
                "requires_human_approval": True,
                "suggested_actions": [{"action_type":"human_review_error","description":"AI processing failed"}],
                "error": str(e)
            }

        # Normalize classification
        if ai_result and ai_result.get("classification"):
            cls = ai_result["classification"]
            for k, v in list(cls.items()):
                if isinstance(v, bool):
                    cls[k] = str(v).lower()
                elif v is None:
                    cls[k] = None
            cls.setdefault("category", "general_inquiry")
            cls.setdefault("priority", "medium")
            cls.setdefault("urgency", "medium")
            cls.setdefault("sentiment", "neutral")
            cls.setdefault("confidence", "0.5")

        try:
            await ticket_service.update_ticket_with_ai_result(ticket_id=ticket_id, ai_result=ai_result or {})
        except Exception as e:
            logger.error("Ticket AI update failed", ticket_id=ticket_id, error=str(e))

        approval_id = None
        if ai_result and ai_result.get("requires_human_approval"):
            try:
                approval_id = await ticket_service.create_approval_request(
                    ticket_id=ticket_id,
                    ai_suggestion=ai_result.get("response", ""),
                    action_type=ai_result.get("classification", {}).get("category", "general"),
                    metadata=ai_result or {}
                )
            except Exception as e:
                logger.error("Approval creation failed", error=str(e))

        processing_time_ms = (time.time() - start_time) * 1000.0

        resp = ProcessQueryResponse(
            request_id=request_id,
            ticket_id=ticket_id,
            plan_id=ai_result.get("plan_id") if ai_result else None,
            status="completed",
            ai_response=ai_result.get("response", "Request processed successfully") if ai_result else "Request processed successfully",
            classification=ai_result.get("classification") if ai_result else {"category":"general_inquiry","priority":"medium","urgency":"medium","sentiment":"neutral","cloud_enhanced":"false","confidence":"0.5"},
            requires_human_approval=ai_result.get("requires_human_approval", True) if ai_result else True,
            approval_id=approval_id,
            suggested_actions=ai_result.get("suggested_actions", []) if ai_result else [],
            processing_time_ms=processing_time_ms
        )
        return resp

    except Exception as e:
        logger.error("Query processing failed", error=str(e))
        raise HTTPException(status_code=500, detail={"error":"Query processing failed","message":str(e),"request_id":request_id})
    finally:
        if cache_key in process_customer_query._processing_cache:
            del process_customer_query._processing_cache[cache_key]

@router.post("/{ticket_id}/approve", response_model=HumanApprovalResponse)
async def approve_ai_action(
    ticket_id: str,
    request: HumanApprovalRequest,
    current_user = Depends(get_current_user),
    ai_agent = Depends(get_ai_agent),
    ticket_service: TicketService = Depends(get_ticket_service),
):
    try:
        approval = await ticket_service.get_approval_request(request.approval_id)
        if not approval or approval.get("ticket_id") != ticket_id:
            raise HTTPException(status_code=404, detail="Approval request not found")

        result = await ticket_service.process_human_approval(
            ticket_id=ticket_id,
            approval_id=request.approval_id,
            approved=request.approved,
            reason=request.reason,
            approved_by=current_user.get("id") if isinstance(current_user, dict) else None
        )

        if request.approved and approval.get("plan_id") and ai_agent:
            try:
                cont = await ai_agent.approve_action(
                    plan_id=approval["plan_id"],
                    approved=True,
                    reason=request.reason or "Human approved"
                )
                result["ai_continuation"] = cont
            except Exception as e:
                logger.error("AI continuation failed after approval", error=str(e))

        return HumanApprovalResponse(
            approval_id=request.approval_id,
            ticket_id=ticket_id,
            approved=request.approved,
            processed_at=result["processed_at"],
            result=result
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Approval processing failed", error=str(e))
        raise HTTPException(status_code=500, detail={"error":"Approval processing failed","message":str(e)})

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    current_user = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service),
):
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
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user),
    ticket_service: TicketService = Depends(get_ticket_service),
):
    try:
        return await ticket_service.list_tickets(
            status=status,
            category=category,
            priority=priority,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error("❌ Ticket listing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list tickets")