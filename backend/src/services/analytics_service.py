"""Analytics and metrics service"""
from typing import Dict, Any
from datetime import datetime, timedelta
import structlog

from ..config.database import get_prisma  # correct single-level relative import

logger = structlog.get_logger(__name__)


class AnalyticsService:
    """Service for analytics and performance metrics"""

    def __init__(self) -> None:
        # No Prisma in constructor; grab it when needed
        pass

    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get main dashboard metrics from the database"""
        try:
            prisma = get_prisma()

            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = now - timedelta(days=7)

            total_tickets = await prisma.ticket.count()
            tickets_today = await prisma.ticket.count(where={"created_at": {"gte": today_start}})
            open_tickets = await prisma.ticket.count(where={"status": "OPEN"})
            pending_approvals = await prisma.humanapproval.count(where={"status": "PENDING"})
            ai_resolved = await prisma.conversation.count(
                where={"role": "AI_AGENT", "created_at": {"gte": week_ago}}
            )

            metrics = {
                "total_tickets": total_tickets,
                "tickets_today": tickets_today,
                "open_tickets": open_tickets,
                "pending_approvals": pending_approvals,
                "ai_resolved_tickets": ai_resolved,
                "avg_response_time_minutes": 15.5,  # replace with real calc when ready
                "customer_satisfaction": 4.2,       # replace with real survey data if available
                "ai_automation_rate": round((ai_resolved / max(total_tickets, 1)) * 100, 1),
            }
            logger.info("Dashboard metrics calculated", metrics=metrics)
            return metrics

        except Exception as e:
            logger.error("Dashboard metrics calculation failed", error=str(e))
            raise

    async def get_ai_performance_metrics(self) -> Dict[str, Any]:
        """Get AI agent performance metrics from the database"""
        try:
            prisma = get_prisma()
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)

            ai_conversations = await prisma.conversation.count(
                where={"role": "AI_AGENT", "created_at": {"gte": thirty_days_ago}}
            )
            successful_automations = await prisma.humanapproval.count(
                where={"status": "APPROVED", "created_at": {"gte": thirty_days_ago}}
            )
            failed_automations = await prisma.humanapproval.count(
                where={"status": "REJECTED", "created_at": {"gte": thirty_days_ago}}
            )

            total_automations = successful_automations + failed_automations
            success_rate = round((successful_automations / max(total_automations, 1)) * 100, 1)

            metrics = {
                "ai_conversations": ai_conversations,
                "successful_automations": successful_automations,
                "failed_automations": failed_automations,
                "automation_success_rate": success_rate,
                "avg_confidence_score": 0.87,  # placeholder until you compute from data
                "most_common_actions": [
                    {"action": "send_email", "count": 45},
                    {"action": "escalate_ticket", "count": 23},
                    {"action": "process_refund", "count": 12},
                ],
            }
            logger.info("AI performance metrics calculated", metrics=metrics)
            return metrics

        except Exception as e:
            logger.error("AI performance metrics calculation failed", error=str(e))
            raise
