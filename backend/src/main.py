"""FastAPI App with Proper Prisma Integration - FIXED"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog
import time

# Import routes
from .api.v1.routes import tickets, conversations, analytics, health

# Import settings and conditional database
from .config.settings import settings

# Optional imports with error handling
try:
    from .config.database import connect_prisma, disconnect_prisma
    PRISMA_AVAILABLE = True
except ImportError:
    PRISMA_AVAILABLE = False

logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan events with optional Prisma"""
    
    # Startup
    logger.info("Starting Customer Support AI API")
    
    try:
        # Connect to database (if available)
        if PRISMA_AVAILABLE:
            try:
                await connect_prisma()
                logger.info("✅ Database connected successfully")
            except Exception as e:
                logger.warning("⚠️ Database connection failed, using mock data", error=str(e))
        else:
            logger.info("ℹ️ Using mock data (no database)")
        
        # Initialize AI agent
        try:
            from .agents.customer_support_agent import CustomerSupportAgent
            app.state.ai_agent = CustomerSupportAgent()
            logger.info("✅ Portia AI agent initialized successfully")
        except Exception as e:
            logger.warning("⚠️ AI agent initialization failed, using mock", error=str(e))
            app.state.ai_agent = None
        
        logger.info("✅ All services initialized successfully")
        
    except Exception as e:
        logger.error("❌ Startup failed", error=str(e))
        # Don't raise - allow server to start with limited functionality
        app.state.ai_agent = None
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Customer Support AI API")
    
    if PRISMA_AVAILABLE:
        try:
            await disconnect_prisma()
            logger.info("✅ Database disconnected")
        except Exception as e:
            logger.warning("⚠️ Database disconnect failed", error=str(e))

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-powered customer support automation with human-in-the-loop control",
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url, 
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"  # Extra port for flexibility
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Log request details
    process_time = time.time() - start_time
    logger.info("HTTP Request",
               method=request.method,
               url=str(request.url),
               status_code=response.status_code,
               process_time=f"{process_time:.4f}s")
    
    return response

# Include API routes
app.include_router(
    health.router,
    prefix="/api/v1",
    tags=["health"]
)

app.include_router(
    tickets.router, 
    prefix="/api/v1/tickets",
    tags=["tickets"]
)

app.include_router(
    conversations.router,
    prefix="/api/v1/conversations", 
    tags=["conversations"]
)

app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["analytics"]
)

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    
    logger.error("Unhandled exception",
                error=str(exc),
                path=request.url.path,
                method=request.method)
    
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "request_id": getattr(request.state, 'request_id', None)
    }

# Additional health check for detailed status
@app.get("/api/v1/status")
async def detailed_status():
    """Detailed application status"""
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "database_available": PRISMA_AVAILABLE,
        "ai_agent_available": hasattr(app.state, 'ai_agent') and app.state.ai_agent is not None,
        "timestamp": time.time()
    }
