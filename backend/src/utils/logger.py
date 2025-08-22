"""Logging configuration using structlog"""
import structlog
import logging
import sys
from typing import Dict, Any

def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured logging for the application"""
    
    # Configure stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper())
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer() if log_level == "DEBUG" else structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level.upper())
        ),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)

class LoggerMixin:
    """Mixin class to add logging to any class"""
    
    @property
    def logger(self) -> structlog.BoundLogger:
        return structlog.get_logger(self.__class__.__name__)

def log_api_call(func):
    """Decorator to log API function calls"""
    
    def wrapper(*args, **kwargs):
        logger = structlog.get_logger(func.__name__)
        logger.info("API call started", 
                   function=func.__name__,
                   args_count=len(args),
                   kwargs_keys=list(kwargs.keys()))
        
        try:
            result = func(*args, **kwargs)
            logger.info("API call completed", function=func.__name__)
            return result
        except Exception as e:
            logger.error("API call failed", 
                        function=func.__name__,
                        error=str(e))
            raise
    
    return wrapper

async def log_async_api_call(func):
    """Decorator to log async API function calls"""
    
    async def wrapper(*args, **kwargs):
        logger = structlog.get_logger(func.__name__)
        logger.info("Async API call started", 
                   function=func.__name__,
                   args_count=len(args),
                   kwargs_keys=list(kwargs.keys()))
        
        try:
            result = await func(*args, **kwargs)
            logger.info("Async API call completed", function=func.__name__)
            return result
        except Exception as e:
            logger.error("Async API call failed", 
                        function=func.__name__,
                        error=str(e))
            raise
    
    return wrapper

class RequestLogger:
    """Middleware for logging HTTP requests"""
    
    def __init__(self):
        self.logger = structlog.get_logger("http_requests")
    
    def log_request(self, method: str, url: str, headers: Dict[str, str]) -> None:
        """Log incoming HTTP request"""
        self.logger.info("HTTP request received",
                        method=method,
                        url=url,
                        user_agent=headers.get("user-agent"),
                        content_type=headers.get("content-type"))
    
    def log_response(self, status_code: int, response_time_ms: float) -> None:
        """Log HTTP response"""
        self.logger.info("HTTP response sent",
                        status_code=status_code,
                        response_time_ms=response_time_ms,
                        success=200 <= status_code < 300)

# Performance logging utilities
import time
from contextlib import contextmanager

@contextmanager
def log_performance(operation_name: str, logger: structlog.BoundLogger = None):
    """Context manager to log operation performance"""
    
    if logger is None:
        logger = structlog.get_logger("performance")
    
    start_time = time.time()
    logger.info("Operation started", operation=operation_name)
    
    try:
        yield
        duration = time.time() - start_time
        logger.info("Operation completed", 
                   operation=operation_name,
                   duration_seconds=round(duration, 3))
    except Exception as e:
        duration = time.time() - start_time
        logger.error("Operation failed",
                    operation=operation_name,
                    duration_seconds=round(duration, 3),
                    error=str(e))
        raise

# Error logging utilities
def log_exception(exc: Exception, context: Dict[str, Any] = None) -> None:
    """Log exception with context"""
    
    logger = structlog.get_logger("exceptions")
    
    context = context or {}
    context.update({
        "exception_type": type(exc).__name__,
        "exception_message": str(exc)
    })
    
    logger.error("Exception occurred", **context, exc_info=True)