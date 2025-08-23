"""Proper Prisma integration with FastAPI"""
from prisma import Prisma
import structlog

logger = structlog.get_logger(__name__)

# Global Prisma client instance
prisma_client = None

async def connect_prisma():
    """Initialize Prisma client connection"""
    global prisma_client
    
    try:
        prisma_client = Prisma()
        await prisma_client.connect()
        logger.info("✅ Prisma database connected successfully")
        return prisma_client
    except Exception as e:
        logger.error("❌ Prisma connection failed", error=str(e))
        raise

async def disconnect_prisma():
    """Close Prisma client connection"""
    global prisma_client
    
    if prisma_client:
        await prisma_client.disconnect()
        logger.info("✅ Prisma database disconnected")

def get_prisma() -> Prisma:
    """Get Prisma client instance"""
    global prisma_client
    
    if not prisma_client:
        raise RuntimeError("Prisma client not initialized. Call connect_prisma() first.")
    
    return prisma_client
