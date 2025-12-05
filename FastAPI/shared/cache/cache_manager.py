"""
Cache Manager implementing Singleton pattern with Redis.
"""
import os
import redis
from typing import Optional, Any
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)


class CacheManager:
    """
    Singleton class for managing Redis cache connection.
    """
    _instance: Optional['CacheManager'] = None
    _redis_client: Optional[redis.Redis] = None

    def __new__(cls) -> 'CacheManager':
        """Create or return existing instance (Singleton pattern)"""
        if cls._instance is None:
            cls._instance = super(CacheManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        """Initialize Redis connection"""
        try:
            redis_host = os.getenv('REDIS_HOST', 'localhost')
            redis_port = int(os.getenv('REDIS_PORT', 6379))
            redis_db = int(os.getenv('REDIS_DB', 0))
            redis_password = os.getenv('REDIS_PASSWORD', None)

            self._redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )

            # Test connection
            self._redis_client.ping()
            logger.info("Redis cache connection initialized successfully")

        except Exception as e:
            logger.warning(f"Failed to initialize Redis connection: {e}. Cache will be disabled.")
            self._redis_client = None

    @classmethod
    def get_instance(cls) -> 'CacheManager':
        """Get the singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def client(self) -> Optional[redis.Redis]:
        """Get Redis client"""
        return self._redis_client

    def get(self, key: str) -> Optional[str]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if not self._redis_client:
            return None
        try:
            return self._redis_client.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    def set(self, key: str, value: str, ttl: int = 300) -> bool:
        """
        Set value in cache with TTL.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default 5 minutes)
            
        Returns:
            True if successful, False otherwise
        """
        if not self._redis_client:
            return False
        try:
            self._redis_client.setex(key, ttl, value)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if deleted, False otherwise
        """
        if not self._redis_client:
            return False
        try:
            self._redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False

    def invalidate(self, pattern: str) -> int:
        """
        Invalidate all keys matching a pattern.
        
        Args:
            pattern: Key pattern (e.g., "schedule:*")
            
        Returns:
            Number of keys deleted
        """
        if not self._redis_client:
            return 0
        try:
            keys = self._redis_client.keys(pattern)
            if keys:
                return self._redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache invalidate error for pattern {pattern}: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if exists, False otherwise
        """
        if not self._redis_client:
            return False
        try:
            return self._redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False

    def close(self) -> None:
        """Close Redis connection"""
        if self._redis_client:
            self._redis_client.close()
            logger.info("Redis cache connection closed")
