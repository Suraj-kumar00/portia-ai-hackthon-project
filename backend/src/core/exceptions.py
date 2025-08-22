"""Custom exception classes"""
from typing import Dict, Any, Optional

class CustomerSupportException(Exception):
    """Base exception for customer support API"""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class TicketNotFoundError(CustomerSupportException):
    """Ticket not found exception"""
    
    def __init__(self, ticket_id: str):
        super().__init__(
            f"Ticket {ticket_id} not found",
            error_code="TICKET_NOT_FOUND",
            details={"ticket_id": ticket_id}
        )

class CustomerNotFoundError(CustomerSupportException):
    """Customer not found exception"""
    
    def __init__(self, customer_email: str):
        super().__init__(
            f"Customer {customer_email} not found",
            error_code="CUSTOMER_NOT_FOUND",
            details={"customer_email": customer_email}
        )

class AIAgentError(CustomerSupportException):
    """AI agent processing error"""
    
    def __init__(self, message: str, plan_id: Optional[str] = None):
        super().__init__(
            f"AI agent error: {message}",
            error_code="AI_AGENT_ERROR",
            details={"plan_id": plan_id} if plan_id else {}
        )

class ApprovalNotFoundError(CustomerSupportException):
    """Approval request not found exception"""
    
    def __init__(self, approval_id: str):
        super().__init__(
            f"Approval request {approval_id} not found",
            error_code="APPROVAL_NOT_FOUND", 
            details={"approval_id": approval_id}
        )

class InvalidApprovalStateError(CustomerSupportException):
    """Invalid approval state exception"""
    
    def __init__(self, approval_id: str, current_state: str):
        super().__init__(
            f"Approval {approval_id} is in invalid state: {current_state}",
            error_code="INVALID_APPROVAL_STATE",
            details={
                "approval_id": approval_id,
                "current_state": current_state
            }
        )

class AuthenticationError(CustomerSupportException):
    """Authentication error"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message,
            error_code="AUTHENTICATION_ERROR"
        )

class AuthorizationError(CustomerSupportException):
    """Authorization error"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message,
            error_code="AUTHORIZATION_ERROR"
        )

class ValidationError(CustomerSupportException):
    """Validation error"""
    
    def __init__(self, field: str, message: str):
        super().__init__(
            f"Validation error for field '{field}': {message}",
            error_code="VALIDATION_ERROR",
            details={"field": field, "validation_message": message}
        )

class RateLimitError(CustomerSupportException):
    """Rate limit exceeded error"""
    
    def __init__(self, limit: int, window_seconds: int):
        super().__init__(
            f"Rate limit exceeded: {limit} requests per {window_seconds} seconds",
            error_code="RATE_LIMIT_EXCEEDED",
            details={
                "limit": limit,
                "window_seconds": window_seconds
            }
        )

class ExternalServiceError(CustomerSupportException):
    """External service integration error"""
    
    def __init__(self, service: str, message: str):
        super().__init__(
            f"External service error ({service}): {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service}
        )

class DatabaseError(CustomerSupportException):
    """Database operation error"""
    
    def __init__(self, operation: str, message: str):
        super().__init__(
            f"Database error during {operation}: {message}",
            error_code="DATABASE_ERROR",
            details={"operation": operation}
        )

# Exception handler for FastAPI
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger(__name__)

async def customer_support_exception_handler(
    request: Request, 
    exc: CustomerSupportException
) -> JSONResponse:
    """Custom exception handler for CustomerSupportException"""
    
    logger.error("Customer support exception", 
                error_code=exc.error_code,
                message=exc.message,
                details=exc.details,
                path=request.url.path)
    
    status_code = 400
    if exc.error_code in ["AUTHENTICATION_ERROR"]:
        status_code = 401
    elif exc.error_code in ["AUTHORIZATION_ERROR"]:
        status_code = 403
    elif exc.error_code in ["TICKET_NOT_FOUND", "CUSTOMER_NOT_FOUND", "APPROVAL_NOT_FOUND"]:
        status_code = 404
    elif exc.error_code in ["RATE_LIMIT_EXCEEDED"]:
        status_code = 429
    elif exc.error_code in ["AI_AGENT_ERROR", "DATABASE_ERROR", "EXTERNAL_SERVICE_ERROR"]:
        status_code = 500
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.error_code or "UNKNOWN_ERROR",
            "message": exc.message,
            "details": exc.details
        }
    )