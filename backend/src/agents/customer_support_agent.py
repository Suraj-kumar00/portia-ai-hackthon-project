"""Customer Support AI Agent with Portia Cloud"""
from typing import Dict, Any, List, Optional
import asyncio
import time
import structlog

from ..config.settings import settings

from portia import (
    Config,
    LLMProvider,
    Portia,
    DefaultToolRegistry,
)

logger = structlog.get_logger(__name__)


class CustomerSupportAgent:
    def __init__(self):
        try:
            self.google_api_key = settings.google_api_key
            self.portia_api_key = settings.portia_api_key

            if not self.google_api_key:
                logger.warning("GOOGLE_API_KEY not found")
            if not self.portia_api_key:
                logger.warning("PORTIA_API_KEY not found - using local mode")

            self.config = Config.from_default(
                llm_provider=LLMProvider.GOOGLE,
                default_model="google/gemini-2.0-flash",
                google_api_key=self.google_api_key,
                portia_api_key=self.portia_api_key,
            )
            self.tool_registry = DefaultToolRegistry(self.config)
            self.portia = Portia(config=self.config, tools=self.tool_registry)

            if self.portia_api_key:
                logger.info("✅ CustomerSupportAgent initialized with Portia Cloud API - Full features enabled")
            else:
                logger.info("✅ CustomerSupportAgent initialized with local Portia - Limited features")

        except Exception as e:
            logger.error("Failed to initialize CustomerSupportAgent", error=str(e))
            raise

    async def _call_portia_with_retry(self, task: str, max_retries: int = 3) -> Any:
        """Call Portia with short timeouts and backoff; persist plan/run on each try."""
        for attempt in range(max_retries):
            try:
                # Ask Portia to persist on the cloud so Plans / Plan Runs appear in dashboard.
                plan_run = await asyncio.wait_for(
                    self.portia.arun(task, store=True, max_steps=50, return_plan_id=True),
                    timeout=12.0,  # keep API snappy
                )
                return plan_run
            except asyncio.TimeoutError as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(min(2 ** attempt, 4))
                    continue
                raise e
            except Exception as e:
                # Retry on transient issues
                msg = str(e)
                recoverable = any(k in msg.lower() for k in ["timeout", "connection", "unavailable", "bad gateway", "502", "503", "504"])
                if recoverable and attempt < max_retries - 1:
                    await asyncio.sleep(min(2 ** attempt, 4))
                    continue
                raise e

    async def process_customer_query(
        self,
        query: str,
        customer_context: Dict[str, Any],
        ticket_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        start_time = time.time()
        customer_email = customer_context.get("email", "customer@example.com")

        # Keep the prompt simple to avoid schema warnings; no extra JSON keys.
        task = (
            "You are a professional AI customer support agent. Help this customer quickly and effectively.\n\n"
            f"CUSTOMER: {customer_email}\n"
            f"QUERY: \"{query}\"\n"
            f"TICKET: {ticket_id or 'New Support Request'}\n\n"
            "Provide a short, actionable response."
        )

        try:
            plan_run = await self._call_portia_with_retry(task, max_retries=3)
            processing_time = (time.time() - start_time) * 1000.0

            plan_id = None
            # Extract plan id robustly from various possible return shapes
            for attr in ("plan_id", "id", "run_id"):
                if hasattr(plan_run, attr):
                    val = getattr(plan_run, attr)
                    if val:
                        plan_id = str(val)
                        break
                if isinstance(plan_run, dict) and plan_run.get(attr):
                    plan_id = str(plan_run[attr])
                    break

            response_text = self._extract_response(plan_run)
            classification = self._classify_query(query)

            result = {
                "success": True,
                "plan_id": plan_id,
                "state": str(getattr(plan_run, "state", "completed")) if hasattr(plan_run, "state") else "completed",
                "response": response_text,
                "requires_human_approval": self._requires_approval(query),
                "classification": classification,
                "suggested_actions": self._generate_suggested_actions(query),
                "tools_used": self._get_tools_used(plan_run),
                "confidence": self._calculate_confidence(plan_run),
                "customer_context": customer_context,
                "processing_time_ms": processing_time,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            logger.info("Portia run finished", plan_id=plan_id, ticket_id=ticket_id)
            return result

        except Exception as e:
            processing_time = (time.time() - start_time) * 1000.0
            logger.error("Portia run failed; returning fallback", error=str(e))
            return self._fallback_response(query, customer_context, str(e), processing_time)

    def _extract_response(self, plan_run) -> str:
        try:
            for attr in ["final_output", "step_outputs", "result", "output", "response", "text"]:
                if hasattr(plan_run, attr):
                    value = getattr(plan_run, attr)
                    if value:
                        if isinstance(value, dict):
                            for key in ["response", "message", "result", "output", "value", "text"]:
                                if key in value and value[key]:
                                    return str(value[key])
                            return str(value)
                        elif isinstance(value, list) and value:
                            return str(value[-1])
                        return str(value)
            if isinstance(plan_run, dict):
                for key in ["response", "text", "result", "output", "final_output"]:
                    if key in plan_run and plan_run[key]:
                        return str(plan_run[key])
        except Exception:
            pass
        return "Thank you for contacting our support team. We will follow up shortly."

    def _requires_approval(self, query: str) -> bool:
        q = query.lower()
        high = [
            "refund", "cancel", "delete account", "escalate", "manager",
            "complaint", "angry", "frustrated", "lawsuit", "security",
            "breach", "hack", "fraud", "urgent", "emergency", "critical",
        ]
        financial = ["$", "money", "payment", "charge", "billing", "subscription"]
        return any(k in q for k in high) or any(k in q for k in financial)

    def _classify_query(self, query: str) -> Dict[str, str]:
        q = query.lower()
        categories = {
            "billing_inquiry": ["bill", "payment", "charge", "invoice", "refund", "subscription"],
            "technical_support": ["login", "password", "technical", "error", "bug", "not working", "broken"],
            "product_info": ["feature", "how to", "information", "product", "guide", "tutorial"],
            "account_update": ["account", "profile", "update", "change", "modify", "settings"],
            "refund_request": ["refund", "return", "money back", "cancel order", "dispute"],
            "complaint": ["angry", "frustrated", "terrible", "awful", "complaint", "disappointed"],
            "security_concern": ["hack", "breach", "security", "fraud", "suspicious", "unauthorized"],
        }
        category = "general_inquiry"
        for k, kws in categories.items():
            if any(w in q for w in kws):
                category = k
                break

        urgency_map = {
            "urgent": ["urgent", "asap", "immediately", "emergency", "critical"],
            "high": ["soon", "quickly", "fast", "priority", "important", "angry", "frustrated"],
            "medium": ["normal", "regular", "standard", "help", "support"],
            "low": ["when convenient", "no rush", "low priority", "whenever"],
        }
        urgency = "medium"
        for lvl, kws in urgency_map.items():
            if any(w in q for w in kws):
                urgency = lvl
                break

        sentiment_map = {
            "very_negative": ["hate", "terrible", "awful", "worst", "furious"],
            "negative": ["angry", "frustrated", "disappointed", "bad", "poor"],
            "neutral": ["help", "support", "question", "how", "what", "when"],
            "positive": ["good", "happy", "satisfied", "great", "excellent", "thanks"],
            "very_positive": ["love", "amazing", "fantastic", "perfect", "outstanding"],
        }
        sentiment = "neutral"
        for s, kws in sentiment_map.items():
            if any(w in q for w in kws):
                sentiment = s
                break

        confidence = 0.7
        if any(w in q for w in ["help", "support", "question"]):
            confidence += 0.1
        if len(query.split()) > 5:
            confidence += 0.1

        return {
            "category": category,
            "priority": "high" if urgency in ["urgent", "high"] else "medium" if urgency == "medium" else "low",
            "urgency": urgency,
            "sentiment": sentiment,
            "confidence": str(min(confidence, 1.0)),
        }

    def _generate_suggested_actions(self, query: str) -> List[Dict[str, Any]]:
        q = query.lower()
        actions: List[Dict[str, Any]] = []
        if any(w in q for w in ["refund", "cancel", "money back"]):
            actions.append({"action_type": "process_refund", "description": "Process refund request", "requires_approval": True, "priority": "high"})
        if any(w in q for w in ["technical", "error", "bug", "not working"]):
            actions.append({"action_type": "technical_support", "description": "Escalate to technical support team", "requires_approval": False, "priority": "medium"})
        if any(w in q for w in ["angry", "frustrated", "complaint"]):
            actions.append({"action_type": "escalate_to_manager", "description": "Escalate to customer success manager", "requires_approval": False, "priority": "high"})
        if not actions:
            actions.append({"action_type": "standard_response", "description": "Provide standard support response", "requires_approval": False, "priority": "medium"})
        return actions

    def _get_tools_used(self, plan_run) -> List[str]:
        # Placeholder tool list for UI; does not affect execution
        tools = ["portia_llm_tool"]
        if self.portia_api_key:
            tools += ["portia_cloud_tools"]
        return tools

    def _calculate_confidence(self, plan_run) -> float:
        try:
            if hasattr(plan_run, "confidence"):
                return float(getattr(plan_run, "confidence"))
            return 0.8 if plan_run else 0.5
        except Exception:
            return 0.5

    def _fallback_response(self, query: str, ctx: Dict[str, Any], error: Optional[str], processing_time: float) -> Dict[str, Any]:
        return {
            "success": True,
            "plan_id": f"fallback_{hash(query)}",
            "state": "completed",
            "response": "Thank you for your inquiry. Our team will respond within 24 hours.",
            "requires_human_approval": True,
            "classification": {
                "category": "general_inquiry",
                "priority": "medium",
                "urgency": "medium",
                "sentiment": "neutral",
                "confidence": "0.5",
            },
            "suggested_actions": [
                {
                    "action_type": "human_review_required",
                    "description": "AI temporarily unavailable - human review queued",
                    "requires_approval": False,
                    "priority": "medium",
                }
            ],
            "tools_used": ["fallback_system"],
            "confidence": 0.5,
            "customer_context": ctx,
            "processing_time_ms": processing_time,
            "fallback_reason": error or "Portia Cloud API temporarily unavailable",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }