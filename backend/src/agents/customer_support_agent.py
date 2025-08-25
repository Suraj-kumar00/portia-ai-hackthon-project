# backend/src/agents/customer_support.py
from typing import Dict, Any, List, Optional, Tuple
import asyncio, os, time
import structlog

from ..config.settings import settings
from portia import Config, LLMProvider, Portia, DefaultToolRegistry, StorageClass
from pydantic import ValidationError

logger = structlog.get_logger(__name__)

def _build_config(primary: str) -> Tuple[Config, LLMProvider, str]:
    g = settings.google_api_key or os.getenv("GOOGLE_API_KEY")
    o = os.getenv("OPENAI_API_KEY")
    storage = StorageClass.CLOUD if settings.portia_api_key else StorageClass.MEMORY
    if primary == "OPENAI" and o:
        return (Config.from_default(llm_provider=LLMProvider.OPENAI, default_model="openai/gpt-4o-mini",
                                    openai_api_key=o, portia_api_key=settings.portia_api_key, storage_class=storage),
                LLMProvider.OPENAI, "openai/gpt-4o-mini")
    if g:
        return (Config.from_default(llm_provider=LLMProvider.GOOGLE, default_model="google/gemini-2.0-flash",
                                    google_api_key=g, portia_api_key=settings.portia_api_key, storage_class=storage),
                LLMProvider.GOOGLE, "google/gemini-2.0-flash")
    if o:
        return (Config.from_default(llm_provider=LLMProvider.OPENAI, default_model="openai/gpt-4o-mini",
                                    openai_api_key=o, portia_api_key=settings.portia_api_key, storage_class=storage),
                LLMProvider.OPENAI, "openai/gpt-4o-mini")
    return (Config.from_default(llm_provider=LLMProvider.GOOGLE, default_model="google/gemini-2.0-flash",
                                portia_api_key=settings.portia_api_key, storage_class=storage),
            LLMProvider.GOOGLE, "google/gemini-2.0-flash")

class CustomerSupportAgent:
    def __init__(self):
        cfg, prov, model = _build_config(os.getenv("PORTIA_PRIMARY_PROVIDER", "GOOGLE").upper())
        self.config, self.provider, self.model = cfg, prov, model
        self.tool_registry = DefaultToolRegistry(self.config)
        self.portia = Portia(config=self.config, tools=self.tool_registry)
        logger.info("Portia initialised", cloud=bool(settings.portia_api_key), storage=str(self.config.storage_class))

    async def _run_sync(self, fn):
        loop = asyncio.get_running_loop()
        return await asyncio.wait_for(loop.run_in_executor(None, fn), timeout=30.0)

    async def _wait_ready_if_needed(self, run_obj, max_wait=180):
        run_id = getattr(run_obj, "id", None) or (run_obj.get("id") if isinstance(run_obj, dict) else None)
        state = getattr(run_obj, "state", None) or (run_obj.get("state") if isinstance(run_obj, dict) else None)
        if run_id and str(state).upper() in {"NEEDS_CLARIFICATION", "READY_TO_RESUME"}:
            loop = asyncio.get_running_loop()
            await asyncio.wait_for(loop.run_in_executor(None, lambda: self.portia.wait_for_ready(run_id, timeout=max_wait)), timeout=max_wait+15)
            return await self._run_sync(lambda: self.portia.get_run(run_id))
        return run_obj

    async def _fallback_provider(self):
        alt = "OPENAI" if self.provider == LLMProvider.GOOGLE else "GOOGLE"
        cfg, prov, model = _build_config(alt)
        self.config, self.provider, self.model = cfg, prov, model
        self.tool_registry = DefaultToolRegistry(self.config)
        self.portia = Portia(config=self.config, tools=self.tool_registry)
        logger.warning("Switched provider", provider=str(self.provider), model=self.model)

    def _sanitize(self, text: str) -> str:
        return " ".join(text.replace("\n", " ").replace('"', "'").split())[:2000]

    async def process_customer_query(self, query: str, customer_context: Dict[str, Any], ticket_id: Optional[str] = None) -> Dict[str, Any]:
        t0 = time.time()
        email = (customer_context or {}).get("email") or "customer@example.com"
        task = (
            "You are a professional AI customer support agent. Provide a concise, actionable reply.\n"
            f"Customer: {self._sanitize(email)}\n"
            f"Query: {self._sanitize(query)}\n"
            f"Ticket: {self._sanitize(ticket_id or 'New Support Request')}\n"
            "Only propose necessary steps."
        )

        try:
            # 1) Preferred: single-call run() which creates plan + executes run
            try:
                run = await self._run_sync(lambda: self.portia.run(task, end_user=email))
            except (ValidationError, TypeError, ValueError) as e:
                # 2) If planner validation fails (StepsOrError None), build a minimal plan then run it
                logger.warning("Planner validation failed; regenerating minimal plan then running", error=str(e))
                # regenerate with a minimal prompt to avoid schema verbosity issues
                simple_task = f"Answer briefly and helpfully: {self._sanitize(query)}"
                plan = await self._run_sync(lambda: self.portia.plan(simple_task))
                run = await self._run_sync(lambda: self.portia.run_plan(plan, end_user=email))

            # 3) OAuth resume if needed
            run = await self._wait_ready_if_needed(run)

            # 4) If still no state (edge case), retry once with provider fallback
            state = getattr(run, "state", None) or (run.get("state") if isinstance(run, dict) else None)
            if not state:
                await self._fallback_provider()
                run = await self._run_sync(lambda: self.portia.run(task, end_user=email))
                run = await self._wait_ready_if_needed(run)

            plan_id = getattr(run, "plan_id", None) or (run.get("plan_id") if isinstance(run, dict) else None)
            response = self._extract_response(run)
            return {
                "success": True,
                "plan_id": plan_id,
                "state": str(getattr(run, "state", None) or (run.get("state") if isinstance(run, dict) else "COMPLETED")),
                "response": response,
                "requires_human_approval": self._requires_approval(query),
                "classification": self._classify_query(query),
                "suggested_actions": self._generate_suggested_actions(query),
                "confidence": self._calculate_confidence(run),
                "customer_context": customer_context,
                "processing_time_ms": (time.time() - t0) * 1000.0,
            }

        except Exception as e:
            logger.error("Portia run failed; returning fallback", error=str(e))
            return self._fallback_response(query, customer_context, str(e), (time.time() - t0) * 1000.0)

    # --- helpers (same as before) ---
    def _extract_response(self, run) -> str:
        try:
            for attr in ["final_output", "step_outputs", "result", "output", "response", "text"]:
                if hasattr(run, attr):
                    val = getattr(run, attr)
                    if val:
                        if isinstance(val, dict):
                            for k in ["response", "message", "result", "output", "value", "text"]:
                                if k in val and val[k]:
                                    return str(val[k])
                            return str(val)
                        if isinstance(val, list) and val:
                            return str(val[-1])
                        return str(val)
            if isinstance(run, dict):
                for k in ["response", "text", "result", "output", "final_output"]:
                    if k in run and run[k]:
                        return str(run[k])
        except Exception:
            pass
        return "Thank you for contacting our support team. We will follow up shortly."

    def _requires_approval(self, q: str) -> bool:
        q = q.lower()
        high = ["refund","cancel","delete account","escalate","manager","complaint","angry","frustrated","lawsuit","security","breach","hack","fraud","urgent","emergency","critical"]
        fin = ["$", "money", "payment", "charge", "billing", "subscription"]
        return any(k in q for k in high) or any(k in q for k in fin)

    def _classify_query(self, q: str) -> Dict[str, str]:
        ql = q.lower()
        cats = {"billing_inquiry":["bill","payment","charge","invoice","refund","subscription"],"technical_support":["login","password","technical","error","bug","not working","broken"],"product_info":["feature","how to","information","product","guide","tutorial"],"account_update":["account","profile","update","change","modify","settings"],"refund_request":["refund","return","money back","cancel order","dispute"],"complaint":["angry","frustrated","terrible","awful","complaint","disappointed"],"security_concern":["hack","breach","security","fraud","suspicious","unauthorized"]}
        cat = "general_inquiry"
        for k, kws in cats.items():
            if any(w in ql for w in kws): cat = k; break
        urg_map = {"urgent":["urgent","asap","immediately","emergency","critical"],"high":["soon","quickly","fast","priority","important","angry","frustrated"],"medium":["normal","regular","standard","help","support"],"low":["when convenient","no rush","low priority","whenever"]}
        urg = "medium"
        for lvl, kws in urg_map.items():
            if any(w in ql for w in kws): urg = lvl; break
        sent_map = {"very_negative":["hate","terrible","awful","worst","furious"],"negative":["angry","frustrated","disappointed","bad","poor"],"neutral":["help","support","question","how","what","when"],"positive":["good","happy","satisfied","great","excellent","thanks"],"very_positive":["love","amazing","fantastic","perfect","outstanding"]}
        sent = "neutral"
        for s, kws in sent_map.items():
            if any(w in ql for w in kws): sent = s; break
        conf = 0.7 + (0.1 if any(w in ql for w in ["help","support","question"]) else 0) + (0.1 if len(q.split())>5 else 0)
        return {"category": cat, "priority": "high" if urg in ["urgent","high"] else "medium" if urg=="medium" else "low", "urgency": urg, "sentiment": sent, "confidence": str(min(conf, 1.0))}

    def _generate_suggested_actions(self, q: str) -> List[Dict[str, Any]]:
        ql = q.lower(); actions=[]
        if any(w in ql for w in ["refund","cancel","money back"]): actions.append({"action_type":"process_refund","description":"Process refund request","requires_approval":True,"priority":"high"})
        if any(w in ql for w in ["technical","error","bug","not working"]): actions.append({"action_type":"technical_support","description":"Escalate to technical support team","requires_approval":False,"priority":"medium"})
        if any(w in ql for w in ["angry","frustrated","complaint"]): actions.append({"action_type":"escalate_to_manager","description":"Escalate to customer success manager","requires_approval":False,"priority":"high"})
        if not actions: actions.append({"action_type":"standard_response","description":"Provide standard support response","requires_approval":False,"priority":"medium"})
        return actions

    def _calculate_confidence(self, run) -> float:
        try:
            if hasattr(run, "confidence"): return float(getattr(run, "confidence"))
            return 0.8 if run else 0.5
        except Exception: return 0.5

    def _fallback_response(self, query: str, ctx: Dict[str, Any], reason: Optional[str], ms: float) -> Dict[str, Any]:
        return {"success": True, "plan_id": f"fallback_{hash(query)}", "state": "COMPLETED", "response": "Thank you for your inquiry. Our team will respond within 24 hours.", "requires_human_approval": True, "classification": {"category":"general_inquiry","priority":"medium","urgency":"medium","sentiment":"neutral","confidence":"0.5"}, "suggested_actions": [{"action_type":"human_review_required","description":"AI temporarily unavailable - human review queued","requires_approval": False,"priority":"medium"}], "confidence": 0.5, "customer_context": ctx, "processing_time_ms": ms, "fallback_reason": reason or "temporary error", "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
