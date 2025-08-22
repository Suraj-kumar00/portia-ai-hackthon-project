"""
Customer Support AI API - FastAPI Application
Integrates Portia AI, Gemini, Clerk Auth, and Supabase
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog
from dotenv import load_dotenv

from .config.settings import settings
from .agents.customer_support_agent import CustomerSupportAgent
from .api.v1.routes import tickets, conversations, analytics, health
from .utils.logger import setup_logging

# Load environment variables
load_dotenv()

# Setup structured logging
setup_logging(settings.log_level)
logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan events - startup and shutdown"""
    
    # Startup
    logger.info("Starting Customer Support AI API", 
               version=settings.app_version,
               environment=settings.environment)
    
    try:
        # Initialize Portia AI Agent with Gemini
        app.state.ai_agent = CustomerSupportAgent()
        
        # Test the agent connection
        test_query = "test connection"
        test_result = await app.state.ai_agent.portia.arun(test_query)
        
        logger.info("Portia AI agent initialized successfully",
                   model="google/gemini-2.0-flash",
                   test_status=test_result.state)
        
        # Initialize other services here
        # app.state.database = await init_database()
        # app.state.redis = await init_redis()
        
    except Exception as e:
        logger.error("Failed to initialize services", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Customer Support AI API")
    
    # Cleanup resources
    if hasattr(app.state, 'ai_agent'):
        # Clean up agent resources if needed
        pass

# Create FastAPI application
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
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
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