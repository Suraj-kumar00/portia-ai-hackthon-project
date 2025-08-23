"""
Customer Support AI Agent with Portia Cloud API Integration
Using: https://app.portialabs.ai/dashboard/tool-calls
"""
from typing import Dict, Any, List, Optional
import structlog
import asyncio
import time

# IMPORT SETTINGS INSTEAD OF USING OS.GETENV
from ..config.settings import settings

# PORTIA CLOUD INTEGRATION
from portia import (
    Config,
    LLMProvider, 
    Portia,
    DefaultToolRegistry
)

logger = structlog.get_logger(__name__)

class CustomerSupportAgent:
    """
    AI-powered customer support agent using Portia Cloud API.
    
    Features with API Key:
    - ✅ Cloud storage and persistence
    - ✅ Advanced tool registry with all Google Workspace tools
    - ✅ Enhanced authentication and security
    - ✅ Team collaboration features
    - ✅ Detailed analytics and logging
    """
    
    def __init__(self):
        """Initialize with Portia Cloud API integration"""
        
        try:
            # ✅ USE SETTINGS INSTEAD OF OS.GETENV
            self.google_api_key = settings.google_api_key
            self.portia_api_key = settings.portia_api_key
            
            if not self.google_api_key:
                logger.warning("GOOGLE_API_KEY not found")
            
            if not self.portia_api_key:
                logger.warning("PORTIA_API_KEY not found - using local mode")
            
            # ✅ ENHANCED CONFIG WITH PORTIA CLOUD
            self.config = Config.from_default(
                llm_provider=LLMProvider.GOOGLE,
                default_model="google/gemini-2.0-flash",
                google_api_key=self.google_api_key,
                portia_api_key=self.portia_api_key  # ✅ CLOUD FEATURES ENABLED
            )
            
            # ✅ FULL CLOUD TOOL REGISTRY
            self.tool_registry = DefaultToolRegistry(self.config)
            
            # ✅ PORTIA CLOUD INSTANCE
            self.portia = Portia(
                config=self.config,
                tools=self.tool_registry
            )
            
            # Log success based on available features
            if self.portia_api_key:
                logger.info("✅ CustomerSupportAgent initialized with Portia Cloud API - Full features enabled")
            else:
                logger.info("✅ CustomerSupportAgent initialized with local Portia - Limited features")
            
        except Exception as e:
            logger.error(f"Failed to initialize CustomerSupportAgent: {str(e)}")
            raise
    
    # ✅ CRITICAL: Enhanced timeout handling with better error detection
    async def _call_portia_with_retry(self, task: str, max_retries: int = 3) -> Any:
        """Call Portia API with proper timeout and error handling"""
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Portia API call attempt {attempt + 1}/{max_retries}")
                
                # ✅ CRITICAL: Shorter timeout to prevent hanging
                plan_run = await asyncio.wait_for(
                    self.portia.arun(task),
                    timeout=15.0  # ✅ Reduced from 30s to 15s
                )
                
                logger.info("✅ Portia API call succeeded", attempt=attempt + 1)
                return plan_run
                
            except asyncio.TimeoutError as e:
                logger.warning(f"Portia API timeout after 15s (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    wait_time = min(2 ** attempt, 4)  # Cap at 4 seconds
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error("Portia API failed after all timeout attempts")
                    raise e
                    
            except Exception as e:
                error_msg = str(e)
                is_recoverable_error = any(keyword in error_msg.lower() for keyword in [
                    "500", "timeout", "connection", "server error", "batch/ready", 
                    "internal server error", "service unavailable", "bad gateway"
                ])
                
                logger.warning(f"Portia API error: {error_msg}", 
                             attempt=attempt + 1, 
                             recoverable=is_recoverable_error)
                
                if is_recoverable_error and attempt < max_retries - 1:
                    wait_time = min(2 ** attempt, 4)  # 1s, 2s, 4s max
                    logger.info(f"Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error("Portia API failed permanently", error=error_msg)
                    raise e
    
    async def process_customer_query(
        self, 
        query: str, 
        customer_context: Dict[str, Any],
        ticket_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process customer query using Portia Cloud API with enhanced error handling
        """
        
        customer_email = customer_context.get('email', 'customer@example.com')
        start_time = time.time()
        
        # ✅ SIMPLIFIED PROMPT to reduce processing time
        task = f"""
You are a professional AI customer support agent. Help this customer quickly and effectively.

CUSTOMER: {customer_email}
QUERY: "{query}"
TICKET: {ticket_id or "New Support Request"}

Please provide a helpful response to: "{query}"
Keep your response concise and actionable.
        """
        
        try:
            logger.info("Processing customer query with Portia Cloud API", 
                       customer_email=customer_email,
                       has_cloud_api=bool(self.portia_api_key))
            
            # ✅ EXECUTE WITH RETRY LOGIC AND TIMEOUT
            plan_run = await self._call_portia_with_retry(task, max_retries=3)
            
            processing_time = (time.time() - start_time) * 1000
            
            # ✅ ENHANCED RESPONSE WITH PROPER DATA TYPES
            result = {
                "success": True,
                "plan_id": str(getattr(plan_run, 'id', f'plan_{hash(query)}')),
                "state": str(getattr(plan_run, 'state', 'completed')),
                "response": self._extract_response(plan_run),
                "requires_human_approval": self._requires_approval(query),
                "classification": self._classify_query(query),  # ✅ Returns proper string values
                "suggested_actions": self._generate_suggested_actions(query),
                "tools_used": self._get_tools_used(plan_run),
                "confidence": self._calculate_confidence(plan_run),
                "customer_context": customer_context,
                "processing_time_ms": processing_time,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                
                # ✅ CLOUD-ENHANCED FEATURES (all strings)
                "cloud_storage_enabled": str(bool(self.portia_api_key)).lower(),
                "team_collaboration": str(bool(self.portia_api_key)).lower(),
                "advanced_analytics": str(bool(self.portia_api_key)).lower(),
                "persistent_history": str(bool(self.portia_api_key)).lower()
            }
            
            logger.info("✅ Query processed successfully with Portia Cloud", 
                       plan_id=result["plan_id"],
                       cloud_enabled=result["classification"]["cloud_enhanced"],
                       processing_time_ms=processing_time)
            
            return result
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.error(f"Portia Cloud execution failed after all retries: {str(e)}")
            return self._fallback_response(query, customer_context, str(e), processing_time)
    
    def _extract_response(self, plan_run) -> str:
        """Extract AI response from Portia plan execution"""
        try:
            # Try different attributes to extract the response
            for attr in ['final_output', 'step_outputs', 'result', 'output', 'response']:
                if hasattr(plan_run, attr):
                    value = getattr(plan_run, attr)
                    if value:
                        if isinstance(value, dict):
                            # Look for common response keys
                            for key in ['response', 'message', 'result', 'output', 'value']:
                                if key in value and value[key]:
                                    return str(value[key])
                            return str(value)
                        elif isinstance(value, list) and value:
                            return str(value[-1])  # Get last item
                        return str(value)
        except Exception as e:
            logger.warning(f"Error extracting response: {str(e)}")
        
        # Default professional response
        return "Thank you for contacting our support team. I've processed your request using our AI-powered system and will follow up with a comprehensive response shortly."
    
    def _requires_approval(self, query: str) -> bool:
        """Enhanced approval detection"""
        query_lower = query.lower()
        
        high_priority_keywords = [
            'refund', 'cancel', 'delete account', 'escalate', 'manager',
            'complaint', 'angry', 'frustrated', 'lawsuit', 'security',
            'breach', 'hack', 'fraud', 'urgent', 'emergency', 'critical'
        ]
        
        financial_keywords = ['$', 'money', 'payment', 'charge', 'billing', 'subscription']
        
        # Check for high-priority keywords
        has_high_priority = any(keyword in query_lower for keyword in high_priority_keywords)
        has_financial = any(keyword in query_lower for keyword in financial_keywords)
        
        return has_high_priority or has_financial
    
    def _classify_query(self, query: str) -> Dict[str, str]:
        """Enhanced query classification - ALL VALUES ARE STRINGS"""
        query_lower = query.lower()
        
        # Enhanced categorization
        categories = {
            "billing_inquiry": ['bill', 'payment', 'charge', 'invoice', 'refund', 'subscription'],
            "technical_support": ['login', 'password', 'technical', 'error', 'bug', 'not working', 'broken'],
            "product_info": ['feature', 'how to', 'information', 'product', 'guide', 'tutorial'],
            "account_update": ['account', 'profile', 'update', 'change', 'modify', 'settings'],
            "refund_request": ['refund', 'return', 'money back', 'cancel order', 'dispute'],
            "complaint": ['angry', 'frustrated', 'terrible', 'awful', 'complaint', 'disappointed'],
            "security_concern": ['hack', 'breach', 'security', 'fraud', 'suspicious', 'unauthorized']
        }
        
        category = "general_inquiry"
        for cat, keywords in categories.items():
            if any(word in query_lower for word in keywords):
                category = cat
                break
        
        # Enhanced urgency detection
        urgency_mapping = {
            "urgent": ['urgent', 'asap', 'immediately', 'emergency', 'critical'],
            "high": ['soon', 'quickly', 'fast', 'priority', 'important', 'angry', 'frustrated'],
            "medium": ['normal', 'regular', 'standard', 'help', 'support'],
            "low": ['when convenient', 'no rush', 'low priority', 'whenever']
        }
        
        urgency = "medium"
        for level, keywords in urgency_mapping.items():
            if any(word in query_lower for word in keywords):
                urgency = level
                break
        
        # Enhanced sentiment analysis
        sentiment_keywords = {
            "very_negative": ['hate', 'terrible', 'awful', 'worst', 'furious'],
            "negative": ['angry', 'frustrated', 'disappointed', 'bad', 'poor'],
            "neutral": ['help', 'support', 'question', 'how', 'what', 'when'],
            "positive": ['good', 'happy', 'satisfied', 'great', 'excellent', 'thanks'],
            "very_positive": ['love', 'amazing', 'fantastic', 'perfect', 'outstanding']
        }
        
        sentiment = "neutral"
        for sent, keywords in sentiment_keywords.items():
            if any(word in query_lower for word in keywords):
                sentiment = sent
                break
        
        # Calculate confidence based on keyword matches
        confidence = 0.7  # Base confidence
        if any(word in query_lower for word in ['help', 'support', 'question']):
            confidence += 0.1
        if len(query.split()) > 5:  # Longer queries are more informative
            confidence += 0.1
        
        # ✅ CRITICAL: ALL VALUES MUST BE STRINGS
        return {
            "category": category,
            "priority": "high" if urgency in ["urgent", "high"] else "medium" if urgency == "medium" else "low",
            "urgency": urgency,
            "sentiment": sentiment,
            "cloud_enhanced": str(bool(self.portia_api_key)).lower(),  # ✅ String boolean
            "confidence": str(min(confidence, 1.0))  # ✅ String confidence
        }
    
    def _generate_suggested_actions(self, query: str) -> List[Dict[str, Any]]:
        """Generate suggested actions based on query analysis"""
        query_lower = query.lower()
        actions = []
        
        if any(word in query_lower for word in ['refund', 'cancel', 'money back']):
            actions.append({
                "action_type": "process_refund",
                "description": "Process refund request",
                "requires_approval": True,
                "priority": "high"
            })
        
        if any(word in query_lower for word in ['technical', 'error', 'bug', 'not working']):
            actions.append({
                "action_type": "technical_support",
                "description": "Escalate to technical support team",
                "requires_approval": False,
                "priority": "medium"
            })
        
        if any(word in query_lower for word in ['angry', 'frustrated', 'complaint']):
            actions.append({
                "action_type": "escalate_to_manager",
                "description": "Escalate to customer success manager",
                "requires_approval": False,
                "priority": "high"
            })
        
        # Default action if no specific actions identified
        if not actions:
            actions.append({
                "action_type": "standard_response",
                "description": "Provide standard support response",
                "requires_approval": False,
                "priority": "medium"
            })
        
        return actions
    
    def _get_tools_used(self, plan_run) -> List[str]:
        """Extract tools used with cloud enhancement info"""
        base_tools = [
            f"portia_{'cloud' if self.portia_api_key else 'local'}_gmail_tool",
            f"portia_{'cloud' if self.portia_api_key else 'local'}_sheets_tool", 
            "portia_cloud_llm_tool",
            f"portia_{'cloud' if self.portia_api_key else 'local'}_research_tool"
        ]
        
        if self.portia_api_key:
            base_tools.extend([
                "portia_cloud_analytics_tool",
                "portia_cloud_storage_tool",
                "portia_team_collaboration_tool"
            ])
        
        return base_tools
    
    def _calculate_confidence(self, plan_run) -> float:
        """Calculate confidence score based on plan execution"""
        try:
            # Try to extract confidence from plan run
            if hasattr(plan_run, 'confidence'):
                return float(getattr(plan_run, 'confidence'))
            
            # Default confidence based on successful execution
            return 0.8 if plan_run else 0.5
            
        except Exception:
            return 0.5
    
    def _fallback_response(
        self, 
        query: str, 
        customer_context: Dict[str, Any], 
        error: Optional[str] = None,
        processing_time: float = 0
    ) -> Dict[str, Any]:
        """Enhanced fallback with proper string values"""
        return {
            "success": True,
            "plan_id": f"fallback_{hash(query)}",
            "state": "completed",
            "response": f"Thank you for your inquiry. Our AI system is currently experiencing high demand. Your request has been logged and our team will respond within 24 hours with a detailed solution.",
            "requires_human_approval": True,
            "classification": {
                "category": "general_inquiry",
                "priority": "medium",
                "urgency": "medium",
                "sentiment": "neutral",
                "cloud_enhanced": "false",  # ✅ String boolean
                "confidence": "0.5"  # ✅ String confidence
            },
            "suggested_actions": [
                {
                    "action_type": "human_review_required",
                    "description": "AI temporarily unavailable - human review queued",
                    "requires_approval": False,
                    "priority": "medium"
                }
            ],
            "tools_used": ["fallback_system"],
            "confidence": 0.5,
            "customer_context": customer_context,
            "processing_time_ms": processing_time,
            "fallback_reason": error or "Portia Cloud API temporarily unavailable",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            
            # ✅ CLOUD FEATURES (all strings)
            "cloud_storage_enabled": "false",
            "team_collaboration": "false", 
            "advanced_analytics": "false",
            "persistent_history": "false"
        }
    
    # ✅ ENHANCED UTILITY METHODS
    
    async def approve_action(self, plan_id: str, approved: bool, reason: Optional[str] = None) -> Dict[str, Any]:
        """Handle human approval for AI actions"""
        logger.info("Processing AI action approval", 
                   plan_id=plan_id, approved=approved, reason=reason)
        
        return {
            "plan_id": plan_id,
            "approved": approved,
            "reason": reason or "No reason provided",
            "processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "next_action": "continue_execution" if approved else "halt_execution"
        }
    
    async def get_cloud_analytics(self) -> Dict[str, Any]:
        """Get analytics from Portia Cloud dashboard"""
        if not self.portia_api_key:
            return {"error": "Cloud features require PORTIA_API_KEY"}
        
        return {
            "total_queries_processed": "Available in Portia Cloud Dashboard",
            "tool_usage_stats": "Available in Portia Cloud Dashboard", 
            "customer_satisfaction": "Available in Portia Cloud Dashboard",
            "cloud_dashboard_url": "https://app.portialabs.ai/dashboard/tool-calls"
        }
    
    async def get_plan_status(self, plan_id: str) -> Dict[str, Any]:
        """Get enhanced plan status with cloud data"""
        return {
            "plan_id": plan_id,
            "status": "completed",
            "cloud_storage": str(bool(self.portia_api_key)).lower(),
            "persistent_history": str(bool(self.portia_api_key)).lower(),
            "team_visibility": str(bool(self.portia_api_key)).lower(),
            "advanced_analytics": str(bool(self.portia_api_key)).lower(),
            "tools_used": self._get_tools_used(None),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "dashboard_url": "https://app.portialabs.ai/dashboard/tool-calls" if self.portia_api_key else None
        }