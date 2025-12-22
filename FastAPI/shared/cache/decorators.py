"""
Cache decorators implementing Cache-Aside pattern.
"""
import functools
import json
import asyncio
from typing import Any, Callable, Optional
from .cache_manager import CacheManager
import logging

logger = logging.getLogger(__name__)


def cache_result(key_prefix: str, ttl: int = 300, key_func: Optional[Callable] = None):
    """
    Decorator to cache function results using Cache-Aside pattern.
    
    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds (default 5 minutes)
        key_func: Function to generate cache key from args/kwargs
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            cache = CacheManager.get_instance()
            
            # Generate cache key
            if key_func:
                cache_key = f"{key_prefix}:{key_func(*args, **kwargs)}"
            else:
                # Default key generation from args
                key_parts = [str(arg) for arg in args] + [f"{k}={v}" for k, v in kwargs.items()]
                cache_key = f"{key_prefix}:{':'.join(key_parts)}"
            
            # Try to get from cache first
            try:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return json.loads(cached_result)
            except Exception as e:
                logger.warning(f"Cache get error for key {cache_key}: {e}")
            
            # Cache miss - execute function
            logger.debug(f"Cache miss for key: {cache_key}")
            result = await func(*args, **kwargs)
            
            # Store result in cache
            try:
                cache.set(cache_key, json.dumps(result, default=str), ttl=ttl)
                logger.debug(f"Cached result for key: {cache_key}")
            except Exception as e:
                logger.warning(f"Cache set error for key {cache_key}: {e}")
            
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            cache = CacheManager.get_instance()
            
            # Generate cache key
            if key_func:
                cache_key = f"{key_prefix}:{key_func(*args, **kwargs)}"
            else:
                # Default key generation from args
                key_parts = [str(arg) for arg in args] + [f"{k}={v}" for k, v in kwargs.items()]
                cache_key = f"{key_prefix}:{':'.join(key_parts)}"
            
            # Try to get from cache first
            try:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return json.loads(cached_result)
            except Exception as e:
                logger.warning(f"Cache get error for key {cache_key}: {e}")
            
            # Cache miss - execute function
            logger.debug(f"Cache miss for key: {cache_key}")
            result = func(*args, **kwargs)
            
            # Store result in cache
            try:
                cache.set(cache_key, json.dumps(result, default=str), ttl=ttl)
                logger.debug(f"Cached result for key: {cache_key}")
            except Exception as e:
                logger.warning(f"Cache set error for key {cache_key}: {e}")
            
            return result
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def invalidate_cache(key_pattern: str):
    """
    Decorator to invalidate cache after function execution.
    
    Args:
        key_pattern: Pattern for cache keys to invalidate
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            result = await func(*args, **kwargs)
            
            # Invalidate cache after successful execution
            try:
                cache = CacheManager.get_instance()
                invalidated = cache.invalidate(key_pattern)
                logger.debug(f"Invalidated {invalidated} cache keys matching pattern: {key_pattern}")
            except Exception as e:
                logger.warning(f"Cache invalidation error for pattern {key_pattern}: {e}")
            
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            result = func(*args, **kwargs)
            
            # Invalidate cache after successful execution
            try:
                cache = CacheManager.get_instance()
                invalidated = cache.invalidate(key_pattern)
                logger.debug(f"Invalidated {invalidated} cache keys matching pattern: {key_pattern}")
            except Exception as e:
                logger.warning(f"Cache invalidation error for pattern {key_pattern}: {e}")
            
            return result
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# Convenience decorators for common use cases
def cache_schedule(ttl: int = 300):
    """Cache schedule-related function results."""
    return cache_result("schedule", ttl=ttl)


def cache_user_data(ttl: int = 600):
    """Cache user-related function results."""
    return cache_result("user", ttl=ttl)


def cache_class_data(ttl: int = 900):
    """Cache class-related function results."""
    return cache_result("class", ttl=ttl)


def invalidate_schedule_cache():
    """Invalidate all schedule-related cache."""
    return invalidate_cache("schedule:*")


def invalidate_user_cache():
    """Invalidate all user-related cache."""
    return invalidate_cache("user:*")


def invalidate_class_cache():
    """Invalidate all class-related cache."""
    return invalidate_cache("class:*")