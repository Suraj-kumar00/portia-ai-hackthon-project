"""
Customer Support AI Agent using Portia AI SDK with Gemini
Based on: https://docs.portialabs.ai/SDK/portia
"""
import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
import structlog

from portia import (
    Config,
    LLMProvider, 
    Portia,
    DefaultToolRegistry,
    LLMTool
)

from .tools.email_tool import EmailTool
from .tools.slack_tool import SlackTool
from .tools.ticket_tool import TicketTool
from .tools.knowledge_base_tool import KnowledgeBaseTool

load_dotenv()

logger = structlog.get_logger(__name__)

class CustomerSupportAgent:
    """
    AI-powered customer support agent using Portia with Gemini.
    Handles customer queries with human-in-the-loop approval workflow.
    """
    
    def __init__(self):
        self.google_api_key = os.getenv('GOOGLE_API_KEY')
        if not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        # Create Portia config with Gemini (Official Portia pattern)
        self.config = Config.from_default(
            llm_provider=LLMProvider.GOOGLE,
            default_model="google/gemini-2.0-flash",
            google_api_key=self.google_api_key
        )
        
        # Create tool registry with custom tools
        self.tool_registry = DefaultToolRegistry(self.config)
        
        # Add custom customer support tools
        self._setup_custom_tools()
        
        # Initialize Portia instance (Official pattern)
        self.portia = Portia(
            config=self.config,
            tools=self.tool_registry
        )
        
        logger.info("CustomerSupportAgent initialized with Gemini model")
    
    def _setup_custom_tools(self):
        """Setup custom tools for customer support workflows"""
        
        # Add custom tools to registry
        custom_tools = [
            EmailTool(),
            SlackTool(),
            TicketTool(),
            KnowledgeBaseTool()
        ]
        
        for tool in custom_tools:
            self.tool_registry.add_tool(tool)
        
        logger.info(f"Added {len(custom_tools)} custom tools to registry")
    
    async def process_customer_query(
        self, 
        query: str, 
        customer_context: Dict[str, Any],
        ticket_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process customer query with AI agent using Portia workflow
        
        Args:
            query: Customer's question/request
            customer_context: Customer information and history
            ticket_id: Optional existing ticket ID
            
        Returns:
            Dict containing plan_id, response, and approval requirements
        """
        
        # Build comprehensive prompt for customer support context
        support_prompt = self._build_support_prompt(query, customer_context, ticket_id)
        
        try:
            # Execute plan with Portia (Official async pattern)
            plan_run = await self.portia.arun(support_prompt)
            
            # Process the plan execution results
            result = {
                "plan_id": plan_run.plan_id,
                "state": plan_run.state.value if hasattr(plan_run.state, 'value') else str(plan_run.state),
                "response": self._extract_response(plan_run),
                "requires_human_approval": self._requires_approval(plan_run),
                "classification": self._extract_classification(plan_run),
                "suggested_actions": self._extract_actions(plan_run),
                "tool_outputs": plan_run.step_outputs or []
            }
            
            logger.info("Customer query processed", 
                       plan_id=result["plan_id"],
                       requires_approval=result["requires_human_approval"])
            
            return result
            
        except Exception as e:
            logger.error("Query processing failed", error=str(e))
            raise
    
    def _build_support_prompt(
        self, 
        query: str, 
        customer_context: Dict[str, Any], 
        ticket_id: Optional[str]
    ) -> str:
        """Build comprehensive prompt for customer support AI"""
        
        context_str = "\n".join([f"{k}: {v}" for k, v in customer_context.items()])
        
        prompt = f"""
You are a professional customer support AI agent powered by Portia AI.
Your goal is to provide excellent customer service while following safety protocols.

CUSTOMER QUERY: {query}

CUSTOMER CONTEXT:
{context_str}

TICKET ID: {ticket_id or "New ticket"}

INSTRUCTIONS:
1. Analyze the customer query and classify its urgency, category, and sentiment
2. Check your knowledge base for relevant information
3. Determine if this can be resolved automatically or requires human approval
4. For sensitive actions (refunds, account changes, escalations), ALWAYS request human approval
5. Use available tools to gather additional context if needed
6. Provide a professional, empathetic response
7. Create appropriate follow-up actions

CLASSIFICATION CATEGORIES:
- billing_inquiry, technical_support, product_info, complaint, refund_request, account_update, general_inquiry

URGENCY LEVELS:
- low, medium, high, urgent

SENTIMENT:
- positive, neutral, negative, frustrated, angry

APPROVAL REQUIRED FOR:
- Refunds over $50
- Account deletions or suspensions  
- Escalations to management
- Policy exceptions
- Technical changes to accounts

Always prioritize customer satisfaction while maintaining company policies.
Be empathetic, professional, and solution-focused.
"""
        
        return prompt
    
    def _extract_response(self, plan_run) -> str:
        """Extract the main response from plan execution"""
        if hasattr(plan_run, 'final_output') and plan_run.final_output:
            return str(plan_run.final_output)
        
        # Fallback to last step output if available
        if plan_run.step_outputs:
            return str(plan_run.step_outputs[-1])
            
        return "I've processed your request. Please check the plan details."
    
    def _requires_approval(self, plan_run) -> bool:
        """Determine if the plan requires human approval"""
        
        # Check plan outputs for approval keywords
        outputs_text = str(plan_run.step_outputs).lower()
        approval_keywords = [
            'approval', 'human approval', 'escalate', 'refund', 
            'sensitive', 'policy exception', 'management'
        ]
        
        return any(keyword in outputs_text for keyword in approval_keywords)
    
    def _extract_classification(self, plan_run) -> Dict[str, str]:
        """Extract query classification from plan outputs"""
        
        # Default classification
        classification = {
            "category": "general_inquiry",
            "urgency": "medium", 
            "sentiment": "neutral"
        }
        
        # Try to parse classification from outputs
        if plan_run.step_outputs:
            outputs_text = str(plan_run.step_outputs).lower()
            
            # Extract category
            categories = ["billing_inquiry", "technical_support", "product_info", 
                         "complaint", "refund_request", "account_update"]
            for cat in categories:
                if cat.replace('_', ' ') in outputs_text:
                    classification["category"] = cat
                    break
            
            # Extract urgency  
            if any(word in outputs_text for word in ['urgent', 'emergency', 'critical']):
                classification["urgency"] = "urgent"
            elif any(word in outputs_text for word in ['high', 'important', 'priority']):
                classification["urgency"] = "high"
            elif any(word in outputs_text for word in ['low', 'minor']):
                classification["urgency"] = "low"
                
            # Extract sentiment
            if any(word in outputs_text for word in ['angry', 'frustrated', 'upset']):
                classification["sentiment"] = "negative"
            elif any(word in outputs_text for word in ['happy', 'satisfied', 'pleased']):
                classification["sentiment"] = "positive"
        
        return classification
    
    def _extract_actions(self, plan_run) -> List[Dict[str, Any]]:
        """Extract suggested actions from plan outputs"""
        
        actions = []
        
        if plan_run.step_outputs:
            for output in plan_run.step_outputs:
                if isinstance(output, dict) and 'action' in output:
                    actions.append(output)
        
        return actions
    
    async def approve_action(self, plan_id: str, approved: bool, reason: str = "") -> Dict[str, Any]:
        """
        Process human approval for AI-suggested actions
        
        Args:
            plan_id: The plan ID that requires approval
            approved: Whether the action was approved
            reason: Optional reason for the decision
            
        Returns:
            Dict containing approval result
        """
        
        try:
            # This would integrate with Portia's approval system
            # For now, we'll simulate the approval process
            
            logger.info("Processing approval", 
                       plan_id=plan_id, 
                       approved=approved, 
                       reason=reason)
            
            result = {
                "plan_id": plan_id,
                "approved": approved,
                "reason": reason,
                "processed_at": "2025-08-23T10:00:00Z",
                "status": "completed" if approved else "rejected"
            }
            
            if approved:
                # Execute the approved action
                # This would continue the Portia plan execution
                pass
            
            return result
            
        except Exception as e:
            logger.error("Approval processing failed", error=str(e))
            raise

    async def get_plan_status(self, plan_id: str) -> Dict[str, Any]:
        """Get the current status of a plan execution"""
        
        try:
            # This would query Portia's plan storage
            # Implementation depends on Portia's plan retrieval API
            
            return {
                "plan_id": plan_id,
                "status": "completed", # or pending, failed, etc.
                "created_at": "2025-08-23T10:00:00Z",
                "updated_at": "2025-08-23T10:05:00Z"
            }
            
        except Exception as e:
            logger.error("Plan status retrieval failed", error=str(e))
            raise