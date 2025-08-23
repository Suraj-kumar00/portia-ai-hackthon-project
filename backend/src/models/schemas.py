"""Pydantic schemas for API request/response models"""
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from enum import Enum

# Enums
class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_APPROVAL = "WAITING_APPROVAL"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class Role(str, Enum):
    CUSTOMER = "CUSTOMER"
    AGENT = "AGENT"
    AI_AGENT = "AI_AGENT"
    SYSTEM = "SYSTEM"

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# Request Models
class ProcessQueryRequest(BaseModel):
    customer_email: EmailStr = Field(..., description="Customer email address")
    query: str = Field(..., min_length=1, max_length=5000, description="Customer query")
    subject: Optional[str] = Field(None, max_length=200, description="Ticket subject")
    source: Optional[str] = Field("api", description="Query source channel")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class HumanApprovalRequest(BaseModel):
    approval_id: str = Field(..., description="Approval request ID")
    approved: bool = Field(..., description="Approval decision")
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for decision")

class TicketCreate(BaseModel):
    customer_email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    priority: Optional[Priority] = Field(Priority.MEDIUM)
    category: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field("api")

class TicketUpdate(BaseModel):
    subject: Optional[str] = Field(None, max_length=200)
    status: Optional[TicketStatus] = None
    priority: Optional[Priority] = None
    category: Optional[str] = Field(None, max_length=50)
    assigned_to: Optional[str] = None
    resolved_by: Optional[str] = None

class ConversationCreate(BaseModel):
    ticket_id: str = Field(..., description="Associated ticket ID")
    customer_id: str = Field(..., description="Customer ID")
    content: str = Field(..., min_length=1, max_length=5000)
    role: Role = Field(..., description="Message sender role")
    metadata: Optional[Dict[str, Any]] = None

class ConversationUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=5000)
    metadata: Optional[Dict[str, Any]] = None

# Response Models
class CustomerResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    segment: Optional[str]
    created_at: datetime
    updated_at: datetime

class ConversationResponse(BaseModel):
    id: str
    ticket_id: str
    customer_id: str
    content: str
    role: Role
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

class ApprovalResponse(BaseModel):
    id: str
    ticket_id: str
    action_type: str
    ai_suggestion: str
    status: ApprovalStatus
    approved_by: Optional[str]
    reason: Optional[str]
    created_at: datetime
    decided_at: Optional[datetime]

class TicketResponse(BaseModel):
    id: str
    subject: str
    status: TicketStatus
    priority: Priority
    category: Optional[str]
    source: str
    customer_id: str
    assigned_to: Optional[str]
    resolved_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    
    # Related data
    customer: Optional[CustomerResponse]
    conversations: Optional[List[ConversationResponse]]
    approvals: Optional[List[ApprovalResponse]]

# ✅ FIXED: Enhanced Classification Model to handle mixed types
class ClassificationModel(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = None
    urgency: Optional[str] = None
    sentiment: Optional[str] = None
    cloud_enhanced: Optional[Union[str, bool]] = None  # ✅ Accept both string and bool
    confidence: Optional[float] = None
    
    @validator('cloud_enhanced')
    def convert_cloud_enhanced_to_string(cls, v):
        """Convert boolean cloud_enhanced to string"""
        if isinstance(v, bool):
            return str(v).lower()  # True -> "true", False -> "false"
        return v
    
    @validator('confidence')
    def validate_confidence(cls, v):
        """Ensure confidence is between 0 and 1"""
        if v is not None and (v < 0 or v > 1):
            return max(0, min(1, v))  # Clamp between 0 and 1
        return v

# ✅ FIXED: Enhanced ProcessQueryResponse with flexible classification
class ProcessQueryResponse(BaseModel):
    request_id: str
    ticket_id: str
    plan_id: Optional[str] = None
    status: str
    ai_response: str
    classification: Optional[Union[ClassificationModel, Dict[str, Any]]] = None  # ✅ Accept both model and dict
    requires_human_approval: bool = False
    approval_id: Optional[str] = None
    suggested_actions: List[Dict[str, Any]] = []
    processing_time_ms: Optional[float] = None
    
    @validator('classification', pre=True)
    def convert_classification(cls, v):
        """Convert dict classification to ClassificationModel"""
        if isinstance(v, dict):
            # Handle cloud_enhanced boolean conversion
            if 'cloud_enhanced' in v and isinstance(v['cloud_enhanced'], bool):
                v['cloud_enhanced'] = str(v['cloud_enhanced']).lower()
            return ClassificationModel(**v)
        return v
    
    class Config:
        from_attributes = True

class HumanApprovalResponse(BaseModel):
    approval_id: str
    ticket_id: str
    approved: bool
    processed_at: datetime
    result: Dict[str, Any]

class AnalyticsResponse(BaseModel):
    total_tickets: int
    tickets_today: int
    open_tickets: int
    pending_approvals: int
    ai_resolved_tickets: int
    avg_response_time_minutes: float
    customer_satisfaction: float
    ai_automation_rate: float

class MetricsResponse(BaseModel):
    timestamp: datetime
    tickets_last_hour: int
    active_conversations: int
    pending_approvals: int
    system_status: str
    ai_agent_status: str

class PerformanceReport(BaseModel):
    period: Dict[str, str]
    summary: Dict[str, Any]
    breakdowns: Dict[str, Dict[str, int]]
    trends: Dict[str, List[Any]]

# AI Agent Models
class AIClassification(BaseModel):
    category: str
    urgency: str
    sentiment: str
    confidence_score: Optional[float]

class AISuggestedAction(BaseModel):
    action_type: str
    description: str
    requires_approval: bool
    confidence_score: float
    parameters: Optional[Dict[str, Any]]

class AIAgentResponse(BaseModel):
    plan_id: str
    response_text: str
    classification: AIClassification
    suggested_actions: List[AISuggestedAction]
    requires_human_approval: bool
    processing_time_ms: float
    metadata: Optional[Dict[str, Any]]

# Error Models
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None

class ValidationErrorResponse(BaseModel):
    error: str = "validation_error"
    message: str
    field_errors: Dict[str, List[str]]