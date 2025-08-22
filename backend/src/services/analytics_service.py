"""Analytics and metrics service"""
from typing import Dict, Any, List, Optional
from prisma import Prisma
from datetime import datetime, timedelta
import structlog

logger = structlog.get_logger(__name__)

class AnalyticsService:
    """Service for analytics and performance metrics"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get main dashboard metrics"""
        
        try:
            # Get current date range
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = now - timedelta(days=7)
            
            # Total tickets
            total_tickets = await self.db.ticket.count()
            
            # Tickets today
            tickets_today = await self.db.ticket.count(
                where={"created_at": {"gte": today_start}}
            )
            
            # Open tickets
            open_tickets = await self.db.ticket.count(
                where={"status": "OPEN"}
            )
            
            # Pending approvals
            pending_approvals = await self.db.humanapproval.count(
                where={"status": "PENDING"}
            )
            
            # AI resolved tickets (last week)
            ai_resolved = await self.db.conversation.count(
                where={
                    "role": "AI_AGENT",
                    "created_at": {"gte": week_ago}
                }
            )
            
            # Average response time (mock calculation)
            avg_response_time = 15.5  # minutes
            
            # Customer satisfaction (mock)
            customer_satisfaction = 4.2  # out of 5
            
            metrics = {
                "total_tickets": total_tickets,
                "tickets_today": tickets_today,
                "open_tickets": open_tickets,
                "pending_approvals": pending_approvals,
                "ai_resolved_tickets": ai_resolved,
                "avg_response_time_minutes": avg_response_time,
                "customer_satisfaction": customer_satisfaction,
                "ai_automation_rate": round((ai_resolved / max(total_tickets, 1)) * 100, 1)
            }
            
            logger.info("Dashboard metrics calculated", metrics=metrics)
            return metrics
            
        except Exception as e:
            logger.error("Dashboard metrics calculation failed", error=str(e))
            raise
    
    async def get_performance_report(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate performance report for date range"""
        
        try:
            # Tickets in date range
            tickets = await self.db.ticket.find_many(
                where={
                    "created_at": {
                        "gte": start_date,
                        "lte": end_date
                    }
                },
                include={"conversations": True}
            )
            
            # Calculate metrics
            total_tickets = len(tickets)
            resolved_tickets = len([t for t in tickets if t.status == "RESOLVED"])
            avg_resolution_time = 24.5  # hours (mock calculation)
            
            # Tickets by category
            category_breakdown = {}
            for ticket in tickets:
                category = ticket.category or "uncategorized"
                category_breakdown[category] = category_breakdown.get(category, 0) + 1
            
            # Tickets by priority
            priority_breakdown = {}
            for ticket in tickets:
                priority = ticket.priority or "MEDIUM"
                priority_breakdown[priority] = priority_breakdown.get(priority, 0) + 1
            
            report = {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "summary": {
                    "total_tickets": total_tickets,
                    "resolved_tickets": resolved_tickets,
                    "resolution_rate": round((resolved_tickets / max(total_tickets, 1)) * 100, 1),
                    "avg_resolution_time_hours": avg_resolution_time
                },
                "breakdowns": {
                    "by_category": category_breakdown,
                    "by_priority": priority_breakdown
                },
                "trends": {
                    "daily_ticket_volume": [],  # Would calculate daily volumes
                    "resolution_time_trend": []  # Would calculate daily resolution times
                }
            }
            
            logger.info("Performance report generated", 
                       period_days=(end_date - start_date).days,
                       total_tickets=total_tickets)
            
            return report
            
        except Exception as e:
            logger.error("Performance report generation failed", error=str(e))
            raise
    
    async def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get real-time system metrics"""
        
        try:
            now = datetime.utcnow()
            last_hour = now - timedelta(hours=1)
            
            # Tickets in last hour
            recent_tickets = await self.db.ticket.count(
                where={"created_at": {"gte": last_hour}}
            )
            
            # Active conversations
            active_conversations = await self.db.conversation.count(
                where={"created_at": {"gte": last_hour}}
            )
            
            # Pending approvals
            pending_approvals = await self.db.humanapproval.count(
                where={"status": "PENDING"}
            )
            
            metrics = {
                "timestamp": now.isoformat(),
                "tickets_last_hour": recent_tickets,
                "active_conversations": active_conversations,
                "pending_approvals": pending_approvals,
                "system_status": "healthy",
                "ai_agent_status": "active"
            }
            
            return metrics
            
        except Exception as e:
            logger.error("Real-time metrics retrieval failed", error=str(e))
            raise
    
    async def get_ai_performance_metrics(self) -> Dict[str, Any]:
        """Get AI agent performance metrics"""
        
        try:
            # AI conversations in last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            ai_conversations = await self.db.conversation.count(
                where={
                    "role": "AI_AGENT",
                    "created_at": {"gte": thirty_days_ago}
                }
            )
            
            # Successful automations (approved actions)
            successful_automations = await self.db.humanapproval.count(
                where={
                    "status": "APPROVED",
                    "created_at": {"gte": thirty_days_ago}
                }
            )
            
            # Failed automations (rejected actions)
            failed_automations = await self.db.humanapproval.count(
                where={
                    "status": "REJECTED",
                    "created_at": {"gte": thirty_days_ago}
                }
            )
            
            total_automations = successful_automations + failed_automations
            success_rate = round(
                (successful_automations / max(total_automations, 1)) * 100, 1
            )
            
            metrics = {
                "ai_conversations": ai_conversations,
                "successful_automations": successful_automations,
                "failed_automations": failed_automations,
                "automation_success_rate": success_rate,
                "avg_confidence_score": 0.87,  # Mock value
                "most_common_actions": [
                    {"action": "send_email", "count": 45},
                    {"action": "escalate_ticket", "count": 23},
                    {"action": "process_refund", "count": 12}
                ]
            }
            
            logger.info("AI performance metrics calculated", metrics=metrics)
            return metrics
            
        except Exception as e:
            logger.error("AI performance metrics calculation failed", error=str(e))
            raise
    
    async def get_satisfaction_metrics(self, period: str) -> Dict[str, Any]:
        """Get customer satisfaction metrics"""
        
        try:
            # Calculate date range based on period
            now = datetime.utcnow()
            if period == "week":
                start_date = now - timedelta(days=7)
            elif period == "month":
                start_date = now - timedelta(days=30)
            elif period == "quarter":
                start_date = now - timedelta(days=90)
            else:
                start_date = now - timedelta(days=30)
            
            # Mock satisfaction data (in real implementation, this would come from surveys)
            satisfaction_metrics = {
                "period": period,
                "average_rating": 4.2,
                "total_responses": 156,
                "rating_distribution": {
                    "5": 78,
                    "4": 45,
                    "3": 23,
                    "2": 7,
                    "1": 3
                },
                "nps_score": 67,
                "improvement_areas": [
                    "Response time",
                    "Technical knowledge", 
                    "Follow-up communication"
                ]
            }
            
            logger.info("Satisfaction metrics calculated", 
                       period=period,
                       avg_rating=satisfaction_metrics["average_rating"])
            
            return satisfaction_metrics
            
        except Exception as e:
            logger.error("Satisfaction metrics calculation failed", error=str(e))
            raise
    
    async def get_resolution_time_trends(self, days: int) -> Dict[str, Any]:
        """Get resolution time trends"""
        
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Mock trend data (would calculate actual trends in real implementation)
            trends = {
                "period_days": days,
                "average_resolution_time_hours": 18.5,
                "trend_direction": "decreasing",
                "improvement_percentage": 12.3,
                "daily_averages": [
                    {"date": "2025-08-16", "avg_hours": 22.1},
                    {"date": "2025-08-17", "avg_hours": 19.8},
                    {"date": "2025-08-18", "avg_hours": 17.5},
                    {"date": "2025-08-19", "avg_hours": 16.2},
                    {"date": "2025-08-20", "avg_hours": 15.8}
                ]
            }
            
            logger.info("Resolution time trends calculated", 
                       days=days,
                       avg_hours=trends["average_resolution_time_hours"])
            
            return trends
            
        except Exception as e:
            logger.error("Resolution time trends calculation failed", error=str(e))
            raise