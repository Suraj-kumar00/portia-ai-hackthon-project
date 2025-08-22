"""
Custom Portia Tool for Ticket Management
Following Portia AI tool development patterns
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import structlog

from portia import Tool

logger = structlog.get_logger(__name__)

class TicketCreateInput(BaseModel):
    customer_email: str = Field(description="Customer email address")
    subject: str = Field(description="Ticket subject")
    description: str = Field(description="Detailed description of the issue")
    priority: str = Field(default="medium", description="Priority level: low, medium, high, urgent")
    category: str = Field(default="general", description="Issue category")

class TicketUpdateInput(BaseModel):
    ticket_id: str = Field(description="Ticket ID to update")
    status: Optional[str] = Field(default=None, description="New ticket status")
    assignee: Optional[str] = Field(default=None, description="Assign ticket to agent")
    notes: Optional[str] = Field(default=None, description="Internal notes to add")

class TicketSearchInput(BaseModel):
    customer_email: Optional[str] = Field(default=None, description="Filter by customer email")
    status: Optional[str] = Field(default=None, description="Filter by status")
    category: Optional[str] = Field(default=None, description="Filter by category")
    limit: int = Field(default=10, description="Maximum number of results")

class TicketTool(Tool):
    """Custom Portia tool for managing customer support tickets"""
    
    name = "ticket_tool"
    description = "Create, update, and search customer support tickets in the system"
    
    def __init__(self):
        super().__init__()
        logger.info("TicketTool initialized")
    
    async def create_ticket(self, input_data: TicketCreateInput) -> Dict[str, Any]:
        """Create a new customer support ticket"""
        
        try:
            # This would integrate with your actual database/ticket system
            # For now, we'll simulate ticket creation
            
            ticket = {
                "id": f"ticket_{hash(input_data.customer_email)}",
                "customer_email": input_data.customer_email,
                "subject": input_data.subject,
                "description": input_data.description,
                "priority": input_data.priority,
                "category": input_data.category,
                "status": "open",
                "created_at": "2025-08-23T10:00:00Z",
                "updated_at": "2025-08-23T10:00:00Z"
            }
            
            logger.info("Ticket created", ticket_id=ticket["id"])
            
            return {
                "success": True,
                "ticket": ticket,
                "message": f"Ticket {ticket['id']} created successfully"
            }
            
        except Exception as e:
            logger.error("Ticket creation failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create ticket"
            }
    
    async def update_ticket(self, input_data: TicketUpdateInput) -> Dict[str, Any]:
        """Update an existing ticket"""
        
        try:
            # This would update the actual ticket in your system
            
            updates = {}
            if input_data.status:
                updates["status"] = input_data.status
            if input_data.assignee:
                updates["assignee"] = input_data.assignee
            if input_data.notes:
                updates["notes"] = input_data.notes
            
            updates["updated_at"] = "2025-08-23T10:05:00Z"
            
            logger.info("Ticket updated", 
                       ticket_id=input_data.ticket_id, 
                       updates=updates)
            
            return {
                "success": True,
                "ticket_id": input_data.ticket_id,
                "updates": updates,
                "message": "Ticket updated successfully"
            }
            
        except Exception as e:
            logger.error("Ticket update failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update ticket"
            }
    
    async def search_tickets(self, input_data: TicketSearchInput) -> Dict[str, Any]:
        """Search for tickets based on criteria"""
        
        try:
            # This would query your actual ticket database
            
            # Simulate search results
            tickets = [
                {
                    "id": "ticket_123",
                    "customer_email": input_data.customer_email or "customer@example.com",
                    "subject": "Sample ticket",
                    "status": input_data.status or "open",
                    "category": input_data.category or "general",
                    "created_at": "2025-08-23T09:00:00Z"
                }
            ]
            
            logger.info("Tickets searched", 
                       filters=input_data.dict(exclude_unset=True),
                       result_count=len(tickets))
            
            return {
                "success": True,
                "tickets": tickets,
                "total_count": len(tickets),
                "message": f"Found {len(tickets)} tickets"
            }
            
        except Exception as e:
            logger.error("Ticket search failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to search tickets"
            }
    
    async def call(self, action: str, **kwargs) -> Dict[str, Any]:
        """Main tool entry point - called by Portia"""
        
        if action == "create":
            input_data = TicketCreateInput(**kwargs)
            return await self.create_ticket(input_data)
            
        elif action == "update":
            input_data = TicketUpdateInput(**kwargs)
            return await self.update_ticket(input_data)
            
        elif action == "search":
            input_data = TicketSearchInput(**kwargs)
            return await self.search_tickets(input_data)
            
        else:
            return {
                "success": False,
                "error": f"Unknown action: {action}",
                "message": "Supported actions: create, update, search"
            }