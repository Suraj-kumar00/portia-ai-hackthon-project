"""FastAPI App with Prisma + Portia Cloud"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog
import time

from .config.settings import settings

# Routers
from .api.v1.routes import tickets, conversations, analytics, health

# Optional DB
try:
    from .config.database import connect_prisma, disconnect_prisma
    PRISMA_AVAILABLE = True
except Exception:
    PRISMA_AVAILABLE = False

logger = structlog.get_logger(__name__)

def _normalize_origins(origins: list[str]) -> list[str]:
    return list({o.rstrip('/') for o in origins if isinstance(o, str)})

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Customer Support AI API")
    # DB
    if PRISMA_AVAILABLE:
        try:
            await connect_prisma()
            logger.info("✅ Database connected successfully")
        except Exception as e:
            logger.warning("⚠️ Database connection failed, using mock data", error=str(e))
    else:
        logger.info("ℹ️ Using mock data (no database)")

    # AI agent
    try:
        from .agents.customer_support_agent import CustomerSupportAgent
        app.state.ai_agent = CustomerSupportAgent()
        logger.info("✅ Portia AI agent initialized successfully")
    except Exception as e:
        logger.warning("⚠️ AI agent initialization failed", error=str(e))
        app.state.ai_agent = None

    logger.info("✅ All services initialized successfully")
    yield

    logger.info("🛑 Shutting down Customer Support AI API")
    if PRISMA_AVAILABLE:
        try:
            await disconnect_prisma()
            logger.info("✅ Database disconnected")
        except Exception as e:
            logger.warning("⚠️ Database disconnect failed", error=str(e))

app = FastAPI(
    title=settings.app_name,
    description="AI-powered customer support automation with human-in-the-loop control",
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# Prevent trailing-slash 307 rewrites which can confuse frontends/proxies
app.router.redirect_slashes = False


allowed_origins = _normalize_origins([
    settings.frontend_url,
    "https://portia-ai-hackthon-project-kk5i.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info("HTTP Request",
               method=request.method,
               url=str(request.url),
               status_code=response.status_code,
               process_time=f"{process_time:.4f}s")
    return response

# Mount routers (v1)
app.include_router(health.router,      prefix="/api/v1",            tags=["health"])
app.include_router(tickets.router,     prefix="/api/v1/tickets",    tags=["tickets"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(analytics.router,   prefix="/api/v1/analytics",  tags=["analytics"])

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/api/v1/status")
async def detailed_status():
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "database_available": PRISMA_AVAILABLE,
        "ai_agent_available": hasattr(app.state, 'ai_agent') and app.state.ai_agent is not None,
        "timestamp": time.time()
    }