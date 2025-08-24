"""Ticket Service with Prisma"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import structlog

from ..config.database import get_prisma
from ..models.schemas import ApprovalStatus  # enum for response mapping

logger = structlog.get_logger(__name__)


class TicketService:
    """Service for managing customer support tickets with Prisma"""

    def __init__(self) -> None:
        pass

    # -----------------------------
    # Helpers
    # -----------------------------
    def _safe_get(self, obj: Any, key: str, default: Any = None) -> Any:
        """Safely get a value from dict or attr-based object."""
        if obj is None:
            return default
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    def _json_safe(self, obj: Any) -> Any:
        """Ensure metadata is JSON-serializable for Prisma Json fields."""
        try:
            return json.loads(json.dumps(obj, default=str))
        except Exception:
            return None

    def _approval_to_dict(self, approval: Any) -> Dict[str, Any]:
        """Normalize Approval model to response shape with enum status."""
        status_str = self._safe_get(approval, 'status') or "PENDING"
        try:
            status_enum = ApprovalStatus(status_str)
        except Exception:
            status_enum = ApprovalStatus.PENDING

        return {
            "id": self._safe_get(approval, 'id'),
            "ticket_id": self._safe_get(approval, 'ticket_id'),
            "action_type": self._safe_get(approval, 'action_type'),
            "ai_suggestion": self._safe_get(approval, 'ai_suggestion'),
            "status": status_enum,
            "approved_by": self._safe_get(approval, 'approved_by'),
            "reason": self._safe_get(approval, 'reason'),
            "created_at": self._safe_get(approval, 'created_at'),
            "decided_at": self._safe_get(approval, 'decided_at'),
        }

    # -----------------------------
    # Ticket lifecycle
    # -----------------------------
    async def create_or_update_ticket(
        self,
        customer_email: str,
        subject: str,
        query: str,
        source: str = "api",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new ticket and initial customer conversation."""
        try:
            prisma = get_prisma()

            # Ensure customer exists
            customer = await prisma.customer.find_unique(where={"email": customer_email})
            if not customer:
                customer = await prisma.customer.create(
                    data={
                        "email": customer_email,
                        "name": (metadata or {}).get("name"),
                    }
                )

            customer_id = self._safe_get(customer, 'id')
            if not customer_id:
                raise ValueError("Failed to resolve customer_id")

            # Create ticket
            ticket = await prisma.ticket.create(
                data={
                    "subject": subject,
                    "customer_id": customer_id,
                    "source": source,
                    "status": "OPEN",
                    "priority": "MEDIUM",
                }
            )
            ticket_id = self._safe_get(ticket, 'id')
            if not ticket_id:
                raise ValueError("Failed to resolve ticket_id")

            # Initial customer message
            await prisma.conversation.create(
                data={
                    "ticket_id": ticket_id,
                    "customer_id": customer_id,
                    "content": query,
                    "role": "CUSTOMER",
                }
            )

            logger.info("✅ Ticket created with Prisma", ticket_id=ticket_id)

            return {
                "id": ticket_id,
                "subject": self._safe_get(ticket, 'subject'),
                "status": self._safe_get(ticket, 'status'),
                "priority": self._safe_get(ticket, 'priority'),
                "customer_email": self._safe_get(customer, 'email'),
                "created_at": self._safe_get(ticket, 'created_at'),
            }
        except Exception as e:
            logger.error("❌ Ticket creation failed", error=str(e))
            raise

    async def update_ticket_with_ai_result(
        self,
        ticket_id: str,
        ai_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update ticket fields using AI classification result."""
        try:
            prisma = get_prisma()
            update_data: Dict[str, Any] = {"updated_at": datetime.utcnow()}

            cls = (ai_result or {}).get("classification") or {}

            if cls.get("category"):
                update_data["category"] = cls["category"]

            if cls.get("priority"):
                # Enum in DB expects uppercase constants
                update_data["priority"] = str(cls["priority"]).upper()

            # Try top-level confidence, fallback to classification.confidence
            conf = ai_result.get("confidence")
            if conf is None:
                conf = cls.get("confidence")
            try:
                if conf is not None:
                    update_data["ai_confidence"] = float(conf)
            except Exception:
                pass

            updated_ticket = await prisma.ticket.update(
                where={"id": ticket_id},
                data=update_data
            )

            logger.info(
                "✅ Ticket updated with AI results",
                ticket_id=ticket_id,
                category=update_data.get("category"),
                priority=update_data.get("priority"),
            )

            return {
                "id": self._safe_get(updated_ticket, 'id'),
                "status": self._safe_get(updated_ticket, 'status'),
                "priority": self._safe_get(updated_ticket, 'priority'),
                "category": self._safe_get(updated_ticket, 'category'),
            }
        except Exception as e:
            logger.error("❌ Ticket AI update failed", ticket_id=ticket_id, error=str(e))
            raise

    # -----------------------------
    # Approvals
    # -----------------------------
    async def create_approval_request(
        self,
        ticket_id: str,
        ai_suggestion: str,
        action_type: str,
        metadata: Dict[str, Any]
    ) -> str:
        """Create an approval request connected to the ticket via scalar FK.

        Notes:
        - We intentionally omit `metadata` because some prisma-client-py versions
          throw a union/Json error when empty or mismatched.
        - Schema in your project requires `ticket_id` (scalar FK), so we set it directly.
        """
        try:
            prisma = get_prisma()

            payload: Dict[str, Any] = {
                "ticket_id": ticket_id,                    # set scalar FK directly (required)
                "ai_suggestion": ai_suggestion or "",
                "action_type": action_type or "general",
                "status": "PENDING",
                "plan_id": (metadata or {}).get("plan_id"),
            }

            # Do NOT include 'metadata' to avoid Json union issues observed in logs.

            approval = await prisma.approval.create(data=payload)
            approval_id = self._safe_get(approval, 'id')
            logger.info("✅ Approval request created", ticket_id=ticket_id, approval_id=approval_id)
            return approval_id
        except Exception as e:
            logger.error("❌ Approval creation failed", error=str(e))
            raise

    async def get_approval_request(self, approval_id: str) -> Optional[Dict[str, Any]]:
        """Fetch approval by id."""
        prisma = get_prisma()
        approval = await prisma.approval.find_unique(where={"id": approval_id})
        if not approval:
            return None
        return {
            "id": self._safe_get(approval, 'id'),
            "ticket_id": self._safe_get(approval, 'ticket_id'),
            "plan_id": self._safe_get(approval, 'plan_id'),
            "status": self._safe_get(approval, 'status'),
        }

    async def process_human_approval(
        self,
        ticket_id: str,
        approval_id: str,
        approved: bool,
        reason: Optional[str],
        approved_by: Optional[str]
    ) -> Dict[str, Any]:
        """Approve or reject an approval request."""
        prisma = get_prisma()
        new_status = "APPROVED" if approved else "REJECTED"
        decided_at = datetime.utcnow()

        await prisma.approval.update(
            where={"id": approval_id},
            data={
                "status": new_status,
                "reason": reason,
                "approved_by": approved_by,
                "decided_at": decided_at,
            }
        )
        return {"processed_at": decided_at, "status": new_status}

    # -----------------------------
    # Retrieval
    # -----------------------------
    async def get_ticket_by_id(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Get a ticket with relations; sort conversations in Python to avoid nested order schema issues."""
        try:
            prisma = get_prisma()
            ticket = await prisma.ticket.find_unique(
                where={"id": ticket_id},
                include={
                    "customer": True,
                    "conversations": True,  # sort in Python
                    "approvals": True,
                }
            )
            if not ticket:
                return None

            approvals = [
                self._approval_to_dict(a)
                for a in (self._safe_get(ticket, 'approvals') or [])
            ]

            convs = self._safe_get(ticket, 'conversations') or []
            # Sort by created_at ascending safely
            convs = sorted(
                convs,
                key=lambda c: self._safe_get(c, 'created_at') or datetime.min
            )

            return {
                "id": self._safe_get(ticket, 'id'),
                "subject": self._safe_get(ticket, 'subject'),
                "status": self._safe_get(ticket, 'status'),
                "priority": self._safe_get(ticket, 'priority'),
                "category": self._safe_get(ticket, 'category'),
                "source": self._safe_get(ticket, 'source'),
                "customer_id": self._safe_get(ticket, 'customer_id'),
                "assigned_to": self._safe_get(ticket, 'assigned_to'),
                "resolved_by": self._safe_get(ticket, 'resolved_by'),
                "created_at": self._safe_get(ticket, 'created_at'),
                "updated_at": self._safe_get(ticket, 'updated_at'),
                "resolved_at": self._safe_get(ticket, 'resolved_at'),
                "customer": {
                    "id": self._safe_get(ticket.customer, 'id') if ticket.customer else None,
                    "email": self._safe_get(ticket.customer, 'email') if ticket.customer else None,
                    "name": self._safe_get(ticket.customer, 'name') if ticket.customer else None,
                    "phone": self._safe_get(ticket.customer, 'phone') if ticket.customer else None,
                    "company": self._safe_get(ticket.customer, 'company') if ticket.customer else None,
                    "segment": self._safe_get(ticket.customer, 'segment') if ticket.customer else None,
                    "created_at": self._safe_get(ticket.customer, 'created_at') if ticket.customer else None,
                    "updated_at": self._safe_get(ticket.customer, 'updated_at') if ticket.customer else None,
                } if ticket.customer else None,
                "conversations": [
                    {
                        "id": self._safe_get(c, 'id'),
                        "ticket_id": self._safe_get(c, 'ticket_id'),
                        "customer_id": self._safe_get(c, 'customer_id'),
                        "content": self._safe_get(c, 'content'),
                        "role": self._safe_get(c, 'role'),
                        "metadata": self._safe_get(c, 'metadata'),
                        "created_at": self._safe_get(c, 'created_at'),
                    }
                    for c in convs
                ],
                "approvals": approvals,
            }
        except Exception as e:
            logger.error("❌ Ticket retrieval failed", error=str(e), ticket_id=ticket_id)
            raise

    async def list_tickets(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List tickets with optional filters; includes lightweight customer info."""
        try:
            prisma = get_prisma()
            where: Dict[str, Any] = {}
            if status:
                where["status"] = status.upper()
            if category:
                where["category"] = category
            if priority:
                where["priority"] = priority.upper()

            tickets = await prisma.ticket.find_many(
                where=where,
                include={"customer": True},
                order={"created_at": "desc"},
                take=limit,
                skip=offset,
            )

            results: List[Dict[str, Any]] = []
            for t in tickets:
                results.append({
                    "id": self._safe_get(t, 'id'),
                    "subject": self._safe_get(t, 'subject'),
                    "status": self._safe_get(t, 'status'),
                    "priority": self._safe_get(t, 'priority'),
                    "category": self._safe_get(t, 'category'),
                    "source": self._safe_get(t, 'source'),
                    "customer_id": self._safe_get(t, 'customer_id'),
                    "assigned_to": self._safe_get(t, 'assigned_to'),
                    "resolved_by": self._safe_get(t, 'resolved_by'),
                    "created_at": self._safe_get(t, 'created_at'),
                    "updated_at": self._safe_get(t, 'updated_at'),
                    "resolved_at": self._safe_get(t, 'resolved_at'),
                    "customer": {
                        "id": self._safe_get(t.customer, 'id') if t.customer else None,
                        "email": self._safe_get(t.customer, 'email') if t.customer else None,
                        "name": self._safe_get(t.customer, 'name') if t.customer else None,
                        "phone": self._safe_get(t.customer, 'phone') if t.customer else None,
                        "company": self._safe_get(t.customer, 'company') if t.customer else None,
                        "segment": self._safe_get(t.customer, 'segment') if t.customer else None,
                        "created_at": self._safe_get(t.customer, 'created_at') if t.customer else None,
                        "updated_at": self._safe_get(t.customer, 'updated_at') if t.customer else None,
                    } if t.customer else None,
                    # Keep list lightweight
                    "conversations": None,
                    "approvals": None,
                })
            return results
        except Exception as e:
            logger.error("❌ Ticket listing failed", error=str(e))
            raise