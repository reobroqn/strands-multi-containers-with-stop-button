import redis.asyncio as redis
from loguru import logger

from src.config import settings


class RedisClient:
    """Simplified Redis client for stop signals"""

    _client: redis.Redis | None = None

    @classmethod
    async def initialize(cls):
        """Initialize Redis connection"""
        cls._client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30,
        )

        # Test connection
        await cls._client.ping()
        logger.info(f"Redis connected: {settings.redis_url}")

    @classmethod
    async def close(cls):
        """Close Redis connection"""
        if cls._client:
            await cls._client.aclose()
            logger.info("Redis connection closed")

    @classmethod
    async def ping(cls) -> bool:
        """Check if Redis is available"""
        if not cls._client:
            return False
        try:
            await cls._client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False

    @classmethod
    async def set_stop_signal(cls, chat_id: str) -> bool:
        """Set stop signal for a chat"""
        if not cls._client:
            logger.error("Redis client not initialized")
            return False
        try:
            key = f"stop:{chat_id}"
            await cls._client.setex(key, 3600, "1")
            logger.info(f"Stop signal set for chat: {chat_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to set stop signal for {chat_id}: {e}")
            return False

    @classmethod
    async def check_stop_signal(cls, chat_id: str) -> bool:
        """Check and consume stop signal"""
        if not cls._client:
            logger.error("Redis client not initialized")
            return False
        try:
            key = f"stop:{chat_id}"
            # Check and delete in one atomic operation
            result = await cls._client.getdel(key)
            if result:
                logger.info(f"Stop signal consumed for chat: {chat_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to check stop signal for {chat_id}: {e}")
            return False

    @classmethod
    def get_client(cls) -> redis.Redis:
        """Get the Redis client instance"""
        if not cls._client:
            raise RuntimeError("Redis client not initialized")
        return cls._client
