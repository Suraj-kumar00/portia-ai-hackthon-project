"""Database configuration and connection management"""
import asyncpg
from prisma import Prisma
from typing import Optional
import structlog
from .settings import settings

logger = structlog.get_logger(__name__)

class DatabaseManager:
    """Database connection manager for PostgreSQL"""
    
    def __init__(self):
        self.db: Optional[Prisma] = None
        self._connection_pool: Optional[asyncpg.Pool] = None
    
    async def connect(self) -> Prisma:
        """Initialize database connection"""
        if self.db is None:
            try:
                self.db = Prisma()
                await self.db.connect()
                logger.info("Database connected successfully")
            except Exception as e:
                logger.error("Database connection failed", error=str(e))
                raise
        
        return self.db
    
    async def disconnect(self):
        """Close database connection"""
        if self.db:
            await self.db.disconnect()
            logger.info("Database disconnected")
    
    async def get_connection_pool(self) -> asyncpg.Pool:
        """Get asyncpg connection pool for raw queries"""
        if self._connection_pool is None:
            try:
                self._connection_pool = await asyncpg.create_pool(
                    settings.database_url,
                    min_size=5,
                    max_size=20
                )
                logger.info("Connection pool created")
            except Exception as e:
                logger.error("Connection pool creation failed", error=str(e))
                raise
        
        return self._connection_pool
    
    async def close_pool(self):
        """Close connection pool"""
        if self._connection_pool:
            await self._connection_pool.close()
            logger.info("Connection pool closed")

# Global database manager instance
db_manager = DatabaseManager()

async def get_database() -> Prisma:
    """FastAPI dependency to get database connection"""
    return await db_manager.connect()