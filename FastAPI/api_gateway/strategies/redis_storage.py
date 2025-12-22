"""
Redis-based storage for rate limiting using token bucket algorithm.
"""
import time
from typing import Optional
from shared.cache.cache_manager import CacheManager
import logging

logger = logging.getLogger(__name__)


class RedisRateLimitStorage:
    """
    Redis-based storage for rate limiting using token bucket algorithm.
    """
    
    def __init__(self):
        self.cache = CacheManager.get_instance()
        self.key_prefix = "rate_limit"
    
    def _make_key(self, identifier: str, endpoint: str = "default") -> str:
        """Generate rate limit key."""
        return f"{self.key_prefix}:{endpoint}:{identifier}"
    
    def get_bucket_state(self, identifier: str, endpoint: str = "default") -> Optional[dict]:
        """
        Get current bucket state for an identifier.
        
        Args:
            identifier: Client identifier (IP, user ID, API key)
            endpoint: Endpoint identifier for different rate limits
            
        Returns:
            Bucket state dict or None if not found
        """
        key = self._make_key(identifier, endpoint)
        try:
            cached = self.cache.get(key)
            if cached:
                import json
                return json.loads(cached)
        except Exception as e:
            logger.error(f"Error getting bucket state for {key}: {e}")
        return None
    
    def set_bucket_state(self, identifier: str, bucket_state: dict, 
                        endpoint: str = "default", ttl: int = 3600) -> bool:
        """
        Set bucket state for an identifier.
        
        Args:
            identifier: Client identifier
            bucket_state: Current bucket state
            endpoint: Endpoint identifier
            ttl: Time to live in seconds (default 1 hour)
            
        Returns:
            True if successful, False otherwise
        """
        key = self._make_key(identifier, endpoint)
        try:
            import json
            return self.cache.set(key, json.dumps(bucket_state), ttl=ttl)
        except Exception as e:
            logger.error(f"Error setting bucket state for {key}: {e}")
            return False
    
    def delete_bucket_state(self, identifier: str, endpoint: str = "default") -> bool:
        """
        Delete bucket state for an identifier.
        
        Args:
            identifier: Client identifier
            endpoint: Endpoint identifier
            
        Returns:
            True if deleted, False otherwise
        """
        key = self._make_key(identifier, endpoint)
        try:
            return self.cache.delete(key)
        except Exception as e:
            logger.error(f"Error deleting bucket state for {key}: {e}")
            return False
    
    def cleanup_expired_buckets(self) -> int:
        """
        Clean up expired bucket states.
        Note: Redis handles TTL automatically, but this can be used for manual cleanup.
        
        Returns:
            Number of keys cleaned up
        """
        try:
            # Get all rate limit keys
            pattern = f"{self.key_prefix}:*"
            return self.cache.invalidate(pattern)
        except Exception as e:
            logger.error(f"Error cleaning up expired buckets: {e}")
            return 0


class TokenBucket:
    """
    Token bucket implementation for rate limiting with Redis storage.
    """
    
    def __init__(self, capacity: int, refill_rate: float, storage: RedisRateLimitStorage):
        """
        Initialize token bucket.
        
        Args:
            capacity: Maximum number of tokens
            refill_rate: Tokens per second refill rate
            storage: Redis storage instance
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.storage = storage
    
    def consume(self, identifier: str, tokens: int = 1, endpoint: str = "default") -> bool:
        """
        Try to consume tokens from the bucket.
        
        Args:
            identifier: Client identifier
            tokens: Number of tokens to consume
            endpoint: Endpoint identifier
            
        Returns:
            True if tokens were consumed, False if rate limited
        """
        current_time = time.time()
        
        # Get current bucket state
        bucket_state = self.storage.get_bucket_state(identifier, endpoint)
        
        if bucket_state is None:
            # Initialize new bucket
            bucket_state = {
                'tokens': self.capacity,
                'last_refill': current_time
            }
        else:
            # Refill tokens based on time elapsed
            time_elapsed = current_time - bucket_state['last_refill']
            tokens_to_add = time_elapsed * self.refill_rate
            bucket_state['tokens'] = min(
                self.capacity,
                bucket_state['tokens'] + tokens_to_add
            )
            bucket_state['last_refill'] = current_time
        
        # Check if we can consume the requested tokens
        if bucket_state['tokens'] >= tokens:
            bucket_state['tokens'] -= tokens
            # Save updated state
            self.storage.set_bucket_state(identifier, bucket_state, endpoint)
            return True
        else:
            # Save state even if we can't consume (for accurate refill tracking)
            self.storage.set_bucket_state(identifier, bucket_state, endpoint)
            return False
    
    def get_remaining_tokens(self, identifier: str, endpoint: str = "default") -> float:
        """
        Get remaining tokens for an identifier.
        
        Args:
            identifier: Client identifier
            endpoint: Endpoint identifier
            
        Returns:
            Number of remaining tokens
        """
        current_time = time.time()
        bucket_state = self.storage.get_bucket_state(identifier, endpoint)
        
        if bucket_state is None:
            return self.capacity
        
        # Calculate current tokens with refill
        time_elapsed = current_time - bucket_state['last_refill']
        tokens_to_add = time_elapsed * self.refill_rate
        current_tokens = min(
            self.capacity,
            bucket_state['tokens'] + tokens_to_add
        )
        
        return current_tokens
    
    def reset_bucket(self, identifier: str, endpoint: str = "default") -> bool:
        """
        Reset bucket for an identifier.
        
        Args:
            identifier: Client identifier
            endpoint: Endpoint identifier
            
        Returns:
            True if reset successful
        """
        return self.storage.delete_bucket_state(identifier, endpoint)